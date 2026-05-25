import pymongo
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

MONGO_URI_A = "mongodb+srv://cad_node_a:Qwertyuiop123%21@webmusic.ro4f2iz.mongodb.net/webmusic?retryWrites=true&w=majority"
MONGO_URI_B = "mongodb+srv://cad_node_b:Qwertyuiop123%21@cluster0.fl6igei.mongodb.net/cad_node_b?appName=Cluster0"

def sync_collection(col_name, client_a, client_b):
    db_a = client_a["webmusic"]
    db_b = client_b["cad_node_b"]

    col_a = db_a[col_name]
    col_b = db_b[col_name]

    # Read all documents from A
    docs_a = {doc["_id"]: doc for doc in col_a.find()}
    # Read all documents from B
    docs_b = {doc["_id"]: doc for doc in col_b.find()}

    # Sync A -> B
    copied_to_b = 0
    for doc_id, doc in docs_a.items():
        if doc_id not in docs_b:
            col_b.insert_one(doc)
            copied_to_b += 1

    # Sync B -> A
    copied_to_a = 0
    for doc_id, doc in docs_b.items():
        if doc_id not in docs_a:
            col_a.insert_one(doc)
            copied_to_a += 1

    if copied_to_b > 0 or copied_to_a > 0:
        logging.info(f"Sync complete for collection '{col_name}': Copied {copied_to_b} docs to B, {copied_to_a} docs to A")
    else:
        logging.info(f"Collection '{col_name}' is already in sync.")

def main():
    logging.info("Starting database synchronization between Node A and Node B...")
    client_a = None
    client_b = None
    try:
        logging.info("Connecting to Database A...")
        client_a = pymongo.MongoClient(MONGO_URI_A, serverSelectionTimeoutMS=5000)
        # Force a command to test connection
        client_a.admin.command('ping')
        logging.info("Successfully connected to Database A.")
    except Exception as e:
        logging.error(f"Failed to connect to Database A: {e}. Gracefully skipping sync.")
        return

    try:
        logging.info("Connecting to Database B...")
        client_b = pymongo.MongoClient(MONGO_URI_B, serverSelectionTimeoutMS=5000)
        # Force a command to test connection
        client_b.admin.command('ping')
        logging.info("Successfully connected to Database B.")
    except Exception as e:
        logging.error(f"Failed to connect to Database B: {e}. Gracefully skipping sync.")
        if client_a:
            client_a.close()
        return

    try:
        collections = ["cad_models", "versions", "geometries"]
        for col in collections:
            sync_collection(col, client_a, client_b)
        logging.info("Database synchronization completed successfully.")
    except Exception as e:
        logging.error(f"An error occurred during collection sync: {e}. Gracefully skipping.")
    finally:
        if client_a:
            client_a.close()
        if client_b:
            client_b.close()

if __name__ == "__main__":
    main()
