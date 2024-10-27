// app/page.tsx
'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Mic, MicOff, Upload } from "lucide-react"
import axios from 'axios'

const baseURL = "http://127.0.0.1:5000"

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [transcriptionResult, setTranscriptionResult] = useState<{
    transcription: string
    summary_and_actions: string 
  } | null>(null)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [recordedAudioName, setRecordedAudioName] = useState<string | null>(null)
  const audioRef = useRef<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: BlobPart[] = []

      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data)
      })

      mediaRecorder.addEventListener("stop", async () => {
        const audioBlob = new Blob(audioChunks)
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recorded_audio.webm')

        setRecordedAudioUrl(URL.createObjectURL(audioBlob))
        setRecordedAudioName('recorded_audio.webm')

        setIsTranscribing(true)
        setIsRecording(false)

        try {
          const response = await axios.post(`${baseURL}/transcribe`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          setTranscriptionResult(response.data)
        } catch (error) {
          console.error('Error:', error)
          setErrorMessage('Error transcribing recorded audio')
        } finally {
          setIsTranscribing(false)
        }
      })

      mediaRecorder.start()
      audioRef.current = mediaRecorder
      setIsRecording(true)
      setErrorMessage('')
    } catch (error) {
      console.error("Error accessing microphone:", error)
      setErrorMessage('Error accessing microphone')
    }
  }

  const stopRecording = () => {
    audioRef.current?.stop()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log("File uploaded:", file) 
      setIsTranscribing(true)
      const formData = new FormData()
      formData.append('audio', file)

      try {
        const response = await axios.post(`${baseURL}/transcribe`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setTranscriptionResult(response.data)
        setRecordedAudioUrl(URL.createObjectURL(file))
        setRecordedAudioName(file.name)
      } catch (error) {
        console.error('Error:', error)
        setErrorMessage('Error transcribing uploaded audio')
      } finally {
        setIsTranscribing(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Meet-sense Transcription</h1>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Record or Upload Audio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center space-x-4">
            <Button
              variant={isRecording ? "destructive" : "default"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
            >
              {isRecording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecording || isTranscribing}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Audio
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
            />
          </div>

          {recordedAudioUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium">{recordedAudioName}</p>
              <audio controls src={recordedAudioUrl} className="w-full mt-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {isTranscribing && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {transcriptionResult && (
        <Card>
          <CardHeader>
            <CardTitle>Transcription Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="transcription">
              <TabsList>
                <TabsTrigger value="transcription">Transcription</TabsTrigger>
                <TabsTrigger value="meeting-notes">Meeting Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="transcription">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {transcriptionResult.transcription}
                </pre>
              </TabsContent>
              <TabsContent value="meeting-notes">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {transcriptionResult.summary_and_actions}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
