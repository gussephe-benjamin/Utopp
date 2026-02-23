from fastapi import HTTPException, status


class AppException(HTTPException):
    """Excepción base de la aplicación."""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: dict | None = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class NotFoundException(AppException):
    """Recurso no encontrado."""
    
    def __init__(self, resource: str = "Recurso"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} no encontrado"
        )


class ForbiddenException(AppException):
    """Acceso denegado."""
    
    def __init__(self, detail: str = "No tienes permiso para realizar esta acción"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class BadRequestException(AppException):
    """Solicitud inválida."""
    
    def __init__(self, detail: str = "Solicitud inválida"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class UnauthorizedException(AppException):
    """No autenticado."""
    
    def __init__(self, detail: str = "No autenticado"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class ConflictException(AppException):
    """Conflicto de recursos."""
    
    def __init__(self, detail: str = "El recurso ya existe"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )


class ValidationException(AppException):
    """Error de validación."""
    
    def __init__(self, detail: str = "Error de validación"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )
