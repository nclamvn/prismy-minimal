'use client'

import { useState } from 'react'
import { Upload, Loader2, FileText, CheckCircle, AlertCircle, FileIcon } from 'lucide-react'

interface DocumentUploaderProps {
  onUpload?: (file: File, analysis: any) => void
}

interface FileFormat {
  icon: string
  name: string
}

export function DocumentUploader({ onUpload }: DocumentUploaderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supportedFormats: Record<string, FileFormat> = {
    'application/pdf': { icon: '📄', name: 'PDF' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', name: 'Word' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: '📊', name: 'PowerPoint' },
    'text/plain': { icon: '📃', name: 'Text' },
    'text/markdown': { icon: '📑', name: 'Markdown' }
  };

  const getFileIcon = (fileType: string) => {
    return supportedFormats[fileType]?.icon || '📎';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Upload failed')
      }

      setAnalysis(result)
      onUpload?.(selectedFile, result)
    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.message || 'Failed to process file')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
        {!file && !isAnalyzing && (
          <div>
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Upload Document</h3>
            <p className="text-sm text-gray-500 mb-4">
              Supported formats: PDF, Word, PowerPoint, Text, Markdown
            </p>
            
            <div className="flex justify-center gap-4 mb-4">
              {Object.entries(supportedFormats).map(([type, info]) => (
                <div key={type} className="text-center">
                  <span className="text-2xl">{info.icon}</span>
                  <p className="text-xs text-gray-500 mt-1">{info.name}</p>
                </div>
              ))}
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
              />
              <span className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Choose File
              </span>
            </label>
          </div>
        )}

        {isAnalyzing && (
          <div className="py-8">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-lg font-medium">AI is analyzing your document...</p>
            <p className="text-sm text-gray-500 mt-2">
              Detecting language, type, and complexity
            </p>
          </div>
        )}

        {error && !isAnalyzing && (
          <div className="py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-lg font-medium text-red-600">Error</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
            <button
              onClick={() => {
                setFile(null)
                setError(null)
                setAnalysis(null)
              }}
              className="mt-4 px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {analysis && !isAnalyzing && !error && file && (
          <div className="text-left">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold">Analysis Complete!</h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getFileIcon(file.type)}</span>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB • {supportedFormats[file.type]?.name || 'Unknown'}
                  </p>
                </div>
              </div>

              {analysis.analysis && (
                <>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-medium capitalize">
                        {analysis.analysis.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Language:</span>
                      <span className="ml-2 font-medium uppercase">
                        {analysis.analysis.language}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Complexity:</span>
                      <span className="ml-2 font-medium">
                        {analysis.analysis.complexity}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Est. Time:</span>
                      <span className="ml-2 font-medium">
                        {analysis.analysis.estimatedTime}
                      </span>
                    </div>
                  </div>

                  {analysis.analysis.insights?.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        AI Insights:
                      </p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {analysis.analysis.insights.map((insight: string, i: number) => (
                          <li key={i}>• {insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => {
                setFile(null)
                setAnalysis(null)
                setError(null)
              }}
              className="mt-4 text-sm text-gray-600 hover:text-gray-800"
            >
              Upload another file
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
