import React, { useState } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, ListItemIcon, Checkbox, Box, Divider, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SummarizeIcon from '@mui/icons-material/Summarize';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

const ColoredPaper = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(145deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
  color: theme.palette.primary.contrastText,
}));

const WhiteBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  color: theme.palette.text.primary,
}));

const SmallText = styled(Typography)(({ theme }) => ({
  fontSize: '0.8rem',
  color: theme.palette.text.secondary,
}));

const BigText = styled(Typography)(({ theme }) => ({
  fontSize: '1.2rem',
  fontWeight: 'bold',
  color: theme.palette.primary.main,
}));

const TranscriptionResult = ({ transcriptionResult}) => {
  const [checkedItems, setCheckedItems] = useState({});

  const handleToggle = (value) => () => {
    setCheckedItems(prev => ({ ...prev, [value]: !prev[value] }));
  };

  const renderSummaryAndActions = (summaryAndActions) => {
    const [summary, actions] = summaryAndActions.split('Action Items:');
    
    return (
      <>
        <ReactMarkdown>{summary}</ReactMarkdown>
        <BigText variant="h6" gutterBottom>Action Items:</BigText>
        <List>
          {actions?.split('\n').filter(item => item.trim()).map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={checkedItems[item] || false}
                  onChange={handleToggle(item)}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText 
                primary={item.replace(/^\s*-\s*/, '').replace(/\*\*/g, '')}
                primaryTypographyProps={{ color: 'text.primary' }}
              />
            </ListItem>
          ))}
        </List>
      </>
    );
  };

  const renderTranscription = (transcription) => {
    return transcription.split('\n').map((line, index) => {
      const [time, content] = line.split('] ');
      return (
        <Box key={index} mb={1}>
          <SmallText component="span">{time}]</SmallText>
          <Typography variant="body2" component="span"> {content}</Typography>
        </Box>
      );
    });
  };

  return (
    <ColoredPaper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Transcription Result
      </Typography>
      
      <WhiteBox>
        <Box display="flex" alignItems="center" mb={2}>
          <SummarizeIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5" component="h3">
            Summary and Actions
          </Typography>
        </Box>
        {renderSummaryAndActions(transcriptionResult.summary_and_actions)}
      </WhiteBox>
      
      <WhiteBox>
        <Box display="flex" alignItems="center" mb={2}>
          <ChatBubbleOutlineIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5" component="h3">
            Transcription
          </Typography>
        </Box>
        <Box maxHeight={300} overflow="auto">
          {renderTranscription(transcriptionResult.transcription)}
        </Box>
      </WhiteBox>
      
      <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
        <SmallText>File: {transcriptionResult.filename}</SmallText>
        <Chip 
          icon={<AssignmentIcon />} 
          label={new Date(transcriptionResult.timestamp).toLocaleString()} 
          variant="outlined" 
          size="small"
        />
      </Box>
    </ColoredPaper>
  );
};

export default TranscriptionResult;