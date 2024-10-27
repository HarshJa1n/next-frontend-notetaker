// app/page.tsx
'use client';
import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Tab,
  Tabs,
  Typography,
  CircularProgress,
  Container,
  Alert,
} from '@mui/material';
import { Mic, MicOff, Upload } from '@mui/icons-material';
import axios from 'axios';

const baseURL = "http://127.0.0.1:5000"

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [transcriptionResult, setTranscriptionResult] = useState([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioName, setRecordedAudioName] = useState<string | null>(null);
  const audioRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
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

        // Set the recorded audio URL and name
        setRecordedAudioUrl(URL.createObjectURL(audioBlob));
        setRecordedAudioName('recorded_audio.webm');

        setIsTranscribing(true);
        setIsRecording(false);

        try {
          const response = await axios.post(`${baseURL}/transcribe`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setTranscriptionResult(response.data);
        } catch (error) {
          console.error('Error:', error);
          setErrorMessage('Error transcribing recorded audio');
        } finally {
          setIsTranscribing(false);
        }
      });

      mediaRecorder.start();
      audioRef.current = mediaRecorder;
      setIsRecording(true);
      setErrorMessage('');
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setErrorMessage('Error accessing microphone');
    }
  };

  const stopRecording = () => {
    audioRef.current?.stop();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append('audio', file);

      try {
        const response = await axios.post(`${baseURL}/transcribe`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setTranscriptionResult(response.data);
        setRecordedAudioUrl(URL.createObjectURL(file));
        setRecordedAudioName(file.name);
      } catch (error) {
        console.error('Error:', error);
        setErrorMessage('Error transcribing uploaded audio');
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Meet-sense Transcription
      </Typography>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          mb: 4,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, my: 4 }}>
          <Button
            variant="contained"
            color={isRecording ? 'error' : 'primary'}
            startIcon={isRecording ? <MicOff /> : <Mic />}
            onClick={isRecording ? stopRecording : startRecording}
            sx={{ py: 2, px: 4 }}
            disabled={isTranscribing}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ py: 2, px: 4 }}
            disabled={isRecording || isTranscribing}
          >
            Upload Audio
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            style={{ display: 'none' }}
          />
        </Box>

        {recordedAudioUrl && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {recordedAudioName}
            </Typography>
            <audio controls src={recordedAudioUrl} />
          </Box>
        )}
      </Paper>

      {isTranscribing && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {transcriptionResult && (
        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)} centered>
            <Tab label="Transcription" />
            <Tab label="Meeting Notes" />
          </Tabs>
          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <Typography
                component="pre"
                sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
              >
                {transcriptionResult?.transcription}
              </Typography>
            )}
            {tabValue === 1 && (
              <Typography
                component="pre"
                sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
              >
                {transcriptionResult.summary_and_actions}
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Container>
  );
}