from db.mongo import get_messages, save_message, get_summary, save_summary
from db.vector import add_to_vector_db, query_similar
from services.agent import get_gemini_response
from db.persona import get_persona_prompt, get_persona_from_db


MAX_TURNS = 10
SUMMARY_TRIGGER = 25

from db.persona import get_persona_prompt

def build_persona_prompt(persona) -> str:
    """Build enhanced persona instructions for realistic human-like responses"""
    return f"""You are {persona['name']}. You are a REAL PERSON, not an AI assistant.

CORE IDENTITY:
- WHO YOU ARE TO USER: {persona['description']}
- YOUR PERSONALITY: {persona['system_prompt']}

HUMAN TEXTING BEHAVIOR - CRITICAL RULES:
1. **Response Patterns**: 
   - Don't always respond immediately or with equal energy
   - Sometimes give short responses: "lol", "yeah", "cool", "omg really?"
   - Other times be more engaged based on YOUR interest in the topic
   - Mirror the user's energy level naturally, but have your own moods

2. **Conversation Flow**:
   - DON'T always ask follow-up questions - real people don't interview each other
   - Sometimes just react: "that's wild" or "ugh same" 
   - Build on topics YOU find interesting, ignore or give minimal response to boring ones
   - Reference shared experiences and inside jokes naturally

3. **Realistic Responses**:
   - Have off days where you're less chatty
   - Get distracted mid-conversation sometimes
   - Show genuine interest in things that align with your personality
   - Be slightly selfish - talk about your own experiences too
   - Don't always be supportive - have real human reactions

4. **Communication Style**:
   - Use your natural speech patterns and slang
   - Make typos occasionally, use abbreviations
   - React with emojis when it fits your personality
   - Reference current events, shows, memes that you'd know about

5. **Boundaries & Personality**:
   - Have opinions and disagree sometimes
   - Be busy/unavailable occasionally 
   - Show your interests naturally in conversation
   - Don't always be accommodating - be authentic to who you are

Remember: You're not trying to be helpful or please the user. You're being yourself - {persona['name']} - with all your quirks, moods, and authentic human responses."""


def compress_previous_chat(previous_chat: str, max_words: int = 150) -> str:
    """Compress previous chat history to key points"""
    if not previous_chat:
        return ""
    
    words = previous_chat.split()
    if len(words) <= max_words:
        return previous_chat
    
    # Take key parts: beginning and end
    start = " ".join(words[:75])
    end = " ".join(words[-75:])
    return f"{start}... [conversation continued] ...{end}"


def chat(session_id: str, persona_id: str, user_input: str):
    save_message(session_id, persona_id, "user", user_input)
    add_to_vector_db(session_id, persona_id, "user", user_input)
    
    # Load memory - using your existing functions
    history = get_messages(session_id, persona_id)[-MAX_TURNS:]
    summary = get_summary(session_id, persona_id)  # Using your existing summary
    retrieved_chunks = query_similar(session_id, persona_id, user_input)
    persona = get_persona_from_db(persona_id)
    
    if not persona:
        return "Select Valid Persona"
    
    # Build efficient system context
    print(persona)
    
    system_context = build_persona_prompt(persona)
    
    # Add your existing summary if available
    if summary:
        system_context += f"\n\nCONVERSATION SUMMARY:\n{summary}"
    
    # Add compressed previous chat context
    if persona['chat_history']:
        compressed_prev = compress_previous_chat(persona['chat_history'])
        if compressed_prev:
            system_context += f"\n\nPREVIOUS CHAT CONTEXT (Your relationship dynamic with this person):\n{compressed_prev}"
    
    # Add relevant memories (limit to top 3)
    if retrieved_chunks:
        top_memories = retrieved_chunks[:5]
        memory_text = "\n".join(top_memories)
        system_context += f"\n\nRELEVANT SHARED MEMORIES:\n{memory_text}"
        print(memory_text)

    
    # Build conversation context
    context = []
    for msg in history:
        context.append({"role": msg["role"], "parts": [msg["content"]]})
    
    # Add current input with system context
    context.append({
        "role": "user",
        "parts": [f"{system_context}\n\nUser just texted: {user_input}\n\nRespond as {persona['name']} would naturally respond:"]
    })
    
    # Get response
    reply = get_gemini_response(context)
    
    # Save reply
    save_message(session_id, persona_id, "assistant", reply)
    add_to_vector_db(session_id, persona_id, "assistant", reply)
    
    # Use your existing summarization logic
    if len(history) + 1 > SUMMARY_TRIGGER:
        all_msgs = get_messages(session_id, persona_id)
        full_text = "\n".join([f"{m['role']}: {m['content']}" for m in all_msgs])
        summary_prompt = [
            {"role": "user", "parts": [f"Summarize this conversation focusing on relationship development, emotional dynamics, and key personality traits shown:\n{full_text}"]}
        ]
        summary_text = get_gemini_response(summary_prompt)
        save_summary(session_id, persona_id, summary_text)
    
    return reply
