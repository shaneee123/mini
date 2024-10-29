from transformers import pipeline

# Whisper 모델 (large) 불러오기
transcriber = pipeline(model="openai/whisper-large", task="automatic-speech-recognition")

# 예제 한국어 음성 파일
audio_path = "hi.m4a"

# 음성 파일에서 텍스트 추출
result = transcriber(audio_path)
text = result["text"]

print("Transcribed Text:", text)
