import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

# Persistent storage
chroma_client = chromadb.PersistentClient(
    path="./chroma_storage",
    settings=Settings(allow_reset=True)
)

collection = chroma_client.get_or_create_collection("chat_memory")

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def add_to_vector_db(session_id, persona_id, role, text):
    embedding = embedding_model.encode(text).tolist()
    doc_id = f"{session_id}_{persona_id}_{role}_{len(text)}"
    collection.add(
        documents=[text],
        embeddings=[embedding],
        ids=[doc_id],
        metadatas=[{
            "session_persona": f"{session_id}::{persona_id}",
            "role": role
        }]
    )

def query_similar(session_id, persona_id, query_text, top_k=10):
    query_emb = embedding_model.encode(query_text).tolist()
    return collection.query(
        query_embeddings=[query_emb],
        n_results=top_k,
        where={"session_persona": f"{session_id}::{persona_id}"}
    )["documents"][0]



def delete_vector_memories(session_id, persona_id):
    """Delete all vector memories for a specific session and persona"""
    try:
        # Get all documents matching the session_persona
        results = collection.get(
            where={"session_persona": f"{session_id}::{persona_id}"}
        )
        
        if results and results.get("ids"):
            collection.delete(ids=results["ids"])
            return True
        return True  # Return True even if no documents found (considered successful)
    except Exception as e:
        print(f"Error deleting vector memories: {e}")
        return False