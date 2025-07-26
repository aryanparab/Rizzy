const API_BASE_URL = "http://localhost:8000";

export async function fetchPersonaList(userId){
    const res = await fetch(`${API_BASE_URL}/list_personas?user_id=${userId}`);
    console.log(res)
  if (!res.ok) throw new Error('Failed to fetch personas');
  return await res.json();
}

export async function sendMessage({ session_id, persona_id,persona_instructions,message }) {
  const response = await fetch(`${API_BASE_URL}/send_message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, persona_id,persona_instructions, message }),
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return response.json();
}

export async function getHistory({ session_id, persona_id }) {
  const params = new URLSearchParams({ session_id, persona_id });

  const response = await fetch(`${API_BASE_URL}/get_history?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch chat history");
  }

  return response.json();
}

export async function getSuggestion({ chatHistory, session_id, persona_id }) {
  const response = await fetch(`${API_BASE_URL}/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatHistory, session_id, persona_id }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch suggestion");
  }
  
  return response.json();
}

// New API functions for the requested features
export async function clearChatHistory({ session_id, persona_id }) {
  const response = await fetch(`${API_BASE_URL}/delete_chat`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, persona_id }),
  });

  if (!response.ok) {
    throw new Error("Failed to clear chat history");
  }

  return response.json();
}

export async function deletePersona({ userId, persona_id }) {
  const response = await fetch(`${API_BASE_URL}/delete_persona`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, persona_id }),
  });

  if (!response.ok) {
    throw new Error("Failed to delete persona");
  }

  return response.json();
}

export async function updatePersona({ persona_id, userId, name, description, traits, interests, writingStyle }) {
  const response = await fetch(`${API_BASE_URL}/update_persona/${persona_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      userId, 
      name, 
      description, 
      traits, 
      interests, 
      writingStyle 
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update persona");
  }

  return response.json();
}


export async function fetchUserProfile(userId) {
  const response = await fetch(`${API_BASE_URL}/get_profile?user_id=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch user profile");
  return await response.json();
}

// Update or create user profile
export async function updateUserProfile(userId, profileData) {
  const response = await fetch(`${API_BASE_URL}/update_profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, ...profileData }),
  });

  if (!response.ok) throw new Error("Failed to update user profile");
  return await response.json();
}