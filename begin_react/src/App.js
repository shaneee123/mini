import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';

function App() {
  const [date, setDate] = useState(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState("");
  const [transcription, setTranscription] = useState("");
  const [sentimentData, setSentimentData] = useState({});
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

        // Send audio to server after recording stops
        sendAudioToServer(audioBlob); // call sendAudioToServer with the recorded audioBlob
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

  const sendAudioToServer = async (audioBlob) => {
    if (!audioBlob) return;
    
    setIsLoading(true); // 로딩 시작

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

      setTranscription(data.transcribed_text || 'No transcription available.');

      const { sentiment, mentioned_date } = data.sentiment_analysis_result;

      if (mentioned_date && sentiment.toLowerCase() === 'positive') {
        setSentimentData((prevData) => ({
          ...prevData,
          [mentioned_date]: 'positive',
        }));
      } else {
        setSentimentData((prevData) => {
          const updatedData = { ...prevData };
          delete updatedData[mentioned_date];
          return updatedData;
        });
      }
    } catch (error) {
      console.error('Error sending audio to server:', error);
      setTranscription('Error transcribing audio.');
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  const tileContent = ({ date }) => {
    const dateKey = date.toISOString().slice(0, 10);
    const sentiment = sentimentData[dateKey];
    if (sentiment === 'positive') {
      return <img src="/images/faceCharacter.png" alt="positive" style={{ width: '20px', height: '20px' }} />;
    }
    return null;
  };

  return (
    <div className='app-container'>
      <h1>꾸기의 플래너</h1>
      <Calendar 
        onChange={setDate} 
        value={date} 
        locale="en-US"
        tileContent={tileContent}
      />

      <button className="button" onClick={handleRecording}>
        {isRecording ? 'STOP' : 'RECORD'}
      </button>

      {/* 로딩 상태 표시 */}
      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          
        </div>
      )}

      {transcription && (
        <div>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
}

export default App;
