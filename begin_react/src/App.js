import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css'

function App() {
  const [date, setDate] = useState(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState("");
  const [transcription, setTranscription] = useState("");
  const [sentimentData, setSentimentData] = useState({}); // Store sentiment data by date
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
    };

    const stopRecording = () => {
      if (mediaRecorder.current) {
        mediaRecorder.current.stop();
        audioChunks = [];
      }
    };

    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }

    return () => {
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
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
    formData.append('file', audioBlob, 'recording.wav');

    try {
      const response = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Server response data:', data);

      // Update transcription and sentiment analysis result
      setTranscription(data.transcribed_text || 'No transcription available.');

      // Store the sentiment result with the current date in sentimentData state
      setSentimentData((prevData) => {
        const updatedData = { ...prevData };
        if (data.sentiment_analysis_result.toLowerCase() === 'positive') {
          updatedData[date.toDateString()] = 'positive';
        } else {
          delete updatedData[date.toDateString()]; // Remove negative or neutral sentiment
        }
        return updatedData;
      });
    } catch (error) {
      console.error('Error sending audio to server:', error);
      setTranscription('Error transcribing audio.');
    }
  };

  // Render image on calendar tiles based on sentimentData
  const tileContent = ({ date }) => {
    const sentiment = sentimentData[date.toDateString()];
    if (sentiment === 'positive') {
      return <img src="/images/faceCharacter.png" alt="positive" style={{ width: '20px', height: '20px' }} />;
    }
    return null;
  };

  return (
    <div>
      <h1>꾸기의 플래너</h1>
      <Calendar onChange={setDate} value={date} locale="en-US" 
        tileContent={tileContent} 
         // Set calendar to start on Sunday and end on Saturday
      />

      <button className="button" onClick={handleRecording}>
        {isRecording ? 'STOP' : 'RECORD'}
      </button>
      <button className="button" onClick={sendAudioToServer} disabled={!audioBlob}>
        SEND
      </button>

      {/* Display transcription result */}
      {transcription && (
        <div>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
}

export default App;
