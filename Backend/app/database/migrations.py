from sqlalchemy import text
from sqlalchemy.engine import Engine


def run_migrations(engine: Engine) -> None:
    """Ejecuta migraciones manuales necesarias para la BD existente."""
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
