# app/services/retrieval_service.py
import os
import re
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.core.config import settings
from app.core.logging import logger


class RetrievalService:
    """Abstraction layer for the Vector Database (ChromaDB) to support RAG operations."""

    def __init__(self, persist_dir: Optional[str] = None):
        if not persist_dir:
            # Default to backend/data/chromadb
            base_dir = os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            )
            persist_dir = os.path.join(base_dir, "data", "chromadb")

        os.makedirs(persist_dir, exist_ok=True)

        try:
            self.client = chromadb.PersistentClient(
                path=persist_dir, settings=ChromaSettings(anonymized_telemetry=False)
            )
            logger.info("ChromaDB Persistent Client initialized.", path=persist_dir)
        except Exception as e:
            logger.error(
                "Failed to initialize Persistent ChromaDB. Falling back to Ephemeral Client.",
                error=str(e),
            )
            self.client = chromadb.EphemeralClient()

        # Get or create the main collection for document chunks
        self.collection = self.client.get_or_create_collection(
            name="pramana_compliance_chunks", metadata={"hnsw:space": "cosine"}
        )

    async def insert_chunks(
        self,
        document_id: str,
        chunk_ids: List[str],
        texts: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
    ) -> None:
        """Inserts chunks and their embedding vectors into the vector database."""
        if not chunk_ids:
            return

        # Prepare chromadb payload
        ids = [str(cid) for cid in chunk_ids]

        # Inject document_id into metadata if not present
        prepared_metadatas = []
        for meta in metadatas:
            m = meta.copy()
            m["document_id"] = str(document_id)
            prepared_metadatas.append(m)

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=prepared_metadatas,
        )
        logger.info(
            "Successfully inserted chunks into vector DB.",
            count=len(chunk_ids),
            doc_id=document_id,
        )

    async def search(
        self,
        query_vector: List[float],
        limit: int = 5,
        metadata_filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Performs vector similarity search against the vector database."""
        # Convert filter format if needed
        where_clause = None
        if metadata_filter:
            # e.g., {"document_id": "uuid-str"}
            where_clause = {k: str(v) for k, v in metadata_filter.items()}

        results = self.collection.query(
            query_embeddings=[query_vector], n_results=limit, where=where_clause
        )

        formatted_results = []
        if results and "ids" in results and results["ids"]:
            ids = results["ids"][0]
            documents = results["documents"][0]
            metadatas = results["metadatas"][0]
            distances = (
                results["distances"][0] if "distances" in results else [0.0] * len(ids)
            )

            for i in range(len(ids)):
                formatted_results.append(
                    {
                        "chunk_id": ids[i],
                        "text": documents[i],
                        "metadata": metadatas[i],
                        "similarity": 1.0
                        - distances[i],  # Cosine distance to similarity
                    }
                )

        return formatted_results

    async def hybrid_search(
        self,
        query_text: str,
        query_vector: List[float],
        limit: int = 5,
        metadata_filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Simulates hybrid search.

        Performs vector search first, then filters or ranks based on keyword presence in query_text.
        """
        # Fetch slightly more vector results to re-rank
        vector_results = await self.search(
            query_vector, limit=limit * 2, metadata_filter=metadata_filter
        )

        # Perform simple keyword scoring boost
        keywords = set(re.findall(r"\w+", query_text.lower()))
        for item in vector_results:
            text_lower = item["text"].lower()
            match_count = sum(1 for kw in keywords if kw in text_lower)
            # Add small boost to similarity for text matches
            boost = (match_count / len(keywords)) * 0.1 if keywords else 0.0
            item["similarity"] = min(1.0, item["similarity"] + boost)

        # Sort and return top limit
        vector_results.sort(key=lambda x: x["similarity"], reverse=True)
        return vector_results[:limit]

    async def delete_document_chunks(self, document_id: str) -> None:
        """Deletes all chunks associated with a specific document ID."""
        self.collection.delete(where={"document_id": str(document_id)})
        logger.info("Deleted all document chunks from vector DB.", doc_id=document_id)
