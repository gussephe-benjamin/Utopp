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
