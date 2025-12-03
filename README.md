<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AgroSense Application

This repository contains the AgroSense smart farming dashboard (frontend) and its FastAPI backend. Follow the instructions below to run both services locally.

View the original AI Studio project: https://ai.studio/apps/drive/1TaWw2FTGtI8FAGI5Lc5JngBE4taHxx9g

## Frontend (Vite + React)

**Prerequisites:** Node.js 18+

open new cmd or powershell

1. Navigate to the frontend folder:
`cd ../Frontend`
2. Install dependencies:
   `npm install`
3. Copy `.env.local.example` to `.env.local` if needed, then set your Gemini key:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the development server:
   `npm run dev`
5. Open the app at the URL printed in the terminal (defaults to `http://localhost:3000`).


## Backend (FastAPI)

**Prerequisites:** Python 3.10+ (virtual environment recommended)

Open new cmd terminal or power shell

1. Navigate to the backend folder:
   `cd ../Backend`
2. Create and activate a virtual environment:
   - Windows PowerShell:
     ```
     python -m venv agrovision
     .\agrovision\Scripts\Activate.ps1
     ```
   - macOS/Linux:
     ```
     python3 -m venv agrovision
     source agrovision/bin/activate
     ```
3. Install dependencies:
   `pip install -r requirements.txt`
   
4. Copy `.env.example` to `.env` and set your environment values:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   DATABASE_URL=sqlite:///./agrosense.db
   SECRET_KEY=generate_a_secure_secret
   FRONTEND_URL=http://localhost:3000
   ```
5. Run the API server:
   `uvicorn app.main:app --reload --port 8000`
6. Access the interactive docs at `http://localhost:8000/docs`.

## Running Both Services

1. Start the backend server (step 5 above).
2. Start the frontend dev server (`npm run dev`).
3. The frontend will communicate with the backend running on `http://localhost:8000`.
