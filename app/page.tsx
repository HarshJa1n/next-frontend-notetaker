// app/page.tsx
'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  const [mode, setMode] = useState<'transcribe' | 'summarize'>('transcribe')
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
    <div className="container mx-auto max-w-3xl space-y-8 py-8">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "secondary"}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
            className="h-24 w-24 rounded-full text-2xl"
          >
            {isRecording ? <MicOff className="h-12 w-12" /> : <Mic className="h-12 w-12" />}
          </Button>
          <p className="mt-4 text-lg font-semibold">
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center space-x-4">
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

      <Tabs defaultValue="transcribe" onValueChange={(value) => setMode(value as 'transcribe' | 'summarize')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transcribe">Transcribe</TabsTrigger>
          <TabsTrigger value="summarize">Summarize</TabsTrigger>
        </TabsList>
      </Tabs>

      {isTranscribing && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {recordedAudioUrl && (
        <div className="mt-4">
          <p className="text-sm font-medium">{recordedAudioName}</p>
          <audio controls src={recordedAudioUrl} className="w-full mt-2" />
        </div>
      )}

      {transcriptionResult && (
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue={mode}>
              <TabsList>
                <TabsTrigger value="transcribe">Transcription</TabsTrigger>
                <TabsTrigger value="summarize">Summary</TabsTrigger>
              </TabsList>
              <TabsContent value="transcribe">
                <pre className="whitespace-pre-wrap font-mono text-sm mt-4">
                  {transcriptionResult.transcription}
                </pre>
              </TabsContent>
              <TabsContent value="summarize">
                <pre className="whitespace-pre-wrap font-mono text-sm mt-4">
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
