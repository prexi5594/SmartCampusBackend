"""A reusable, owner-scoped JSON record store backed by persistent ChromaDB."""

from datetime import datetime, timezone
import json
import logging
from threading import RLock

import chromadb
from chromadb.config import Settings

logger = logging.getLogger(__name__)
MAX_RECORD_BYTES = 32 * 1024
MAX_RECORDS_PER_USER = 1000


class StorageUnavailable(Exception):
    pass


class StorageQuotaExceeded(Exception):
    pass


class UserDataStore:
    def __init__(self, path):
        self.client = chromadb.PersistentClient(
            path=str(path), settings=Settings(anonymized_telemetry=False),
        )
        self.collection = self.client.get_or_create_collection(
            "campus_user_data_v1", embedding_function=None,
            metadata={"schema_version": 1},
        )
        # Embedded Chroma is used by ONE server process; serialize quota checks + writes.
        self.lock = RLock()

    @staticmethod
    def owner_filter(user_id, namespace):
        return {"$and": [{"owner_id": user_id}, {"namespace": namespace}]}

    @staticmethod
    def record_id(user_id, namespace, key):
        return f"{user_id}:{namespace}:{key}"

    @staticmethod
    def decode(result):
        return [
            {"key": metadata["key"], "value": json.loads(document),
             "updated_at": metadata["updated_at"]}
            for metadata, document in zip(result["metadatas"], result["documents"])
        ]

    def run(self, action):
        try:
            return action()
        except StorageQuotaExceeded:
            raise
        except Exception as error:
            # Do not log exception text: database errors may contain private documents.
            logger.error("Chroma operation failed (%s)", type(error).__name__)
            raise StorageUnavailable from error

    def list(self, user_id, namespace, limit, offset):
        return self.run(lambda: self.decode(self.collection.get(
            where=self.owner_filter(user_id, namespace), limit=limit, offset=offset,
            include=["documents", "metadatas"],
        )))

    def get(self, user_id, namespace, key):
        rows = self.run(lambda: self.decode(self.collection.get(
            ids=[self.record_id(user_id, namespace, key)],
            where=self.owner_filter(user_id, namespace), include=["documents", "metadatas"],
        )))
        return rows[0] if rows else None

    def put(self, user_id, namespace, key, value):
        document = json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
        updated_at = datetime.now(timezone.utc).isoformat()

        def write():
            with self.lock:
                if self.get(user_id, namespace, key) is None:
                    existing = self.collection.get(where={"owner_id": user_id}, include=[])
                    if len(existing["ids"]) >= MAX_RECORDS_PER_USER:
                        raise StorageQuotaExceeded
                self.collection.upsert(
                    ids=[self.record_id(user_id, namespace, key)],
                    documents=[document],
                    metadatas=[{"owner_id": user_id, "namespace": namespace,
                                "key": key, "updated_at": updated_at}],
                    # JSON persistence needs no semantic embedding or model download.
                    # A separate collection should be used for future semantic search.
                    embeddings=[[0.0]],
                )
            return {"key": key, "value": value, "updated_at": updated_at}

        return self.run(write)

    def delete(self, user_id, namespace, key):
        def remove():
            with self.lock:
                if self.get(user_id, namespace, key) is None:
                    return False
                self.collection.delete(
                    ids=[self.record_id(user_id, namespace, key)],
                    where=self.owner_filter(user_id, namespace),
                )
                return True

        return self.run(remove)
