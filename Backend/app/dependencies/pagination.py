from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel
from fastapi import Query


T = TypeVar("T")


class PaginationParams:
    """Parámetros de paginación reutilizables."""
    
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Número de página"),
        size: int = Query(20, ge=1, le=100, description="Elementos por página"),
    ):
        self.page = page
        self.size = size
        self.offset = (page - 1) * size


class PageResponse(BaseModel, Generic[T]):
    """Respuesta paginada genérica."""
    items: List[T]
    page: int
    size: int
    total: int
    pages: int
    has_next: bool
    has_prev: bool
    
    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        page: int,
        size: int
    ) -> "PageResponse[T]":
        pages = (total + size - 1) // size if size > 0 else 0
        return cls(
            items=items,
            page=page,
            size=size,
            total=total,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1,
        )
