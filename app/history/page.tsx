'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

const baseURL = 'http://127.0.0.1:5000'

export default function History() {
  const [transcriptions, setTranscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTranscriptions()
  }, [])

  const fetchTranscriptions = async () => {
    try {
      const response = await fetch(`${baseURL}/get_transcriptions`)
      const data = await response.json()
      setTranscriptions(data)
    } catch (error) {
      console.error('Error fetching transcriptions:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transcription History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transcriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            {transcriptions.map((transcription: {}) => (
              <div key={transcription._id} className="mb-4 p-4 border rounded">
                <h3 className="text-lg font-semibold">{transcription.filename}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(transcription.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
