from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from transformers import pipeline
import os
from groq import Groq
import asyncio

app = FastAPI()

# Serve static files from the 'static' directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up template directory
templates = Jinja2Templates(directory="templates")

# Whisper 모델 로드
transcriber = pipeline(model="openai/whisper-large", task="automatic-speech-recognition")

# Groq client 설정
client = Groq(
    api_key="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"
)

@app.get("/", response_class=HTMLResponse)
async def get_form(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    # 파일 저장
    file_location = f"temp/{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())

    # 음성 파일에서 텍스트 추출
    result = transcriber(file_location)
    text = result["text"]

    # 파일 삭제 (필요한 경우)
    os.remove(file_location)

    # Groq API로 텍스트 감정 분석 요청
    completion = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {
                "role": "user",
                "content": f"can you determine if the following sentence includes if the speaker ate medicine or not on the mentioned date? if yes, please say positive, if not, response as negative. I want the response only to be positive or negative with the date. '{text}'"
            }
        ],
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=True,
        stop=None,
    )

    # 결과 텍스트 생성
    result_text = ""
    for chunk in completion:
        result_text += chunk.choices[0].delta.content or ""

    # 터미널에 출력
    print("Transcribed Text:", text)
    print("Sentiment Analysis Result:", result_text)

    return {
        "transcribed_text": text,
        "sentiment_analysis_result": result_text
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
