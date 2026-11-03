import redis
from pymongo import MongoClient

r = redis.Redis(
    host='redis-10028.c1.us-central1-2.gce.cloud.redislabs.com',
    port=10028,
    decode_responses=True,
    username="default",
    password="X8JdvuET8yn7jKv98EBt56p2UZZpLcsd",
)


def get_mongo_client(uri:str, db_name:str, collection_name:str):
    client = MongoClient(uri)
    db = client[db_name]
    return db[collection_name], db


class RedisCache:
    def __init__(self, redis_client):
        self.redis_client = redis_client

    def get(self, key):
        return self.redis_client.get(key)

    def set(self, key, value, ex=None):
        self.redis_client.set(key, value, ex=ex)


cache = RedisCache(r)


class MongoDBService:
    def __init__(self, uri: str, db_name: str, collection_name: str):
        self.collection, self.db = get_mongo_client(uri, db_name, collection_name)

    def insert_document(self, document: dict):
        return self.collection.insert_one(document)

    def find_document(self, query: dict):
        return self.collection.find_one(query)

    def find_documents_from_all_collection(self, user_id: str):
        documents = []
        for collection in self.db.list_collection_names():
            collection_documents = list(self.db[collection].find({"user_id": user_id}))
            documents.extend(collection_documents)
        return documents


if __name__ == "__main__":
    # Example usage
    cache.set("test_key", "test_value", ex=60)  # Set a key with a 60-second expiration
    value = cache.get("test_key")
    print(f"Retrieved value: {value}")