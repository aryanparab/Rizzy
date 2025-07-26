from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.chat import chat
from services.recommendation import get_message_recommendation
from db.mongo import get_messages, delete_chat_history
from db.persona import create_persona, list_personas, get_persona_from_db, delete_persona, update_persona
from db.vector import delete_vector_memories
from db.user_profile import get_user_profile,update_user_profile
from db.recommendation import fetch_recommendations_from_db, update_recommendations
from pydantic import BaseModel
from typing import Optional
import uuid


class PersonaUpdateRequest(BaseModel):
    userId: str
    name: Optional[str] = None
    description: Optional[str] = None
    traits: Optional[str] = None
    interests: Optional[str] = None
    writingStyle: Optional[str] = None
    previousChat: str = ""

class DeleteChatRequest(BaseModel):
    session_id: str
    persona_id: str

class DeletePersonaRequest(BaseModel):
    userId: str
    persona_id: str

class MessageRequest(BaseModel):
    session_id: Optional[str] = None
    persona_id: str
    persona_instructions: str
    message: str


class PersonaCreateRequest(BaseModel):
    userId: str
    name: str
    description:str
    traits: str
    interests: str
    writingStyle:str
    previousChat: str

class SuggestionRequest(BaseModel):
    session_id: str
    persona_id: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:9002"],
    allow_credentials = True,
    allow_methods =["*"],
    allow_headers=["*"]
)


@app.post("/create_persona")
def create_persona_api(req: PersonaCreateRequest):
    persona_id = create_persona(
        req.userId,
        req.name,
        req.description,
       system_prompt= f"Traits: {req.traits} endTraits,Interets: {req.interests} endInterests,Writing Style: {req.writingStyle} endWriting",
       chat_history = req.previousChat
    )
    return {"persona_id": persona_id}

@app.get("/list_personas")
def list_personas_api(user_id: str):
    return list_personas(user_id)

@app.post("/send_message")
async def send_message(req: MessageRequest):
    session_id = req.session_id or str(uuid.uuid4())
    reply = chat(session_id, req.persona_id, req.message)
    return {"session_id": session_id, "response": reply}


from fastapi import Query

@app.get("/get_history")
async def get_history(
    session_id: str = Query(...),
    persona_id: str = Query(...)
):
    messages = get_messages(session_id, persona_id)
    
    return messages

@app.get("/get_persona")
async def get_persona(persona_id: str = Query(...)):
    persona = get_persona_from_db(persona_id)  # Implement this function to get persona data
    if not persona:
        return {"error": "Persona not found"}, 404
    return persona

@app.delete("/delete_chat")
async def delete_chat(req: DeleteChatRequest):
    """Delete all chat history for a session and persona"""
    # Delete from MongoDB
    mongo_deleted = delete_chat_history(req.session_id, req.persona_id)
    
    # Delete from vector database
    #vector_deleted = delete_vector_memories(req.session_id, req.persona_id)
    
    if mongo_deleted :
        return {"success": True, "message": "Chat history deleted successfully"}
    else:
        return {"success": False, "message": "No chat history found to delete"}

@app.delete("/delete_persona")
async def delete_persona_api(req: DeletePersonaRequest):
    """Delete a persona"""
    success = delete_persona(req.persona_id, req.userId)
    vector_deleted = delete_vector_memories(req.userId, req.persona_id)
    
    if success:
        return {"success": True, "message": "Persona deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Persona not found or you don't have permission to delete it")

@app.put("/update_persona/{persona_id}")
async def update_persona_api(persona_id: str, req: PersonaUpdateRequest):
    """Update persona details"""
    success = update_persona(
        persona_id=persona_id,
        user_id=req.userId,
        name=req.name,
        description=req.description,
        traits=req.traits,
        interests=req.interests,
        writing_style=req.writingStyle,
        chat_history=req.previousChat
    )
    
    if success:
        return {"success": True, "message": "Persona updated successfully"}
    else:
        raise HTTPException(status_code=404, detail="Persona not found or you don't have permission to update it")
    

@app.get("/get_profile")
async def get_profile(user_id: str):
    profile = get_user_profile(user_id)
    return profile or {}

@app.put("/update_profile")
async def update_profile(payload: dict):
    
    a = update_user_profile(payload)
    return {"status": "success", "message": "Profile updated"}





@app.post("/suggest")
async def send_suggestion(suggestionData: SuggestionRequest):
   
    chats =  await get_history(suggestionData.session_id,suggestionData.persona_id)

    if not chats:
        print("No chats found")
        return {"error": "No chat history found."}

    messages = chats
    rec_doc = await fetch_recommendations_from_db(suggestionData.session_id, suggestionData.persona_id)

    existing_recs = rec_doc["recommendations"] if rec_doc else []
    last_index = existing_recs[-1]["message_index"] if existing_recs else -1
    chat_history_so_far = rec_doc["chathistory_till_now"] if rec_doc else ""

    new_chat_history = chat_history_so_far
    updated_recommendations = []

    user_details = get_user_profile(suggestionData.session_id)
    persona_details = get_persona_from_db(suggestionData.persona_id)
    i = last_index + 1
    while i < len(messages) - 1:
        msg = messages[i]
        next_msg = messages[i + 1]

        if msg["role"] == "user" and next_msg["role"] == "assistant":
            user_text = msg["content"]
            assistant_text = next_msg["content"]

            new_chat_history += f"User: {user_text}\nAssistant: {assistant_text}\n"
            recomms = get_message_recommendation(user_text,new_chat_history,persona_details,user_details)
            updated_recommendations.append({
                "message_index": i,
                "user_message": user_text,
                "assistant_response": assistant_text,
                "rating": recomms["rating"],
                "suggestion": recomms["suggestion"],
                "next_move": recomms["next_move"]
            })

            i += 2
        else:
            i += 1


    update_recommendations(
        suggestionData.session_id,
        suggestionData.persona_id,
        updated_recommendations,
        new_chat_history
    )
    
    return {
        "status": "success",
        "new_recommendations_added": len(updated_recommendations),
        "recommendations": existing_recs + updated_recommendations
    }

