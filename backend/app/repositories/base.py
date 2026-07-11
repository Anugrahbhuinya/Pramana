# app/repositories/base.py
from typing import Any, Generic, List, Optional, Type, TypeVar
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic repository implementing standard database operations."""

    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        """Retrieves a single record by its primary key."""
        query = select(self.model).where(self.model.id == id)  # type: ignore[attr-defined]
        # Handle soft deleted items by default: ignore them if model supports soft delete
        if hasattr(self.model, "is_deleted"):
            query = query.where(self.model.is_deleted == False)  # type: ignore[attr-defined]

        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """Retrieves a list of records with offset pagination."""
        query = select(self.model)
        if hasattr(self.model, "is_deleted"):
            query = query.where(self.model.is_deleted == False)  # type: ignore[attr-defined]
        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, *, obj_in: Any) -> ModelType:
        """Inserts a new record in the database."""
        db_obj = self.model(**obj_in) if isinstance(obj_in, dict) else obj_in
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj  # type: ignore[no-any-return]

    async def update(
        self, db: AsyncSession, *, db_obj: ModelType, obj_in: Any
    ) -> ModelType:
        """Updates an existing record with new details."""
        update_data = (
            obj_in
            if isinstance(obj_in, dict)
            else obj_in.model_dump(exclude_unset=True)
        )

        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: Any) -> Optional[ModelType]:
        """Hard deletes a record from the database."""
        obj = await self.get(db, id)
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

    async def soft_delete(self, db: AsyncSession, *, id: Any) -> Optional[ModelType]:
        """Soft deletes a record by updating the is_deleted flag if supported."""
        obj = await self.get(db, id)
        if obj and hasattr(obj, "soft_delete"):
            obj.soft_delete()
            db.add(obj)
            await db.commit()
            await db.refresh(obj)
        return obj
