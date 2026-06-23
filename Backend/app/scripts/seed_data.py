"""Script para poblar la base de datos de Utopp con usuarios y organizaciones de prueba.

Ejecución desde el contenedor Docker:
  docker compose exec backend python -m app.scripts.seed_data

Ejecución local:
  python Backend/app/scripts/seed_data.py --host 127.0.0.1
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))


def _apply_database_cli_overrides(database_url: str | None, host: str | None) -> None:
    if database_url:
        os.environ["DATABASE_URL"] = database_url
        return
    if not host:
        return
    base = os.getenv("DATABASE_URL")
    if not base:
        print("Error: DATABASE_URL no está definida; usa --database-url.", file=sys.stderr)
        raise SystemExit(1)
    try:
        from sqlalchemy.engine.url import make_url

        url = make_url(base).set(host=host)
        os.environ["DATABASE_URL"] = url.render_as_string(hide_password=False)
    except Exception as e:
        print(f"Error al aplicar --host: {e}", file=sys.stderr)
        raise SystemExit(1) from e


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Pobla la base de datos de Utopp con datos de prueba."
    )
    parser.add_argument(
        "--database-url",
        metavar="URL",
        help="Sobrescribe DATABASE_URL solo para este proceso.",
    )
    parser.add_argument(
        "--host",
        metavar="HOST",
        help='Reemplaza el host de DATABASE_URL (ej. "127.0.0.1" cuando en .env figura "db").',
    )
    args = parser.parse_args()

    if args.database_url and args.host:
        print("Error: usa solo uno de --database-url o --host.", file=sys.stderr)
        return 1

    _apply_database_cli_overrides(args.database_url, args.host)

    from app.database.session import SessionLocal
    from app.models.user import User
    from app.models.role import Role
    from app.models.user_role import UserRole
    from app.models.user_profile_image import UserProfileImage
    from app.models.follow import Follow
    from app.models.post import Post, PostType, PostStatus, TimeStatus
    from app.models.post_image import PostImage
    from app.models.post_link import PostLink
    from app.models.event_participant import PostParticipant, PostParticipantStatus
    from app.models.legal import LegalDocument
    from app.core.security import hash_password
    from app.services import role_service

    db = SessionLocal()
    try:
        print("1. Sincronizando roles del catálogo...")
        role_service.seed_default_roles_if_empty(db)

        student_role = db.query(Role).filter(Role.name == role_service.STUDENT_ROLE_NAME).first()
        org_role = db.query(Role).filter(Role.name == role_service.ORG_ROLE_NAME).first()

        if not student_role or not org_role:
            print("Error: Los roles necesarios no están creados.")
            return 1

        print("2. Asegurando documentos legales activos...")
        terms_doc = db.query(LegalDocument).filter(LegalDocument.slug == "terms", LegalDocument.is_active == True).first()
        privacy_doc = db.query(LegalDocument).filter(LegalDocument.slug == "privacy", LegalDocument.is_active == True).first()

        if not terms_doc:
            terms_doc = LegalDocument(
                slug="terms",
                version="1.0",
                title="Términos y Condiciones de Uso",
                content="Términos de servicio de prueba para Utopp.",
                is_active=True,
            )
            db.add(terms_doc)
            db.flush()
        if not privacy_doc:
            privacy_doc = LegalDocument(
                slug="privacy",
                version="1.0",
                title="Política de Privacidad de Datos",
                content="Política de privacidad de prueba para Utopp.",
                is_active=True,
            )
            db.add(privacy_doc)
            db.flush()

        hashed_pw = hash_password("Password123!")

        # 3. Datos de Alumnos
        students_data = [
            {
                "email": "esteban@utec.edu.pe",
                "full_name": "Esteban Alumno",
                "career": "Ingeniería de Software",
                "cycle": 6,
                "interests": ["Software", "IA", "Emprendimiento"],
                "avatar_seed": "Esteban",
            },
            {
                "email": "juan.perez@utec.edu.pe",
                "full_name": "Juan Perez",
                "career": "Ingeniería Mecatrónica",
                "cycle": 4,
                "interests": ["Robótica", "Automatización"],
                "avatar_seed": "Juan",
            },
            {
                "email": "maria.gomez@utec.edu.pe",
                "full_name": "Maria Gomez",
                "career": "Bioingeniería",
                "cycle": 8,
                "interests": ["Biotecnología", "Salud"],
                "avatar_seed": "Maria",
            },
            {
                "email": "sofia.rodriguez@utec.edu.pe",
                "full_name": "Sofia Rodriguez",
                "career": "Ciencia de la Computación",
                "cycle": 5,
                "interests": ["IA", "Algoritmos", "Hackathons"],
                "avatar_seed": "Sofia",
            },
        ]

        # 4. Datos de Organizaciones
        orgs_data = [
            {
                "email": "ieee@utec.edu.pe",
                "full_name": "IEEE UTEC",
                "contacts": {
                    "web": "https://ieee.utec.edu.pe",
                    "linkedin": "https://linkedin.com/company/ieee-utec",
                    "instagram": "https://instagram.com/ieee.utec",
                },
                "description": "Rama estudiantil de IEEE en la Universidad de Ingeniería y Tecnología. Fomentamos la innovación tecnológica y el desarrollo profesional.",
                "avatar_seed": "IEEE UTEC",
            },
            {
                "email": "ieee.aess@utec.edu.pe",
                "full_name": "IEEE AESS UTEC",
                "contacts": {
                    "web": "https://ieee.utec.edu.pe/aess",
                },
                "description": "Capítulo estudiantil de IEEE Aerospace and Electronic Systems Society en UTEC.",
                "avatar_seed": "IEEE AESS UTEC",
            },
            {
                "email": "careercenter@utec.edu.pe",
                "full_name": "UTEC Career Center",
                "contacts": {
                    "web": "https://careercenter.utec.edu.pe",
                },
                "description": "Centro de desarrollo de carrera de UTEC. Conectamos talento con oportunidades laborales.",
                "avatar_seed": "UTEC Career Center",
            },
            {
                "email": "emprende@utec.edu.pe",
                "full_name": "UTEC Emprende",
                "contacts": {
                    "instagram": "https://instagram.com/utecemprende",
                },
                "description": "Fomentamos el espíritu emprendedor y la creación de startups en la comunidad universitaria.",
                "avatar_seed": "UTEC Emprende",
            },
            {
                "email": "techoperu@utec.edu.pe",
                "full_name": "TECHO Perú",
                "contacts": {
                    "web": "https://techo.org/peru",
                },
                "description": "Organización sin fines de lucro que busca superar la situación de pobreza en la que viven millones de personas en asentamientos populares.",
                "avatar_seed": "TECHO Peru",
            },
            {
                "email": "acm@utec.edu.pe",
                "full_name": "ACM UTEC",
                "contacts": {
                    "web": "https://acm.utec.edu.pe",
                },
                "description": "Capítulo estudiantil de ACM en UTEC. Comunidad de computación y ciencias de la computación.",
                "avatar_seed": "ACM UTEC",
            },
            {
                "email": "biomakers@utec.edu.pe",
                "full_name": "BioMakers UTEC",
                "contacts": {
                    "instagram": "https://instagram.com/biomakers.utec",
                },
                "description": "Grupo de afinidad en bioingeniería y biotecnología. Creamos soluciones innovadoras utilizando la biología como tecnología.",
                "avatar_seed": "BioMakers UTEC",
            },
        ]

        print("3. Poblando Alumnos...")
        user_by_email: dict[str, User] = {}
        for item in students_data:
            user = db.query(User).filter(User.email == item["email"]).first()
            if not user:
                user = User(
                    email=item["email"],
                    full_name=item["full_name"],
                    hashed_password=hashed_pw,
                    is_onboarding_completed=True,
                    career=item["career"],
                    cycle=item["cycle"],
                    interests=item["interests"],
                    contacts={},
                    last_accepted_legal_document_id=terms_doc.id,
                    last_accepted_privacy_document_id=privacy_doc.id,
                )
                db.add(user)
                db.flush()
                print(f"  + Alumno creado: {item['full_name']} ({item['email']})")
            else:
                user.is_onboarding_completed = True
                user.career = item["career"]
                user.cycle = item["cycle"]
                user.interests = item["interests"]
                db.flush()
                print(f"  ~ Alumno actualizado: {item['full_name']}")

            user_by_email[item["email"]] = user

            # Asegurar UserRole estudiante
            role_link = db.query(UserRole).filter(UserRole.user_id == user.id).first()
            if not role_link:
                db.add(UserRole(user_id=user.id, role_id=student_role.id))
            elif role_link.role_id != student_role.id:
                role_link.role_id = student_role.id
            db.flush()

            # Asegurar UserProfileImage activa usando Dicebear
            profile_img = db.query(UserProfileImage).filter(UserProfileImage.user_id == user.id, UserProfileImage.is_active == True).first()
            if not profile_img:
                avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={item['avatar_seed']}"
                db.add(UserProfileImage(
                    user_id=user.id,
                    cloudinary_id=f"seed_avatar_student_{user.id}",
                    url=avatar_url,
                    is_active=True,
                    position=0,
                ))
                db.flush()

        print("4. Poblando Organizaciones...")
        for item in orgs_data:
            user = db.query(User).filter(User.email == item["email"]).first()
            if not user:
                user = User(
                    email=item["email"],
                    full_name=item["full_name"],
                    hashed_password=hashed_pw,
                    is_onboarding_completed=True,
                    contacts=item["contacts"],
                    description=item["description"],
                    last_accepted_legal_document_id=terms_doc.id,
                    last_accepted_privacy_document_id=privacy_doc.id,
                )
                db.add(user)
                db.flush()
                print(f"  + Org creada: {item['full_name']} ({item['email']})")
            else:
                user.is_onboarding_completed = True
                user.contacts = item["contacts"]
                user.description = item["description"]
                db.flush()
                print(f"  ~ Org actualizada: {item['full_name']}")

            user_by_email[item["email"]] = user

            # Asegurar UserRole org
            role_link = db.query(UserRole).filter(UserRole.user_id == user.id).first()
            if not role_link:
                db.add(UserRole(user_id=user.id, role_id=org_role.id))
            elif role_link.role_id != org_role.id:
                role_link.role_id = org_role.id
            db.flush()

            # Asegurar UserProfileImage activa usando Dicebear
            profile_img = db.query(UserProfileImage).filter(UserProfileImage.user_id == user.id, UserProfileImage.is_active == True).first()
            if not profile_img:
                avatar_url = f"https://api.dicebear.com/7.x/initials/svg?seed={item['avatar_seed']}"
                db.add(UserProfileImage(
                    user_id=user.id,
                    cloudinary_id=f"seed_avatar_org_{user.id}",
                    url=avatar_url,
                    is_active=True,
                    position=0,
                ))
                db.flush()

        # 5. Seeding de Posts/Eventos por organizaciones
        posts_data = [
            {
                "org_email": "ieee.aess@utec.edu.pe",
                "title": "Charla: Sistemas Aeroespaciales y Drones",
                "description": "Conoce las últimas tendencias en sistemas aeroespaciales, sensores remotos y aplicaciones con drones en la industria.",
                "post_type": "event",
                "subtype": "conferencia",
                "tags": ["Aeroespacial", "Drones", "IEEE"],
                "deadline_days": 7,
            },
            {
                "org_email": "ieee@utec.edu.pe",
                "title": "Hackathon UTEC 2026",
                "description": "Participa en la hackathon más grande de la universidad. Desarrolla soluciones reales para problemáticas locales en 36 horas continuas de programación.",
                "post_type": "event",
                "subtype": "hackathon",
                "tags": ["Hackathon", "Programación", "Innovación"],
                "deadline_days": 10,
            },
            {
                "org_email": "ieee@utec.edu.pe",
                "title": "Workshop de Internet de las Cosas (IoT)",
                "description": "Aprende las bases de IoT con microcontroladores ESP32 y sensores de temperatura, humedad y presencia. Taller 100% práctico.",
                "post_type": "event",
                "subtype": "conferencia",
                "tags": ["IoT", "Hardware", "Tecnología"],
                "deadline_days": 5,
            },
            {
                "org_email": "careercenter@utec.edu.pe",
                "title": "Feria de Empleo Tecnológico 2026",
                "description": "Conéctate con más de 30 empresas líderes en tecnología y postula a prácticas pre-profesionales y profesionales.",
                "post_type": "event",
                "subtype": "empleo",
                "tags": ["Empleo", "Prácticas", "Feria"],
                "deadline_days": 15,
            },
            {
                "org_email": "emprende@utec.edu.pe",
                "title": "Programa de Incubadora de Startups - Ciclo 2026-I",
                "description": "Tienes una idea de negocio? Postula al programa de incubación de UTEC Emprende y recibe mentorías personalizadas de expertos del ecosistema.",
                "post_type": "event",
                "subtype": "emprendimiento",
                "tags": ["Startups", "Emprendimiento", "Incubación"],
                "deadline_days": 20,
            },
            {
                "org_email": "techoperu@utec.edu.pe",
                "title": "Gran Colecta Nacional TECHO 2026",
                "description": "Buscamos voluntarios para la Colecta Nacional. Ayúdanos a registrar fondos para seguir construyendo viviendas de emergencia en todo el país.",
                "post_type": "event",
                "subtype": "voluntariado",
                "tags": ["Voluntariado", "AyudaSocial", "TECHO"],
                "deadline_days": 8,
            },
            {
                "org_email": "acm@utec.edu.pe",
                "title": "Concurso de Programación Competitiva ACM-ICPC",
                "description": "Prepárate para la clasificatoria nacional de la ICPC. Pon a prueba tus habilidades de resolución de problemas bajo presión.",
                "post_type": "academic_project",
                "subtype": "competencia",
                "tags": ["Programación", "Algoritmos", "Competencia"],
                "deadline_days": 12,
            },
            {
                "org_email": "biomakers@utec.edu.pe",
                "title": "Proyecto de Bio-Impresión 3D de Tejidos",
                "description": "Buscamos estudiantes de bioingeniería y ciencias de la computación para colaborar en el desarrollo de un extrusor de biomateriales.",
                "post_type": "academic_project",
                "subtype": "proyecto_investigacion",
                "tags": ["Biotecnología", "Investigación", "BioMakers"],
                "deadline_days": 25,
            },
        ]

        print("5. Poblando Posts/Eventos...")
        for item in posts_data:
            org_user = user_by_email.get(item["org_email"])
            if not org_user:
                continue

            existing_post = db.query(Post).filter(Post.title == item["title"], Post.user_id == org_user.id).first()
            deadline_at = datetime.now(timezone.utc) + timedelta(days=item["deadline_days"])

            if not existing_post:
                post = Post(
                    user_id=org_user.id,
                    title=item["title"],
                    description=item["description"],
                    status=PostStatus.published,
                    post_type=PostType(item["post_type"]),
                    subtype=item["subtype"],
                    deadline_at=deadline_at,
                    time_status=TimeStatus.in_time,
                    tags=item["tags"],
                )
                db.add(post)
                print(f"  + Post creado: '{item['title']}' por {org_user.full_name}")
            else:
                existing_post.description = item["description"]
                existing_post.post_type = PostType(item["post_type"])
                existing_post.subtype = item["subtype"]
                existing_post.deadline_at = deadline_at
                existing_post.time_status = TimeStatus.in_time
                existing_post.tags = item["tags"]
                print(f"  ~ Post actualizado: '{item['title']}'")
            db.flush()

        # 6. Poblando Relaciones de Follow (Seguimiento)
        follows_data = [
            ("esteban@utec.edu.pe", "ieee@utec.edu.pe"),
            ("esteban@utec.edu.pe", "ieee.aess@utec.edu.pe"),
            ("esteban@utec.edu.pe", "techoperu@utec.edu.pe"),
            ("esteban@utec.edu.pe", "emprende@utec.edu.pe"),
            ("juan.perez@utec.edu.pe", "ieee@utec.edu.pe"),
            ("juan.perez@utec.edu.pe", "careercenter@utec.edu.pe"),
            ("maria.gomez@utec.edu.pe", "biomakers@utec.edu.pe"),
            ("maria.gomez@utec.edu.pe", "techoperu@utec.edu.pe"),
            ("sofia.rodriguez@utec.edu.pe", "acm@utec.edu.pe"),
            ("sofia.rodriguez@utec.edu.pe", "ieee@utec.edu.pe"),
            ("sofia.rodriguez@utec.edu.pe", "biomakers@utec.edu.pe"),
        ]

        print("6. Poblando Seguimientos...")
        for follower_email, following_email in follows_data:
            follower = user_by_email.get(follower_email)
            following = user_by_email.get(following_email)

            if not follower or not following:
                continue

            existing_follow = db.query(Follow).filter(
                Follow.follower_id == follower.id,
                Follow.following_id == following.id
            ).first()

            if not existing_follow:
                follow = Follow(follower_id=follower.id, following_id=following.id)
                db.add(follow)
                print(f"  + Seguidor creado: {follower.full_name} -> {following.full_name}")

        # 7. Poblando Participaciones en Eventos
        participants_data = [
            # Evento: Hackathon UTEC 2026 (IEEE UTEC)
            ("esteban@utec.edu.pe", "Hackathon UTEC 2026", "going"),
            ("juan.perez@utec.edu.pe", "Hackathon UTEC 2026", "going"),
            ("sofia.rodriguez@utec.edu.pe", "Hackathon UTEC 2026", "attended"),
            ("maria.gomez@utec.edu.pe", "Hackathon UTEC 2026", "interested"), # No se cuenta para promedio de asistencia confirmada

            # Evento: Workshop de Internet de las Cosas (IoT) (IEEE UTEC)
            ("esteban@utec.edu.pe", "Workshop de Internet de las Cosas (IoT)", "going"),
            ("maria.gomez@utec.edu.pe", "Workshop de Internet de las Cosas (IoT)", "going"),
            ("sofia.rodriguez@utec.edu.pe", "Workshop de Internet de las Cosas (IoT)", "going"),

            # Evento: Feria de Empleo Tecnológico 2026 (UTEC Career Center)
            ("juan.perez@utec.edu.pe", "Feria de Empleo Tecnológico 2026", "going"),
            ("maria.gomez@utec.edu.pe", "Feria de Empleo Tecnológico 2026", "attended"),

            # Evento: Programa de Incubadora de Startups - Ciclo 2026-I (UTEC Emprende)
            ("esteban@utec.edu.pe", "Programa de Incubadora de Startups - Ciclo 2026-I", "going"),

            # Evento: Gran Colecta Nacional TECHO 2026 (TECHO Perú)
            ("esteban@utec.edu.pe", "Gran Colecta Nacional TECHO 2026", "attended"),
            ("juan.perez@utec.edu.pe", "Gran Colecta Nacional TECHO 2026", "going"),
            ("maria.gomez@utec.edu.pe", "Gran Colecta Nacional TECHO 2026", "going"),
            ("sofia.rodriguez@utec.edu.pe", "Gran Colecta Nacional TECHO 2026", "going"),
        ]

        print("7. Poblando Participantes de Eventos...")
        for user_email, post_title, status_str in participants_data:
            participant_user = user_by_email.get(user_email)
            event_post = db.query(Post).filter(Post.title == post_title).first()

            if not participant_user or not event_post:
                continue

            existing_part = db.query(PostParticipant).filter(
                PostParticipant.user_id == participant_user.id,
                PostParticipant.post_id == event_post.id
            ).first()

            if not existing_part:
                part = PostParticipant(
                    user_id=participant_user.id,
                    post_id=event_post.id,
                    status=PostParticipantStatus(status_str)
                )
                db.add(part)
                print(f"  + Participante creado: {participant_user.full_name} -> {post_title} ({status_str})")

        db.commit()
        print("\nSeeding completado exitosamente! 🎉")
        return 0
    except Exception as e:
        db.rollback()
        print(f"\nError durante el seeding: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
