from fastapi import FastAPI, File, UploadFile
from transformers import pipeline
import os
from groq import Groq
from fastapi.middleware.cors import CORSMiddleware
import json
import re
from dotenv import load_dotenv  # 환경 변수 로드용 모듈

# .env 파일의 환경 변수 로드
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust this to your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Whisper model for ASR
transcriber = pipeline(model="openai/whisper-large", task="automatic-speech-recognition")

# Set up Groq client with API key from environment variable
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    # Save the uploaded file
    file_location = f"temp/{file.filename}"
    os.makedirs(os.path.dirname(file_location), exist_ok=True)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    # Transcribe audio to text
    result = transcriber(file_location)
    text = result["text"]

    # Delete the temporary file
    os.remove(file_location)

    # Request sentiment analysis and date extraction from Groq API
    completion = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {
                "role": "user",
                "content": f"""
                Please analyze the following text to determine if the speaker took medicine or not. 
                If the speaker took medicine, respond with "positive"; if not, respond with "negative". Also, identify any dates mentioned 
                in the text. Respond strictly in the following JSON format, without additional commentary:
            
                {{
                "sentiment": "positive" or "negative",
                "mentioned_date": "MM-DD" (if any date is mentioned, otherwise null)
                }}
            
                Here is the text: "{text}"
                """
            }
        ],
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=True,
        stop=None,
    )

    # Generate result JSON from Groq completion
    result_json = ""
    for chunk in completion:
        result_json += chunk.choices[0].delta.content or ""

    # Parse the result JSON and add default year to the date
    try:
        parsed_result = json.loads(result_json)

        if parsed_result.get("mentioned_date"):
            if re.match(r"^\d{2}-\d{2}$", parsed_result["mentioned_date"]):
                parsed_result["mentioned_date"] = f"2024-{parsed_result['mentioned_date']}"

        print("Parsed Sentiment Analysis Result:", parsed_result)

    except json.JSONDecodeError:
        print("Failed to parse JSON response:", result_json)

    print("Transcribed Text:", text)
    print("Sentiment Analysis Result (Raw JSON):", result_json)

    return {
        "transcribed_text": text,
        "sentiment_analysis_result": parsed_result if 'parsed_result' in locals() else result_json
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
