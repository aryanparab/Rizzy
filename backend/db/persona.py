from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import datetime
from bson import ObjectId

load_dotenv()
client = MongoClient(os.getenv("MONGO_URI"))
db = client["chat_db"]
personas = db["personas"]

def create_persona(user_id, name, description, system_prompt,chat_history):
    doc = {
        "user_id": user_id,
        "name": name,
        "description": description,
        "system_prompt": system_prompt,
        "chat_history":chat_history,
        "created_at": datetime.utcnow()
    }
    result = personas.insert_one(doc)
    return str(result.inserted_id)

def list_personas(user_id):
     results = personas.find({"user_id": user_id})

     return [
        {
            "persona_id": str(p["_id"]),
            "name": p["name"],
            "description": p["description"],
            "created_at": p.get("created_at"),
            "system_prompt":p["system_prompt"],
            "chat_history":p["chat_history"]
        }
        for p in results
    ]

def get_persona_from_db(persona_id):
    # Convert string to ObjectId for querying
    result = personas.find_one({"_id": ObjectId(persona_id)})
    if result:
        # Convert _id to string before returning
        result["_id"] = str(result["_id"])
    
    return result

def get_persona_prompt(persona_id, user_id):
    result = personas.find_one({"_id": ObjectId(persona_id), "user_id": user_id})
    if result:
        return result.get("system_prompt")
    return None

# NEW FUNCTIONS FOR DELETE AND EDIT
def delete_persona(persona_id, user_id):
    """Delete a persona if it belongs to the user"""
    result = personas.delete_one({"_id": ObjectId(persona_id), "user_id": user_id})
    return result.deleted_count > 0

def update_persona(persona_id, user_id, name=None, description=None, traits=None, interests=None, writing_style=None,chat_history=None):
    """Update persona fields"""
    update_fields = {}
    
    if name is not None:
        update_fields["name"] = name
    if description is not None:
        update_fields["description"] = description
    
    # Build system prompt if any of the traits are provided
    if traits is not None or interests is not None or writing_style is not None or chat_history is not None:
        # Get current persona to preserve existing values
        current_persona = get_persona_from_db(persona_id)
        if not current_persona or current_persona.get("user_id") != user_id:
            return False
            
        current_system_prompt = current_persona.get("system_prompt", "")
        current_chat_history = current_persona.get("chat_history","")
        
        # Extract current values
        current_traits = traits if traits is not None else (
            current_system_prompt.split('Traits: ')[1].split(' endTraits')[0] 
            if 'Traits: ' in current_system_prompt else ""
        )
        current_interests = interests if interests is not None else (
            current_system_prompt.split('Interets: ')[1].split(' endInterests')[0] 
            if 'Interets: ' in current_system_prompt else ""
        )
        current_writing_style = writing_style if writing_style is not None else (
            current_system_prompt.split('Writing Style: ')[1].split(' endWriting')[0] 
            if 'Writing Style: ' in current_system_prompt else ""
        )
        current_chat_history = chat_history if chat_history is not None else (
            current_chat_history
        )
        
        update_fields["system_prompt"] = f"Traits: {current_traits} endTraits,Interets: {current_interests} endInterests,Writing Style: {current_writing_style} endWriting"
        update_fields["chat_history"]= current_chat_history
    
    if not update_fields:
        return False
        
    result = personas.update_one(
        {"_id": ObjectId(persona_id), "user_id": user_id},
        {"$set": update_fields}
    )
    return result.modified_count > 0