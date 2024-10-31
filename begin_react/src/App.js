import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

function App() {
  const [date, setDate] = useState(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState("");
  const [transcription, setTranscription] = useState("");
  const [sentimentAnalysis, setSentimentAnalysis] = useState(""); // State for sentiment analysis result
  const mediaRecorder = useRef(null);

  useEffect(() => {
    let audioChunks = [];

    const startRecording = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setAudioURL(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    };

    const stopRecording = () => {
      if (mediaRecorder.current) {
        mediaRecorder.current.stop();
        setIsRecording(false);
        audioChunks = [];
      }
    };

    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }

    return () => {
      if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
        mediaRecorder.current.stop();
      }
    };
  }, [isRecording]);

  const handleRecording = () => {
    setIsRecording((prev) => !prev);
  };

  const sendAudioToServer = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Server response data:", data);

      // Set both transcription and sentiment analysis results
      setTranscription(data.transcribed_text || "No transcription available.");
      setSentimentAnalysis(data.sentiment_analysis_result || "No sentiment analysis result available.");
    } catch (error) {
      console.error("Error sending audio to server:", error);
      setTranscription("Error transcribing audio.");
      setSentimentAnalysis("Error retrieving sentiment analysis.");
    }
  };

  return (
    <div>
      <h1>Hello, welcome!</h1>
      <Calendar onChange={setDate} value={date} />

      <button onClick={handleRecording}>
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <button onClick={sendAudioToServer} disabled={!audioBlob}>
        Send Recording
      </button>

      {/* Audio player for the recorded file */}
      {audioURL && (
        <div>
          <h3>Recorded Audio:</h3>
          <audio controls src={audioURL}></audio>
        </div>
      )}

      {/* Display transcription result */}
      {transcription && (
        <div>
          <h3>Transcription:</h3>
          <p>{transcription}</p>
        </div>
      )}

      {/* Display sentiment analysis result */}
      {sentimentAnalysis && (
        <div>
          <h3>Sentiment Analysis Result:</h3>
          <p>{sentimentAnalysis}</p>
        </div>
      )}
    </div>
  );
}

export default App;
