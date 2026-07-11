# app/services/embedding_service.py
import asyncio
import hashlib
import os
from typing import List, Optional
from uuid import UUID

import google.generativeai as genai
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.models.models import Embedding


class EmbeddingService:
    """Generates embeddings using Google Gemini API with database-backed caching."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_EMBEDDING_MODEL
        self.has_api_key = bool(self.api_key and self.api_key.strip())

        if self.has_api_key:
            genai.configure(api_key=self.api_key)
            logger.info("Gemini Embedding Service initialized with API Key.")
        else:
            logger.warning(
                "No GEMINI_API_KEY found. Embedding service will run in MOCK mode."
            )

    def _generate_mock_vector(self, text: str, dimensions: int = 768) -> List[float]:
        """Generates a deterministic mock embedding vector based on text hash."""
        hash_val = int(hashlib.sha256(text.encode("utf-8")).hexdigest(), 16)
        vector = []
        for i in range(dimensions):
            # Seed-like deterministic generation
            val = ((hash_val >> (i % 64)) & 0xFFFF) / 65535.0
            vector.append(val)
        return vector

    async def get_embedding(
        self,
        db: AsyncSession,
        chunk_id: UUID,
        document_id: UUID,
        page_number: int,
        text: str,
    ) -> List[float]:
        """Retrieves embedding for a document chunk. Looks in DB cache first, else generates."""
        # 1. Check DB Cache
        query = select(Embedding).where(Embedding.chunk_id == chunk_id)
        result = await db.execute(query)
        cached = result.scalar_one_or_none()
        if cached:
            return cached.embedding_json

        # 2. Generate new embedding
        vector = await self.generate_embedding(text)

        # 3. Store in DB Cache
        new_embedding = Embedding(
            chunk_id=chunk_id,
            document_id=document_id,
            page_number=page_number,
            embedding_json=vector,
            metadata_json={"model": self.model},
        )
        db.add(new_embedding)
        await db.commit()

        return vector

    async def generate_embedding(self, text: str) -> List[float]:
        """Calls Gemini API to generate embedding for the given text."""
        if not self.has_api_key:
            return self._generate_mock_vector(text)

        try:
            response = await asyncio.to_thread(
                genai.embed_content,
                model=self.model, content=text, task_type="retrieval_document"
            )
            # Response format: {'embedding': [float, float, ...]}
            if "embedding" in response:
                return response["embedding"]
            elif isinstance(response, dict) and "embeddings" in response:
                return response["embeddings"][0]["values"]
            else:
                # Direct check on properties
                values = getattr(response, "embedding", None) or getattr(
                    response, "embeddings", None
                )
                if values and isinstance(values, list):
                    return values
                elif hasattr(values, "values"):
                    return values.values

            raise ValueError(
                f"Unexpected response structure from Gemini Embedding API: {response}"
            )
        except Exception as e:
            logger.error(
                "Gemini Embedding generation failed. Falling back to mock vector.",
                error=str(e),
            )
            return self._generate_mock_vector(text)

    async def generate_query_embedding(self, query: str) -> List[float]:
        """Generates embedding for a search query (no DB caching needed)."""
        if not self.has_api_key:
            return self._generate_mock_vector(query)

        try:
            response = await asyncio.to_thread(
                genai.embed_content,
                model=self.model, content=query, task_type="retrieval_query"
            )
            if "embedding" in response:
                return response["embedding"]
            elif isinstance(response, dict) and "embeddings" in response:
                return response["embeddings"][0]["values"]
            else:
                values = getattr(response, "embedding", None) or getattr(
                    response, "embeddings", None
                )
                if values and isinstance(values, list):
                    return values
                elif hasattr(values, "values"):
                    return values.values

            raise ValueError("Unexpected response structure from Gemini Embedding API")
        except Exception as e:
            logger.error(
                "Gemini Query Embedding generation failed. Falling back to mock vector.",
                error=str(e),
            )
            return self._generate_mock_vector(query)
