// src/hooks/useTranslation.ts - Final fixed version
import { useState, useRef, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type TranslationStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
type TranslationTier = 'basic' | 'standard' | 'premium' | 'free'

interface TranslationResponse {
  job_id: string
  status: string
  total_pages?: number
  file_type?: string
  message?: string
  error?: string
  debug_info?: {
    source_language: string
    target_language: string
    original_target_input: string
  }
}

interface JobStatus {
  job_id: string
  status: string
  progress: number
  message?: string
  error?: string
  output_file?: string
  target_language?: string
}

export const useTranslation = () => {
  const [status, setStatus] = useState<TranslationStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingRef = useRef(false)

  // ✅ RENAMED: clearState instead of reset to avoid conflicts
  const clearState = useCallback(() => {
    console.log('🔄 Clearing translation state')
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    
    isProcessingRef.current = false
    setIsPolling(false)
    setProgress(0)
    setError(null)
    setJobId(null)
    setStatus('idle')
  }, [])

  const pollJobStatus = useCallback(async (jobId: string) => {
    if (isProcessingRef.current) return

    isProcessingRef.current = true
    setIsPolling(true)
    
    console.log(`🔄 Starting polling for job: ${jobId}`)
    
    let attempts = 0
    const maxAttempts = 150
    
    const poll = async () => {
      try {
        attempts++
        console.log(`📊 Polling attempt ${attempts}/${maxAttempts}`)
        
        if (attempts > maxAttempts) {
          setError('Translation timeout')
          setStatus('error')
          clearInterval(pollingIntervalRef.current!)
          pollingIntervalRef.current = null
          isProcessingRef.current = false
          setIsPolling(false)
          return
        }

        const response = await fetch(`${API_URL}/api/v1/large/status/${jobId}`)
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`)
        }
        
        const data: JobStatus = await response.json()
        console.log(`📈 Status update:`, data)
        
        setProgress(data.progress || 0)
        
        if (data.status === 'completed') {
          console.log('🎉 Job completed!')
          setStatus('completed')
          setProgress(100)
          
          clearInterval(pollingIntervalRef.current!)
          pollingIntervalRef.current = null
          isProcessingRef.current = false
          setIsPolling(false)
          
          setTimeout(() => downloadFile(jobId), 500)
          
        } else if (data.status === 'failed' || data.error) {
          setError(data.error || 'Translation failed')
          setStatus('error')
          clearInterval(pollingIntervalRef.current!)
          pollingIntervalRef.current = null
          isProcessingRef.current = false
          setIsPolling(false)
          
        } else if (data.status === 'processing') {
          setStatus('processing')
        }
        
      } catch (error: any) {
        console.error('Polling error:', error)
        if (attempts >= maxAttempts) {
          setError('Status check failed')
          setStatus('error')
          clearInterval(pollingIntervalRef.current!)
          pollingIntervalRef.current = null
          isProcessingRef.current = false
          setIsPolling(false)
        }
      }
    }
    
    pollingIntervalRef.current = setInterval(poll, 2000)
    await poll()
  }, [])

  const downloadFile = useCallback(async (jobId: string) => {
    try {
      console.log(`📥 Downloading job: ${jobId}`)
      
      const response = await fetch(`${API_URL}/api/v1/large/download/${jobId}`)
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }
      
      const blob = await response.blob()
      console.log(`✅ Downloaded: ${blob.size} bytes`)
      
      if (blob.size === 0) {
        throw new Error('Empty file downloaded')
      }
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `translated_${jobId}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      console.log('🎉 Download completed!')
      
      // Auto-clear state after successful download
      setTimeout(() => {
        console.log('🔄 Auto-clearing state for next translation')
        clearState()
      }, 2000)
      
    } catch (error: any) {
      console.error('Download failed:', error)
      setError(`Download failed: ${error.message}`)
      setStatus('error')
    }
  }, [clearState])

  // ✅ FIXED: Use explicit parameter to avoid race condition
  const translateFile = useCallback(async (
    file: File,
    sourceLanguage: string = 'auto',
    targetLanguage: string = 'vi',  // ✅ This comes from snapshot, not state
    tier: TranslationTier = 'standard'
  ) => {
    try {
      console.log('🚀 Starting translation with parameters:', {
        fileName: file.name,
        sourceLanguage,
        targetLanguage,  // ✅ Key debug - should be 'en' for English
        tier,
        API_URL
      })

      clearState()
      setStatus('uploading')
      setProgress(0)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('source_lang', sourceLanguage)
      formData.append('target_lang', targetLanguage)  // ✅ Key parameter
      formData.append('tier', tier)

      // ✅ DEBUG: Log form data contents
      console.log('📤 Form data being sent:')
      console.log(`📁 file: ${file.name}`)
      console.log(`🗣️ source_lang: ${sourceLanguage}`)
      console.log(`🎯 target_lang: ${targetLanguage}`)  // ✅ Should be 'en' for English
      console.log(`⭐ tier: ${tier}`)

      const response = await fetch(`${API_URL}/api/v1/large/translate`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload failed: ${response.status} ${errorText}`)
      }

      const data: TranslationResponse = await response.json()
      console.log('✅ Upload successful:', data)

      // ✅ DEBUG: Log debug_info from API response
      if (data.debug_info) {
        console.log('🔍 API Debug Info:')
        console.log(`🗣️ source_language: ${data.debug_info.source_language}`)
        console.log(`🎯 target_language: ${data.debug_info.target_language}`)  // ✅ Should be 'en'
        console.log(`📝 original_target_input: ${data.debug_info.original_target_input}`)
      }

      if (!data.job_id) {
        throw new Error('No job ID received')
      }

      setJobId(data.job_id)
      setStatus('processing')
      setProgress(10)

      await pollJobStatus(data.job_id)

    } catch (error: any) {
      console.error('❌ Translation failed:', error)
      setError(`Translation failed: ${error.message}`)
      setStatus('error')
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      isProcessingRef.current = false
      setIsPolling(false)
    }
  }, [pollJobStatus, clearState])

  // ✅ EXPORT: clearState instead of reset
  return {
    translateFile,
    clearState,  // ✅ RENAMED from reset
    status,
    progress,
    error,
    jobId,
    isPolling,
    isIdle: status === 'idle',
    isUploading: status === 'uploading',
    isProcessing: status === 'processing',
    isCompleted: status === 'completed',
    isError: status === 'error'
  }
}