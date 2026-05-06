from typing import List

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import require_terms_accepted
from app.models.user import User
from app.models.post import Post, PostStatus
from app.models.user_role import UserRole
from app.models.role import Role


ADMIN_ROLE_NAME = "administrador"


def is_admin(user: User, db: Session) -> bool:
    """Verifica si el usuario tiene rol de admin."""
    admin_role = db.query(Role).filter(Role.name == ADMIN_ROLE_NAME).first()
    if not admin_role:
        return False
    
    user_role = db.query(UserRole).filter(
        UserRole.user_id == user.id,
        UserRole.role_id == admin_role.id
    ).first()
    
    return user_role is not None


def get_user_roles(user: User, db: Session) -> List[str]:
    """Obtiene los nombres de roles de un usuario."""
    user_roles = db.query(UserRole).filter(UserRole.user_id == user.id).all()
    role_ids = [ur.role_id for ur in user_roles]
    
    if not role_ids:
        return []
    
    roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
    return [r.name for r in roles]


def require_admin(
    current_user: User = Depends(require_terms_accepted),
    db: Session = Depends(get_db)
) -> User:
    """Requiere que el usuario sea administrador."""
    if not is_admin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador"
        )
    return current_user


class PostPermissionChecker:
    """Verifica permisos sobre un post específico."""
    
    def __init__(self, allow_archived: bool = False):
        self.allow_archived = allow_archived
    
    def __call__(
        self,
        post_id: int,
        current_user: User = Depends(require_terms_accepted),
        db: Session = Depends(get_db)
    ) -> Post:
        post = db.query(Post).filter(Post.id == post_id).first()
        
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post no encontrado"
            )
        
        # Verificar si está archivado (si no se permite)
        if not self.allow_archived and post.status == PostStatus.archived:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede modificar un post archivado"
            )
        
        # Verificar ownership o admin
        if post.user_id != current_user.id and not is_admin(current_user, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para modificar este post"
            )
        
        return post


# Instancias pre-configuradas para uso común
require_owner_or_admin = PostPermissionChecker(allow_archived=False)
require_owner_or_admin_archived = PostPermissionChecker(allow_archived=True)


def require_post_owner(
    post_id: int,
    current_user: User = Depends(require_terms_accepted),
    db: Session = Depends(get_db)
) -> Post:
    """Requiere que el usuario sea el dueño del post (no admin)."""
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post no encontrado"
        )
    
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el autor puede realizar esta acción"
        )
    
    return post
