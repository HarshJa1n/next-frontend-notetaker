'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';

const baseURL = 'http://127.0.0.1:5000';

export default function History() {
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTranscriptions();
  }, []);

  const fetchTranscriptions = async () => {
    try {
      const response = await fetch(`${baseURL}/get_transcriptions`);
      const data = await response.json();
      setTranscriptions(data);
    } catch (error) {
      console.error('Error fetching transcriptions:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Transcription History
      </Typography>
      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <List>
          {transcriptions.map((transcription) => (
            <ListItem key={transcription?._id}>
              <ListItemText
                primary={transcription?.filename}
                secondary={new Date(transcription?.timestamp).toLocaleString()}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}