from pymongo import MongoClient
from dotenv import load_dotenv
import os 

load_dotenv()

mongo_client = MongoClient(os.getenv("MONGO_URI"))
db = mongo_client["chat_db"]
convos = db["conversations"]


def get_messages(session_id, persona_id):
    convo = convos.find_one({"session_id": session_id, "persona_id": persona_id})
    return convo.get("messages", []) if convo else []

def save_message(session_id, persona_id, role, content):
    convos.update_one(
        {"session_id": session_id, "persona_id": persona_id},
        {"$push": {"messages": {"role": role, "content": content}}},
        upsert=True
    )

def get_summary(session_id, persona_id):
    convo = convos.find_one({"session_id": session_id, "persona_id": persona_id})
    return convo.get("summary", None) if convo else None

def save_summary(session_id, persona_id, summary):
    convos.update_one(
        {"session_id": session_id, "persona_id": persona_id},
        {"$set": {"summary": summary}},
        upsert=True
    )


def delete_chat_history(session_id, persona_id):
    """Delete all chat history for a specific session and persona"""
    result = convos.delete_one({"session_id": session_id, "persona_id": persona_id})
    return result.deleted_count > 0