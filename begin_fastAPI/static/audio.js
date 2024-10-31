// 오디오 녹음 및 서버 전송 기능
document.addEventListener("DOMContentLoaded", function () {
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;
  let stream;

  document.getElementById("recordButton").onclick = async () => {
    if (!isRecording) {
      // 녹음 시작
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.start();
      isRecording = true;
      document.getElementById("recordButton").innerText = "Stop Recording";
    } else {
      // 녹음 중지
      mediaRecorder.stop();
      isRecording = false;
      document.getElementById("recordButton").innerText = "Start Recording";

      // 마이크 중지
      stream.getTracks().forEach((track) => track.stop());

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        audioChunks = [];

        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");

        // 서버로 오디오 파일 보내기
        const response = await fetch("/upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        // 결과를 텍스트로 출력하기 
        document.getElementById("transcriptionResult").innerText =
          result.transcribed_text || "No transcription received";
      };
    }
  };
});

document.addEventListener("DOMContentLoaded", function () {
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;
  let stream;

  // FullCalendar 초기화
  var calendarEl = document.getElementById('calendar');
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    dateClick: function (info) {
      alert('Clicked on: ' + info.dateStr);
    }
  });
  calendar.render();

  document.getElementById("recordButton").onclick = async () => {
    if (!isRecording) {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.start();
      isRecording = true;
      document.getElementById("recordButton").innerText = "Stop Recording";
    } else {
      mediaRecorder.stop();
      isRecording = false;
      document.getElementById("recordButton").innerText = "Start Recording";

      // Stop the microphone stream
      stream.getTracks().forEach((track) => track.stop());

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        audioChunks = [];

        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");

        const response = await fetch("/upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        // 서버 응답 확인
        console.log("Server Response:", result);

        // 결과 출력
        document.getElementById("transcriptionResult").innerText =
          result.transcribed_text || "No transcription received";
      };
    }
  };


  
});


