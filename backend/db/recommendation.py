from pymongo import MongoClient
from dotenv import load_dotenv
import os 

load_dotenv()

mongo_client = MongoClient(os.getenv("MONGO_URI"))
db = mongo_client["chat_db"]
recommendations = db["recommendations"]


async def fetch_recommendations_from_db(session_id,persona_id):
    recoms = recommendations.find_one({
        "session_id": session_id,
        "persona_id": persona_id
    })
    return recoms


def update_recommendations(session_id,persona_id,existing_recs,chathistory_till_now):
   
    recommendations.update_one(
        {
            "session_id": session_id,
            "persona_id": persona_id
        },
        {
            
            "$set": {
                "recommendations": existing_recs,
                "chathistory_till_now": chathistory_till_now
            }
        },
        upsert=True
    )
