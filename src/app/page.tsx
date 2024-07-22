'use client'

import React, { useState, useRef, useEffect } from 'react';
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
  Input,
  CircularProgress,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { MicExternalOffRounded, MicNone } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown'; 

export default function Home() {
  const [numSpeakers, setNumSpeakers] = useState(0);
  const [speakerForms, setSpeakerForms] = useState<Array<{ name: string; audio: File | null; audioUrl: string | null }>>([]);

  const [transcriptionResult, setTranscriptionResult] = useState<{ message: string, summary_and_actions: string, transcription: string } | null>(null);
  const [ngrokUrl, setNgrokUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [uploadedAudioName, setUploadedAudioName] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioName, setRecordedAudioName] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const [pastTranscriptions, setPastTranscriptions] = useState<any[]>([]);

  const audioRef = useRef<MediaRecorder | null>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);

  // addd this header "ngrok-skip-browser-warning": "69420"

  useEffect(() => {
    const fetchPastTranscriptions = async () => {
      if (!ngrokUrl) {
        setFetchError('Please enter the ngrok URL');
        return;
      }

      try {
        const response = await axios.get(`${ngrokUrl}/get_transcriptions`, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'ngrok-skip-browser-warning': '69420'
           }
        }
        );
        setPastTranscriptions(response.data);
        setFetchError(null);
      } catch (error) {
        console.error('Error fetching past transcriptions:', error);
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            setFetchError('Connection timed out. Please check your ngrok URL and try again.');
          } else if (error.response) {
            setFetchError(`Error: ${error.response.status} - ${error.response.data}`);
          } else if (error.request) {
            setFetchError('No response received. Please check your network connection and ngrok URL.');
          } else {
            setFetchError('An unexpected error occurred. Please try again.');
          }
        } else {
          setFetchError('An unexpected error occurred. Please try again.');
        }
        setPastTranscriptions([]);
      }
    };

    if (ngrokUrl) {
      fetchPastTranscriptions();
    }
  }, [ngrokUrl]);

  

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
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

        const updatedForms = [...speakerForms];
        updatedForms[index].audio = audioFile;
        updatedForms[index].audioUrl = URL.createObjectURL(audioFile);
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

    setIsEnrolling(true); // Start loader

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

      });
      alert(response.data.message);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error enrolling speakers');
    }
    finally {
      setIsEnrolling(false); // Stop loader
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

    // Set the audio URL and file name to display the audio player and file name
    setUploadedAudioUrl(URL.createObjectURL(file));
    setUploadedAudioName(file.name);

    setIsTranscribing(true); // Start loader

    try {
      const response = await axios.post(`${ngrokUrl}/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Access-Control-Allow-Origin': '*'
        }
      });
      setTranscriptionResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error transcribing audio');
    } finally {
      setIsTranscribing(false); // Stop loader
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
  
        // Set the recorded audio URL and name
        setRecordedAudioUrl(URL.createObjectURL(audioBlob));
        setRecordedAudioName('recorded_audio.webm');
  
        setIsTranscribing(true); // Start loader
        setIsRecording(false); // Stop recording indicator
  
        try {
          const response = await axios.post(`${ngrokUrl}/transcribe`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setTranscriptionResult(response.data);
        } catch (error) {
          console.error('Error:', error);
          setErrorMessage('Error transcribing recorded audio');
        } finally {
          setIsTranscribing(false); // Stop loader
        }
      });
  
      mediaRecorder.start();
      audioRef.current = mediaRecorder;
      setIsRecording(true); // Start recording indicator
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
        <Typography variant="body2" gutterBottom mb={2} color={"#b3b3b3"}>
          To later identify speakers in the transcription, you need to enroll them by providing their names and audio samples.
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
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  label={`Speaker ${index + 1} Name`}
                  value={speaker.name}
                  onChange={(e) => handleSpeakerChange(index, 'name', e.target.value)}
                  sx={{ mb: 2 }}
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
                    onChange={(e) => handleSpeakerChange(index, 'audio', e.target.files?.[0] || '')}
                  />
                </Button>
                <Button
                  variant="contained"
                  onClick={() => startEnrollmentRecording(index)}
                  disabled={recordingIndex !== null}
                  sx={{ mr: 2 }}
                >
                  {recordingIndex === index ? 'Recording...' : 'Record Audio'}
                </Button>
                {recordingIndex === index && (
                  <Button
                    variant="contained"
                    onClick={stopEnrollmentRecording}
                    color="error"
                  >
                    Stop Recording
                  </Button>
                )}
                {speaker.audioUrl && (
                  <Box mt={2}>
                    <audio controls src={speaker.audioUrl} />
                  </Box>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
        {numSpeakers > 0 && (
          <Button
            variant="contained"
            onClick={enrollSpeakers}
            disabled={isEnrolling} // Disable button during loading
            sx={{ mt: 2 }}
          >
            {isEnrolling ? <CircularProgress size={24} color="inherit" /> : "Enroll Speakers"}
          </Button>
        )}
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Audio Transcription
        </Typography>
        <Typography variant="body2" gutterBottom mb={2} color={"#b3b3b3"}>
          Upload an audio file or record a new one for transcription.
        </Typography>
        <Box sx={{ mb: 2 }}>
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
              onChange={uploadAudio}
            />
          </Button>
          <Button
            variant="contained"
            onClick={startRecording}
            disabled={isRecording} // Disable button during recording
          >
            {isRecording ? <CircularProgress size={24} color="inherit" /> : "Record Audio"}
          </Button>
          {isRecording && (
            <Button
              variant="contained"
              onClick={stopRecording}
              color="error"
              sx={{ ml: 2 }}
            >
              Stop Recording
            </Button>
          )}
        </Box>
        {uploadedAudioUrl && (
          <Box mt={2}>
            <Typography variant="body1" gutterBottom>
              Uploaded Audio: {uploadedAudioName}
            </Typography>
            <audio controls src={uploadedAudioUrl} />
          </Box>
        )}
        {recordedAudioUrl && (
          <Box mt={2}>
            <Typography variant="body1" gutterBottom>
              Recorded Audio: {recordedAudioName}
            </Typography>
            <audio controls src={recordedAudioUrl} />
          </Box>
        )}
      </Paper>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}
      {isTranscribing && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="body1" gutterBottom>
            Transcribing...
          </Typography>
        </Paper>
      )}

      {transcriptionResult && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Transcription Result
          </Typography>
          <Typography variant="h6" component="h3" gutterBottom>
            Summary and Actions
          </Typography>
          <Typography variant="body1" gutterBottom mb={2}>
            {/* {transcriptionResult.summary_and_actions} */}
            <ReactMarkdown>{transcriptionResult.summary_and_actions}</ReactMarkdown>
          </Typography>
          <Typography variant="h6" component="h3" gutterBottom>
            Transcription
          </Typography>
          <Typography variant="body1" gutterBottom mb={2}>
            {transcriptionResult.transcription}
          </Typography>
        </Paper>
      )}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Past Transcriptions
        </Typography>
        {fetchError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {fetchError}
          </Alert>
        ) : pastTranscriptions.length === 0 ? (
          <Typography variant="body1">No past transcriptions found.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Filename</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pastTranscriptions.map((transcription) => (
                  <TableRow key={transcription._id}>
                    <TableCell>{new Date(transcription.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{transcription.filename}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        onClick={() => setTranscriptionResult(transcription)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

    </Container>
  );
}
