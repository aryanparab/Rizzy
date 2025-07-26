# userprofile.py
from fastapi import APIRouter
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter()
client = MongoClient(os.getenv("MONGO_URI"))
db = client["chat_db"]
profile_collection = db["user_profiles"]


def get_user_profile(user_id: str):
    profile = profile_collection.find_one({"user_id": user_id}, {"_id": 0})
    return profile or {}

def update_user_profile(payload: dict):
    user_id = payload["user_id"]
    profile_collection.update_one(
        {"user_id": user_id},
        {"$set": payload},
        upsert=True
    )
    return {"status": "success", "message": "Profile updated"}
