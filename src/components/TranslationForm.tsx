'use client'

import { useState, useCallback, useEffect } from 'react'
import { TranslationTier, TranslationRequest, TranslationResponse } from '@/types/translation'

interface UploadedFile {
  name: string
  size: string
  type: string
}

export default function TranslationForm() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [tier, setTier] = useState<TranslationTier>('standard')
  const [targetLang, setTargetLang] = useState('vi')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [translationTime, setTranslationTime] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)
  const [autoTranslateAfterExtract, setAutoTranslateAfterExtract] = useState(true)

  const tierInfo = {
    basic: {
      name: 'Basic',
      description: 'Fast, simple translation',
      icon: '⚡',
      color: 'blue'
    },
    standard: {
      name: 'Standard',
      description: 'Balanced quality and speed',
      icon: '⭐',
      color: 'green'
    },
    premium: {
      name: 'Premium',
      description: 'Highest quality, professional',
      icon: '💎',
      color: 'purple'
    }
  }

  const languages = [
    { code: 'vi', name: 'Vietnamese' },
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
  ]

  // Toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 z-50 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.style.opacity = '0'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [pollInterval])

  const pollJobStatus = useCallback(async (jobId: string) => {
    const startTime = Date.now()
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/translation/status/${jobId}`)
        const data = await response.json()
        
        if (data.status === 'completed') {
          clearInterval(interval)
          setPollInterval(null)
          setProgress(100)
          setOutput(data.result.translated_text)
          setTranslationTime(Math.round((Date.now() - startTime) / 1000))
          setIsTranslating(false)
          showToast('Translation completed!', 'success')
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setPollInterval(null)
          setError(data.error || 'Translation failed')
          setIsTranslating(false)
          showToast('Translation failed', 'error')
        } else if (data.progress) {
          setProgress(data.progress)
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }, 1000)
    
    setPollInterval(interval)
  }, [])

  const handleTranslate = async (mode: 'direct' | 'queue' = 'direct') => {
    if (!input.trim()) {
      setError('Please enter some text to translate')
      return
    }

    setError('')
    setOutput('')
    setIsTranslating(true)
    setProgress(0)
    setTranslationTime(null)

    const request: TranslationRequest = {
      text: input,
      source_lang: 'en',
      target_lang: targetLang,
      tier: tier
    }

    try {
      const endpoint = mode === 'queue' ? '/api/translation/queue' : '/api/translation'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      const data: TranslationResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Translation failed')
      }

      if (mode === 'queue' && data.jobId) {
        setJobId(data.jobId)
        showToast('Translation queued! Processing...', 'info')
        pollJobStatus(data.jobId)
      } else {
        setOutput(data.translated_text || '')
        setTranslationTime(data.processing_time ? Math.round(data.processing_time) : null)
        setProgress(100)
        setIsTranslating(false)
        showToast('Translation completed!', 'success')
      }

    } catch (err) {
      console.error('Translation error:', err)
      setError(err instanceof Error ? err.message : 'Translation failed')
      setIsTranslating(false)
      showToast(err instanceof Error ? err.message : 'Translation failed', 'error')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setUploadError('')
      setUploadedFile(null)
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }
      
      // Handle PDF queue response
      if (data.queued && data.jobId) {
        showToast(`📄 PDF queued for extraction...`, 'info')
        setInput('') // Clear input while waiting
        
        // Start polling for extraction status
        let pollCount = 0
        const maxPolls = 60 // 60 seconds max
        
        const checkExtraction = setInterval(async () => {
          pollCount++
          
          try {
            const statusRes = await fetch(`/api/extraction-status/${data.jobId}`)
            const status = await statusRes.json()
            
            if (status.status === 'completed') {
              clearInterval(checkExtraction)
              setInput(status.result.text)
              setUploadedFile({
                name: data.fileName,
                size: data.fileSizeFormatted,
                type: data.fileType
              })
              showToast(`✅ PDF extracted successfully: ${status.result.pageCount} pages`, 'success')
              setIsUploading(false)
              
              // Auto-translate if enabled
              if (autoTranslateAfterExtract && status.result.text.trim()) {
                setTimeout(() => {
                  handleTranslate('queue')
                }, 500)
              }
            } else if (status.status === 'failed') {
              clearInterval(checkExtraction)
              throw new Error('PDF extraction failed')
            } else if (pollCount >= maxPolls) {
              clearInterval(checkExtraction)
              throw new Error('PDF extraction timeout')
            }
          } catch (error) {
            clearInterval(checkExtraction)
            setUploadError(error instanceof Error ? error.message : 'Extraction check failed')
            setIsUploading(false)
          }
        }, 1000)
        
      } else {
        // Direct parse response (TXT, DOCX)
        setInput(data.text)
        setUploadedFile({
          name: data.fileName,
          size: data.fileSizeFormatted,
          type: data.fileType
        })
        showToast(`✅ File uploaded: ${data.fileName}`, 'success')
        setIsUploading(false)
      }
      
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
      setIsUploading(false)
      showToast(error instanceof Error ? error.message : 'Upload failed', 'error')
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
    setProgress(0)
    setTranslationTime(null)
    setUploadedFile(null)
    setUploadError('')
    if (pollInterval) {
      clearInterval(pollInterval)
      setPollInterval(null)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">PRISMY Translation System</h1>
          <p className="text-gray-600">Professional document translation with AI</p>
        </div>

        {/* Tier Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Translation Quality Tier
          </label>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(tierInfo).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setTier(key as TranslationTier)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${tier === key 
                    ? `border-${info.color}-500 bg-${info.color}-50` 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-2xl mb-1">{info.icon}</div>
                <div className="font-semibold">{info.name}</div>
                <div className="text-xs text-gray-600 mt-1">{info.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Language
          </label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        {/* File Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload a file (PDF, DOCX, TXT)
          </label>
          <div className="flex items-center space-x-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileSelect}
                disabled={isTranslating || isUploading}
              />
              <div className={`
                px-4 py-2 border-2 border-dashed rounded-lg
                ${isUploading ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}
                transition-colors duration-200
              `}>
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-600">Choose file</span>
                  </div>
                )}
              </div>
            </label>
            
            {uploadedFile && !isUploading && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{uploadedFile.name} ({uploadedFile.size})</span>
              </div>
            )}
          </div>
          
          {uploadError && (
            <p className="mt-2 text-sm text-red-600">{uploadError}</p>
          )}
          
          {/* Auto-translate toggle */}
          <label className="flex items-center mt-3 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoTranslateAfterExtract}
              onChange={(e) => setAutoTranslateAfterExtract(e.target.checked)}
              className="mr-2"
            />
            Auto-translate after PDF extraction
          </label>
        </div>

        {/* Input/Output Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Text (English)
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to translate or upload a file..."
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isTranslating}
            />
            <div className="mt-2 text-sm text-gray-500">
              {input.length > 0 && `${input.split(/\s+/).length} words, ${input.length} characters`}
            </div>
          </div>

          {/* Output */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Translated Text
            </label>
            <textarea
              value={output}
              readOnly
              placeholder="Translation will appear here..."
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg resize-none bg-gray-50"
            />
            {translationTime !== null && (
              <div className="mt-2 text-sm text-gray-500">
                Completed in {translationTime}s
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isTranslating && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => handleTranslate('direct')}
            disabled={isTranslating || !input.trim()}
            className={`
              flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${isTranslating || !input.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              }
            `}
          >
            {isTranslating ? 'Translating...' : 'Translate Now'}
          </button>
          
          <button
            onClick={() => handleTranslate('queue')}
            disabled={isTranslating || !input.trim()}
            className={`
              flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${isTranslating || !input.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
              }
            `}
          >
            {isTranslating ? 'Processing...' : 'Translate (Async Queue)'}
          </button>
          
          <button
            onClick={handleClear}
            disabled={isTranslating}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
          >
            Clear
          </button>
        </div>

        {/* Feature Info */}
        <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="font-semibold text-blue-900 mb-1">Direct Translation</div>
            <div className="text-blue-700">Instant processing for short texts</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="font-semibold text-green-900 mb-1">Async Queue</div>
            <div className="text-green-700">Background processing for large documents</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="font-semibold text-purple-900 mb-1">File Support</div>
            <div className="text-purple-700">PDF, DOCX, TXT automatic extraction</div>
          </div>
        </div>
      </div>
    </div>
  )
}