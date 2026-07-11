# app/services/document_service.py
import hashlib
import io
import re
import unicodedata
from typing import Any, Dict, List, Tuple

from pypdf import PdfReader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Document, DocumentChunk


class DocumentService:
    """Handles PDF parsing, cleaning, chunking, and metadata extraction."""

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def calculate_hash(self, file_content: bytes) -> str:
        """Computes SHA-256 hash of the file bytes for deduplication."""
        return hashlib.sha256(file_content).hexdigest()

    async def is_duplicate(
        self, db: AsyncSession, file_hash: str
    ) -> Tuple[bool, str | None]:
        """Checks if a document with the same hash already exists in the database.

        Returns (is_duplicate, existing_document_id).
        """
        query = select(Document).where(
            Document.file_hash == file_hash, Document.is_deleted == False
        )
        result = await db.execute(query)
        doc = result.scalar_one_or_none()
        if doc:
            return True, str(doc.id)
        return False, None

    def clean_text(self, text: str) -> str:
        """Cleans and normalizes extracted text.

        Removes duplicate spaces, normalizes line breaks, and performs unicode normalization.
        """
        # Unicode normalization (NFKC)
        text = unicodedata.normalize("NFKC", text)

        # Split into lines, normalize spaces, strip, and filter empty lines
        lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
        cleaned_lines = [line for line in lines if line]

        return "\n".join(cleaned_lines)

    def detect_language(self, text: str) -> str:
        """Determines the language of the document based on character distribution.

        Heuristic: Detects Devanagari script for Hindi, defaults to English.
        """
        if not text:
            return "English"

        # Check for Devanagari unicode characters (Hindi)
        devanagari_count = len(re.findall(r"[\u0900-\u097F]", text))
        total_letters = len(re.findall(r"\w", text))

        if total_letters > 0 and (devanagari_count / total_letters) > 0.1:
            return "Hindi"
        return "English"

    def extract_text_from_pdf(self, file_bytes: bytes) -> List[Tuple[int, str]]:
        """Extracts raw text from PDF bytes.

        Returns a list of tuples containing (page_number, raw_text).
        """
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        pages_content = []

        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            pages_content.append((idx + 1, page_text))

        return pages_content

    def chunk_document(
        self, pages_content: List[Tuple[int, str]]
    ) -> List[Dict[str, Any]]:
        """Splits the text of the document into overlapping chunks.

        Maintains accurate page tracking for each chunk.
        """
        chunks = []
        chunk_index = 0

        for page_num, raw_text in pages_content:
            text = self.clean_text(raw_text)
            if not text:
                continue

            # Split text by sentences/words to chunk
            words = text.split(" ")
            current_chunk_words: List[str] = []
            current_len = 0

            for word in words:
                current_chunk_words.append(word)
                current_len += len(word) + 1  # count the space

                if current_len >= self.chunk_size:
                    chunk_text = " ".join(current_chunk_words)
                    chunks.append(
                        {
                            "text_content": chunk_text,
                            "page_number": page_num,
                            "chunk_index": chunk_index,
                            "metadata_json": {
                                "word_count": len(current_chunk_words),
                                "char_count": len(chunk_text),
                            },
                        }
                    )
                    chunk_index += 1

                    # Handle overlap: keep last N words
                    overlap_char_count = 0
                    overlap_words: List[str] = []
                    for w in reversed(current_chunk_words):
                        overlap_words.insert(0, w)
                        overlap_char_count += len(w) + 1
                        if overlap_char_count >= self.chunk_overlap:
                            break

                    current_chunk_words = overlap_words
                    current_len = overlap_char_count

            # Add trailing chunk for the page
            if current_chunk_words:
                chunk_text = " ".join(current_chunk_words)
                chunks.append(
                    {
                        "text_content": chunk_text,
                        "page_number": page_num,
                        "chunk_index": chunk_index,
                        "metadata_json": {
                            "word_count": len(current_chunk_words),
                            "char_count": len(chunk_text),
                        },
                    }
                )
                chunk_index += 1

        return chunks

    async def process_and_save_document(
        self, db: AsyncSession, file_name: str, file_bytes: bytes, file_path: str
    ) -> Document:
        """Parses a document, extracts text, chunks it, and saves it in the database.

        Checks for duplicates using the file hash first.
        """
        file_hash = self.calculate_hash(file_bytes)
        is_dup, existing_id = await self.is_duplicate(db, file_hash)
        if is_dup:
            raise ValueError(
                f"Duplicate document detected. Existing document ID: {existing_id}"
            )

        # Extract text and metadata
        pages_content = self.extract_text_from_pdf(file_bytes)
        total_pages = len(pages_content)
        full_text = " ".join([text for _, text in pages_content])
        language = self.detect_language(full_text[:5000])  # Sample first 5000 chars

        # Create Document record
        doc = Document(
            name=file_name,
            file_path=file_path,
            file_hash=file_hash,
            status="processing",
            language=language,
            total_pages=total_pages,
            metadata_json={
                "file_size_bytes": len(file_bytes),
                "extension": (
                    file_name.split(".")[-1].lower() if "." in file_name else "pdf"
                ),
            },
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)

        try:
            # Chunk document and save chunks
            chunks_data = self.chunk_document(pages_content)
            for chunk_info in chunks_data:
                chunk = DocumentChunk(
                    document_id=doc.id,
                    text_content=chunk_info["text_content"],
                    page_number=chunk_info["page_number"],
                    chunk_index=chunk_info["chunk_index"],
                    metadata_json=chunk_info["metadata_json"],
                )
                db.add(chunk)

            doc.status = "processed"
            await db.commit()
            await db.refresh(doc)
        except Exception as e:
            doc.status = "failed"
            doc.metadata_json = doc.metadata_json or {}
            doc.metadata_json["error"] = str(e)
            await db.commit()
            raise e

        return doc
