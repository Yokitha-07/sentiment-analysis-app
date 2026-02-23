import os
import json
from typing import List, Literal

import cohere
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# Load env variables
load_dotenv()

API_KEY = os.getenv("COHERE_API_KEY")
if not API_KEY:
    raise RuntimeError("COHERE_API_KEY is missing in backend/.env")


# Initialize Cohere client
co = cohere.Client(API_KEY)


app = FastAPI(title="Sentiment API (Cohere)")


# CORS (for React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://yokitha-sentiment-analyzer.s3-website.eu-north-1.amazonaws.com/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Models ----------

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)


class AnalyzeResponse(BaseModel):
    label: Literal["positive", "neutral", "negative"]
    score: float = Field(..., ge=0.0, le=1.0)
    reasons: List[str]


# ---------- Prompt ----------

SYSTEM_PROMPT = """
You are a sentiment analysis engine.

Return ONLY valid JSON in this format:

{
  "label": "positive|neutral|negative",
  "score": 0.0-1.0,
  "reasons": ["short reason", "short reason"]
}

Rules:
- score = confidence of label
- reasons: 1 to 3 short points
- No markdown
- No explanation
- Only JSON

Text:
{text}
"""


# ---------- Routes ----------

@app.get("/")
def home():
    return {"message": "Sentiment API running (Cohere)"}



@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):

    text = req.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Text is empty")
    
    text = text[:1500]

    try:
        # Call Cohere Chat
        response = co.chat(
            model="command-a-03-2025",   # Best general model
            temperature=0,
            message=text,
            preamble=SYSTEM_PROMPT,
        )

        content = response.text.strip()

        # Parse JSON
        data = json.loads(content)

        # Validate
        return AnalyzeResponse(**data)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="Cohere returned invalid JSON"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {str(e)}"
        )
