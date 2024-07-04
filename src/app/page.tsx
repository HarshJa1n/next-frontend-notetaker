'use client'

import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Button,
  TextField,
  Box,
  Paper,
  List,
  ListItem,
  Alert,
  IconButton,
} from '@mui/material';
import { MicExternalOffRounded, MicNone } from '@mui/icons-material';



export default function Home() {
  const [numSpeakers, setNumSpeakers] = useState(0);
  // const [speakerForms, setSpeakerForms] = useState<Array<{ name: string; audio: File | null }>>([]);
  const [speakerForms, setSpeakerForms] = useState<Array<{ name: string; audio: File | null; audioUrl: string | null }>>([]);

  const [transcriptionResult, setTranscriptionResult] = useState('');
  const [ngrokUrl, setNgrokUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const audioRef = useRef<MediaRecorder | null>(null);
  

  const initializeEnrollment = () => {
    const forms = Array.from({ length: numSpeakers }, () => ({
      name: '',
      audio: null,
      audioUrl: null
    }));
    setSpeakerForms(forms);
  };


  const handleSpeakerChange = (index: number, field: 'name' | 'audio', value: string | File) => {
    const updatedForms = [...speakerForms];
    updatedForms[index][field] = value as any;
    if (field === 'audio' && value instanceof File) {
      updatedForms[index].audioUrl = URL.createObjectURL(value);
    }
    setSpeakerForms(updatedForms);
  };
  

  const startEnrollmentRecording = async (index: number) => {
    if (!ngrokUrl) {
      setErrorMessage('Please enter the ngrok URL');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const updatedForms = [...speakerForms];
        updatedForms[index].audio = audioBlob;
        updatedForms[index].audioUrl = URL.createObjectURL(audioBlob);
        setSpeakerForms(updatedForms);
      });

      mediaRecorder.start();
      audioRef.current = mediaRecorder;
      setRecordingIndex(index);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setErrorMessage('Error accessing microphone');
    }
  };

  const stopEnrollmentRecording = () => {
    audioRef.current?.stop();
    setRecordingIndex(null);
  };


  const enrollSpeakers = async () => {
    if (!ngrokUrl) {
      setErrorMessage('Please enter the ngrok URL');
      return;
    }

    const formData = new FormData();
    formData.append('num_speakers', numSpeakers.toString());

    speakerForms.forEach((speaker, index) => {
      formData.append('names', speaker.name);
      if (speaker.audio) {
        formData.append(`audio_${index}`, speaker.audio, `speaker_${index}.webm`);
      }
    });

    try {
      const response = await axios.post(`${ngrokUrl}/enroll`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Access-Control-Allow-Origin': '*'
        },
        withCredentials: false
      });
      alert(response.data.message);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error enrolling speakers');
    }
  };

  const uploadAudio = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!ngrokUrl) {
      setErrorMessage('Please enter the ngrok URL');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await axios.post(`${ngrokUrl}/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
           'Access-Control-Allow-Origin': '*'
         }
      });
      setTranscriptionResult(response.data.transcription);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error transcribing audio');
    }
  };

  const startRecording = async () => {
    if (!ngrokUrl) {
      setErrorMessage('Please enter the ngrok URL');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", async () => {
        const audioBlob = new Blob(audioChunks);
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recorded_audio.webm');

        try {
          const response = await axios.post(`${ngrokUrl}/transcribe`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setTranscriptionResult(response.data.transcription);
        } catch (error) {
          console.error('Error:', error);
          setErrorMessage('Error transcribing recorded audio');
        }
      });

      mediaRecorder.start();
      audioRef.current = mediaRecorder;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setErrorMessage('Error accessing microphone');
    }
  };

  const stopRecording = () => {
    audioRef.current?.stop();
  };

  return (
    <Container maxWidth="md" style={{
    }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Transcription with Speaker Identification
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3, color: "#dedede44" }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Backend Configuration
        </Typography>
        <TextField
          fullWidth
          label="ngrok URL"
          value={ngrokUrl}
          onChange={(e) => setNgrokUrl(e.target.value)}
          placeholder="Enter the ngrok URL (e.g., https://1234-56-78-910.ngrok.io)"
          sx={{ mb: 2 }}
        />
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Speaker Enrollment
        </Typography>
        <Box sx={{ mb: 2 }}>
          <TextField
            type="number"
            label="Number of speakers"
            value={numSpeakers}
            onChange={(e) => setNumSpeakers(parseInt(e.target.value))}
            sx={{ mr: 2 }}
          />
          <Button variant="contained" onClick={initializeEnrollment}>
            Initialize Enrollment
          </Button>
        </Box>
        <List>
          {speakerForms.map((speaker, index) => (
            <ListItem key={index}>
              <TextField
                label={`Speaker ${index + 1} Name`}
                value={speaker.name}
                onChange={(e) => handleSpeakerChange(index, 'name', e.target.value)}
                sx={{ mr: 2 }}
              />
              <Button
                variant="contained"
                component="label"
                sx={{ mr: 2 }}
              >
                Upload Audio
                <input
                  type="file"
                  hidden
                  accept="audio/*"
                  onChange={(e) => handleSpeakerChange(index, 'audio', e.target.files?.[0] || null)}
                />
              </Button>
              <IconButton 
                color={recordingIndex === index ? "secondary" : "primary"}
                onClick={() => recordingIndex === index ? stopEnrollmentRecording() : startEnrollmentRecording(index)}
              >
                <MicNone />
              </IconButton>
              {speaker.audioUrl && <audio controls src={speaker.audioUrl} />}
            </ListItem>
          ))}
        </List>
        {speakerForms.length > 0 && (
          <Button variant="contained" onClick={enrollSpeakers}>
            Enroll Speakers
          </Button>
        )}
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Audio Upload for Transcription
        </Typography>
        <Button variant="contained" component="label">
          Upload Audio
          <input type="file" hidden accept="audio/*" onChange={uploadAudio} />
        </Button>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Record Audio
        </Typography>
        <Button variant="contained" onClick={startRecording} sx={{ mr: 2 }}>
          Start Recording
        </Button>
        <Button variant="contained" onClick={stopRecording}>
          Stop Recording
        </Button>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Transcription Result
        </Typography>
        <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', bgcolor: '#f0f0f0', p: 2, borderRadius: 1, color:'#000' }}>
          {transcriptionResult}
        </Typography>
      </Paper>

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}
    </Container>
  );
}
//display the audio
//background
//loader maybe