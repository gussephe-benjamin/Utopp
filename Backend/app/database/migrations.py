from sqlalchemy import text
from sqlalchemy.engine import Engine


def run_migrations(engine: Engine) -> None:
    """Ejecuta migraciones manuales necesarias para la BD existente (solo PostgreSQL)."""
    if engine.dialect.name != "postgresql":
        return
    with engine.connect() as conn:
        # 1. Agregar valor 'no_deadline' al enum time_status_enum si no existe
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_enum
                    WHERE enumlabel = 'no_deadline'
                    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'time_status_enum')
                ) THEN
                    ALTER TYPE time_status_enum ADD VALUE 'no_deadline';
                END IF;
            END$$;
        """))

        # 2. Agregar valor 'in_time' al enum time_status_enum si no existe
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_enum
                    WHERE enumlabel = 'in_time'
                    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'time_status_enum')
                ) THEN
                    ALTER TYPE time_status_enum ADD VALUE 'in_time';
                END IF;
            END$$;
        """))

        # 3. Agregar valor 'out_of_time' al enum time_status_enum si no existe
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_enum
                    WHERE enumlabel = 'out_of_time'
                    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'time_status_enum')
                ) THEN
                    ALTER TYPE time_status_enum ADD VALUE 'out_of_time';
                END IF;
            END$$;
        """))

        conn.commit()

        # 13. Índices de rendimiento para feed y relaciones sociales
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_posts_feed_ranked
            ON posts (status, is_pinned, pin_priority, created_at DESC);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_posts_feed_filtering
            ON posts (status, post_type, subtype, deadline_at, created_at DESC);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_follows_follower_created
            ON follows (follower_id, created_at DESC);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_saved_posts_user_saved
            ON saved_posts (user_id, saved_at DESC);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_participants_post_status
            ON post_participants (post_id, status);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_posts_tags_gin
            ON posts USING GIN (tags);
        """))

        conn.commit()

        # 4. Agregar columna time_status si no existe
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'posts' AND column_name = 'time_status'
                ) THEN
                    ALTER TABLE posts
                    ADD COLUMN time_status time_status_enum NOT NULL DEFAULT 'no_deadline';
                END IF;
            END$$;
        """))

        conn.commit()

        # 5. Migrar posts que tenían status='out_of_time' al nuevo modelo:
        #    - status -> published
        #    - time_status -> out_of_time
        #    Solo ejecutar si el valor 'out_of_time' aún existe en post_status_enum
        conn.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_enum
                    WHERE enumlabel = 'out_of_time'
                    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'post_status_enum')
                ) THEN
                    UPDATE posts
                    SET status = 'published'::post_status_enum,
                        time_status = 'out_of_time'::time_status_enum
                    WHERE status::text = 'out_of_time';
                END IF;
            END$$;
        """))

        conn.commit()

        # 6. Actualizar time_status para posts existentes según deadline_at
        conn.execute(text("""
            UPDATE posts
            SET time_status = CASE
                WHEN deadline_at IS NULL THEN 'no_deadline'::time_status_enum
                WHEN deadline_at > NOW() THEN 'in_time'::time_status_enum
                ELSE 'out_of_time'::time_status_enum
            END
            WHERE time_status = 'no_deadline' AND deadline_at IS NOT NULL;
        """))

        conn.commit()

        # 7. Hacer title nullable para soportar simple_post sin título
        conn.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'posts'
                    AND column_name = 'title'
                    AND is_nullable = 'NO'
                ) THEN
                    ALTER TABLE posts ALTER COLUMN title DROP NOT NULL;
                END IF;
            END$$;
        """))

        conn.commit()

        # 8. Agregar columna object_position a post_images si no existe
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'post_images' AND column_name = 'object_position'
                ) THEN
                    ALTER TABLE post_images ADD COLUMN object_position VARCHAR(64);
                END IF;
            END$$;
        """))

        conn.commit()

        # 9. Agregar columna scale a post_images si no existe
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'post_images' AND column_name = 'scale'
                ) THEN
                    ALTER TABLE post_images ADD COLUMN scale FLOAT;
                END IF;
            END$$;
        """))

        conn.commit()

        # 10. Agregar columna identifier a roles si no existe
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'roles' AND column_name = 'identifier'
                ) THEN
                    ALTER TABLE roles ADD COLUMN identifier SMALLINT;
                END IF;
            END$$;
        """))

        conn.commit()

        # 11. Garantizar datos válidos para roles.identifier existentes y futuros
        conn.execute(text("""
            UPDATE roles
            SET identifier = CASE LOWER(name)
                WHEN 'estudiante' THEN 1
                WHEN 'organización estudiantil' THEN 2
                WHEN 'oficina' THEN 3
                WHEN 'administrador' THEN 4
                WHEN 'root' THEN 5
                ELSE identifier
            END
            WHERE identifier IS NULL;
        """))

        conn.execute(text("""
            WITH missing_roles AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS row_num
                FROM roles
                WHERE identifier IS NULL
            ),
            max_identifier AS (
                SELECT COALESCE(MAX(identifier), 0) AS current_max
                FROM roles
            )
            UPDATE roles
            SET identifier = max_identifier.current_max + missing_roles.row_num
            FROM missing_roles
            CROSS JOIN max_identifier
            WHERE roles.id = missing_roles.id;
        """))

        conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_identifier ON roles (identifier);
        """))

        conn.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'roles'
                    AND column_name = 'identifier'
                    AND is_nullable = 'YES'
                ) AND NOT EXISTS (
                    SELECT 1 FROM roles WHERE identifier IS NULL
                ) THEN
                    ALTER TABLE roles ALTER COLUMN identifier SET NOT NULL;
                END IF;
            END$$;
        """))

        conn.commit()

        # 12. Agregar columnas is_pinned y pin_priority a posts si no existen
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'posts' AND column_name = 'is_pinned'
                ) THEN
                    ALTER TABLE posts ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;
                END IF;
            END$$;
        """))

        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'posts' AND column_name = 'pin_priority'
                ) THEN
                    ALTER TABLE posts ADD COLUMN pin_priority SMALLINT NOT NULL DEFAULT 0;
                END IF;
            END$$;
        """))

        conn.commit()

        # 14. Términos y condiciones versionados + aceptaciones (evidencia)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS legal_documents (
                id BIGSERIAL PRIMARY KEY,
                slug VARCHAR(64) NOT NULL,
                version VARCHAR(32) NOT NULL,
                title VARCHAR(255),
                content TEXT NOT NULL,
                content_sha256 VARCHAR(64),
                effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                is_active BOOLEAN NOT NULL DEFAULT FALSE,
                superseded_by_id BIGINT REFERENCES legal_documents(id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS terms_acceptances (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                legal_document_id BIGINT NOT NULL REFERENCES legal_documents(id),
                accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                ip_address VARCHAR(64),
                user_agent VARCHAR(512),
                auth_method VARCHAR(32) NOT NULL DEFAULT 'google_oauth',
                document_hash VARCHAR(64),
                idempotency_key VARCHAR(64) UNIQUE
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_terms_acceptances_user
            ON terms_acceptances (user_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_terms_acceptances_user_accepted
            ON terms_acceptances (user_id, accepted_at DESC);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_terms_acceptances_user_document
            ON terms_acceptances (user_id, legal_document_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_legal_documents_slug
            ON legal_documents (slug);
        """))
        conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS uq_legal_one_active_per_slug
            ON legal_documents (slug) WHERE is_active;
        """))
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'last_accepted_legal_document_id'
                ) THEN
                    ALTER TABLE users
                    ADD COLUMN last_accepted_legal_document_id BIGINT
                    REFERENCES legal_documents(id);
                END IF;
            END$$;
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_last_accepted_legal
            ON users (last_accepted_legal_document_id);
        """))
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'last_accepted_privacy_document_id'
                ) THEN
                    ALTER TABLE users
                    ADD COLUMN last_accepted_privacy_document_id BIGINT
                    REFERENCES legal_documents(id);
                END IF;
            END$$;
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_last_accepted_privacy
            ON users (last_accepted_privacy_document_id);
        """))

        # 15. Agregar columnas description y contacts a users
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'description'
                ) THEN
                    ALTER TABLE users ADD COLUMN description VARCHAR(1000);
                END IF;
            END$$;
        """))
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'contacts'
                ) THEN
                    ALTER TABLE users ADD COLUMN contacts JSON DEFAULT '{}'::json;
                END IF;
            END$$;
        """))

        conn.commit()

        # 15. Agregar columna aspect_ratio a posts si no existe (formato estilo Instagram)
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'posts' AND column_name = 'aspect_ratio'
                ) THEN
                    ALTER TABLE posts
                    ADD COLUMN aspect_ratio VARCHAR(8) NOT NULL DEFAULT '4:5';
                END IF;
            END$$;
        """))

        conn.commit()

        # 16. Perfil de organización: descripción y contactos en users
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'description'
                ) THEN
                    ALTER TABLE users ADD COLUMN description TEXT;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'contacts'
                ) THEN
                    ALTER TABLE users ADD COLUMN contacts JSONB;
                END IF;
            END$$;
        """))

        conn.commit()

        # 17. Disponibilidad semanal detallada (onboarding)
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'weekly_availability'
                ) THEN
                    ALTER TABLE users ADD COLUMN weekly_availability JSONB;
                END IF;
            END$$;
        """))

        conn.commit()

        # 18. Nuevos subtipos de evento y migración hackathon → emprendimiento
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_enum
                    WHERE enumlabel = 'congresos_talleres'
                    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'sub_post_type_enum')
                ) THEN
                    ALTER TYPE sub_post_type_enum ADD VALUE 'congresos_talleres';
                END IF;
            END$$;
        """))
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_enum
                    WHERE enumlabel = 'competencias'
                    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'sub_post_type_enum')
                ) THEN
                    ALTER TYPE sub_post_type_enum ADD VALUE 'competencias';
                END IF;
            END$$;
        """))
        conn.commit()

        conn.execute(text("""
            UPDATE posts
            SET subtype = 'emprendimiento'::sub_post_type_enum
            WHERE subtype::text = 'hackathon';
        """))
        conn.commit()

        # 19. Reacciones (me gusta) y comentarios en publicaciones
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS post_reactions (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_post_reactions_user_post UNIQUE (user_id, post_id)
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_post_reactions_post
            ON post_reactions (post_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_post_reactions_user
            ON post_reactions (user_id);
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS post_comments (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_post_comments_post_created
            ON post_comments (post_id, created_at);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_post_comments_user
            ON post_comments (user_id);
        """))
        conn.commit()
