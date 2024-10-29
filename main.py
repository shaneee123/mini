from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from transformers import pipeline
import os
import a

app = FastAPI()

# Serve static files from the 'static' directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up template directory
templates = Jinja2Templates(directory="templates")

# Whisper 모델 로드
transcriber = pipeline(model="openai/whisper-large", task="automatic-speech-recognition")

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

    # 터미널에 출력
    print("Transcribed Text:", text)

    return {"transcribed_text": text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
