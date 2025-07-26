# 🧠 YourWingman App

This is a full-stack AI-powered chat application where users can create and converse with personas powered by Google Gemini. Each persona has its own tone, style, and context, and the app generates intelligent recommendations for how users can improve or continue the conversation — just like having your own personal social coach.

---

## 📁 Project Structure

.
├── backend/             # Python FastAPI backend  
│   └── requirements.txt  
│   └── app.py  
├── download/            # React frontend (Next.js)  
├── .env                 # Global environment variables (for backend)  
├── .env.local           # Frontend (Next.js) environment variables  
└── README.md  

---

## 🚀 Getting Started

### 🐍 Backend (Python + FastAPI)

1. Setup virtual environment and install dependencies:
```
cd backend  
python3 -m venv venv  
source venv/bin/activate  
pip install -r requirements.txt  
```

2. Run the server:
```
uvicorn app:main --reload  
```

---

### ⚛️ Frontend (React + Next.js)

1. Install dependencies:
```
cd download  
npm install  
```

2. Run the app:
```
npm run dev  
```

---

## 🔐 Environment Variables

### 📌 Root `.env` (used by FastAPI backend)

```
MONGO_URI=your_mongo_connection_string  
MONGO_password=your_mongo_password  

GOOGLE_API_KEY=your_gemini_api_key  
GOOGLE_CLIENT_ID=your_google_oauth_client_id  
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret  
```

### 📌 download/.env.local (used by Next.js frontend)

```
GOOGLE_CLIENT_ID=your_google_oauth_client_id  
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret  
NEXTAUTH_URL=http://localhost:3000  
NEXTAUTH_SECRET=some_super_secret_key  
```

---

## 💡 Features

- Create dynamic AI Personas with unique traits and styles  
- Gemini-powered conversation analyzer for:
  - Message ratings (1–5)  
  - Personalized suggestions  
  - Next-move guidance  
- Persistent chat history per session and persona (MongoDB)  
- Star-based feedback on user messages  
- Google OAuth authentication  

---

## 🛠️ Tech Stack

- Frontend: React, Next.js, TailwindCSS, NextAuth  
- Backend: FastAPI, MongoDB, Google Gemini API  
- Database: MongoDB  

---

## 📌 Notes

- If using large ML models or files in the future, set up Git LFS  
- Keep `.env` and `.env.local` private and never commit them  
- All chat analytics and recommendations are generated dynamically with Gemini based on persona, history, and user profile  

---

## ✨ Future Ideas

- Support uploading images/memories for personas  
- Auto-summarize chats and give weekly reports  
- Fine-tuned Gemini or Claude models per persona  
- iOS/Android wrapper  

---

## 🧑‍💻 Author

Aryan Parab — https://github.com/aryanparab
