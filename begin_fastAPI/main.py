from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from transformers import pipeline
import os
from groq import Groq
from fastapi.middleware.cors import CORSMiddleware

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

# Set up Groq client
client = Groq(
    api_key="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"
)

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    # Save the uploaded file
    file_location = f"temp/{file.filename}"
    os.makedirs(os.path.dirname(file_location), exist_ok=True)  # Create temp directory if it doesn't exist
    with open(file_location, "wb") as f:
        f.write(await file.read())

    # Transcribe audio to text
    result = transcriber(file_location)
    text = result["text"]

    # Delete the temporary file
    os.remove(file_location)

    # Request sentiment analysis from Groq API
    completion = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {
                "role": "user",
                "content": f"please determine if the speaker ate the medicine or not. If yes, please say 'positive', if not, respond with 'negative'. I want the response only to be 'positive' or 'negative' '{text}'"
            }
        ],
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=True,
        stop=None,
    )

    # Generate result text from Groq completion
    result_text = ""
    for chunk in completion:
        result_text += chunk.choices[0].delta.content or ""

    # Log the results
    print("Transcribed Text:", text)
    print("Sentiment Analysis Result:", result_text)

    return {
        "transcribed_text": text,
        "sentiment_analysis_result": result_text
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
