'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Loader2, CheckCircle, AlertCircle, Play, Download, Archive, AlertTriangle, RefreshCw } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

interface FileItem {
  id: string
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error'
  result?: any
  error?: string
}

interface BatchUploaderProps {
  onBatchComplete?: (results: FileItem[]) => void
}

export function BatchUploader({ onBatchComplete }: BatchUploaderProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadedFiles, setDownloadedFiles] = useState<Set<string>>(new Set())
  const [showDownloadTip, setShowDownloadTip] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const newFiles: FileItem[] = selectedFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      status: 'pending'
    }))
    setFiles(prev => [...prev, ...newFiles])
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    setDownloadedFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const processFiles = async () => {
    setIsProcessing(true)
    const filesToProcess = [...files]
    
    for (let i = 0; i < filesToProcess.length; i++) {
      const fileItem = filesToProcess[i]
      if (fileItem.status !== 'pending') continue

      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'processing' } : f
      ))

      try {
        const formData = new FormData()
        formData.append('file', fileItem.file)

        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.message || 'Processing failed')
        }

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'completed', result } : f
        ))
        
        // Save to history
        if (typeof window !== 'undefined') {
          const historyItem = {
            id: `history-${Date.now()}-${i}`,
            fileName: fileItem.file.name,
            fileSize: fileItem.file.size,
            sourceLang: result.analysis?.language || 'en',
            targetLang: 'vi',
            processedAt: new Date().toISOString(),
            status: 'completed'
          }
          
          const existing = JSON.parse(localStorage.getItem('translationHistory') || '[]')
          localStorage.setItem('translationHistory', JSON.stringify([historyItem, ...existing].slice(0, 100)))
        }
        
      } catch (error: any) {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error', error: error.message } : f
        ))
      }
    }

    setIsProcessing(false)
    
    const completedFiles = files.filter(f => f.status === 'completed')
    if (completedFiles.length > 0 && onBatchComplete) {
      onBatchComplete(completedFiles)
    }
  }

  const getTranslatedFileName = (originalName: string) => {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
    return `translated_${nameWithoutExt}.txt`
  }

  const downloadSingleFile = (fileItem: FileItem) => {
    if (fileItem.status === 'completed' && fileItem.result?.result?.translated) {
      // Check if already downloaded
      if (downloadedFiles.has(fileItem.id)) {
        if (!confirm('This file was already downloaded. Download again?')) {
          return
        }
      }

      const content = `=== TRANSLATION RESULT ===\n\n` +
        `Original File: ${fileItem.file.name}\n` +
        `File Size: ${(fileItem.file.size / 1024).toFixed(1)} KB\n` +
        `Processed At: ${new Date().toLocaleString()}\n` +
        `\n${'='.repeat(50)}\n\n` +
        `ORIGINAL TEXT:\n${'='.repeat(50)}\n\n` +
        `${fileItem.result.result.original || 'No original text'}\n\n` +
        `${'='.repeat(50)}\n\n` +
        `TRANSLATED TEXT (Vietnamese):\n${'='.repeat(50)}\n\n` +
        `${fileItem.result.result.translated || 'No translation'}\n\n` +
        `${'='.repeat(50)}\n` +
        `END OF TRANSLATION`
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const fileName = getTranslatedFileName(fileItem.file.name)
      
      try {
        saveAs(blob, fileName)
        
        // Mark as downloaded
        setDownloadedFiles(prev => new Set(prev).add(fileItem.id))
        
        // Show tip for multiple downloads
        if (files.filter(f => f.status === 'completed').length > 1 && !showDownloadTip) {
          setShowDownloadTip(true)
          setTimeout(() => setShowDownloadTip(false), 5000)
        }
      } catch (error) {
        console.error('Download error:', error)
        alert('Download failed. Please try again.')
      }
    }
  }

  const downloadAllAsZip = async () => {
    setIsDownloading(true)
    const zip = new JSZip()
    
    const completedFiles = files.filter(f => f.status === 'completed' && f.result?.result?.translated)
    
    if (completedFiles.length === 0) {
      setIsDownloading(false)
      return
    }

    completedFiles.forEach((fileItem) => {
      const content = `=== TRANSLATION RESULT ===\n\n` +
        `Original File: ${fileItem.file.name}\n` +
        `File Size: ${(fileItem.file.size / 1024).toFixed(1)} KB\n` +
        `Processed At: ${new Date().toLocaleString()}\n` +
        `\n${'='.repeat(50)}\n\n` +
        `ORIGINAL TEXT:\n${'='.repeat(50)}\n\n` +
        `${fileItem.result.result.original || 'No original text'}\n\n` +
        `${'='.repeat(50)}\n\n` +
        `TRANSLATED TEXT (Vietnamese):\n${'='.repeat(50)}\n\n` +
        `${fileItem.result.result.translated || 'No translation'}\n\n` +
        `${'='.repeat(50)}\n` +
        `END OF TRANSLATION`
      
      const fileName = getTranslatedFileName(fileItem.file.name)
      zip.file(fileName, content)
    })
    
    // Add readme file
    const readme = `Prismy AI Translation Results\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `Total Files: ${completedFiles.length}\n\n` +
      `Files included:\n` +
      completedFiles.map(f => `- ${getTranslatedFileName(f.file.name)}`).join('\n') +
      `\n\nNote: All translations are saved as .txt files for compatibility.`
    
    zip.file('README.txt', readme)
    
    try {
      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, `prismy_translations_${new Date().toISOString().split('T')[0]}.zip`)
      
      // Mark all as downloaded
      completedFiles.forEach(f => {
        setDownloadedFiles(prev => new Set(prev).add(f.id))
      })
    } catch (error) {
      console.error('Error creating zip:', error)
      alert('Error creating ZIP file. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const resetDownloads = () => {
    setDownloadedFiles(new Set())
    setShowDownloadTip(false)
  }

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word')) return '📝'
    if (fileType.includes('text')) return '📃'
    return '📎'
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const completedCount = files.filter(f => f.status === 'completed').length
  const errorCount = files.filter(f => f.status === 'error').length

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Batch Translation</h3>
        
        {/* Download tip */}
        {showDownloadTip && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Multiple downloads blocked?</p>
              <p>Use the ZIP download option to get all files at once, or download files one by one with a few seconds between each.</p>
            </div>
          </div>
        )}
        
        <div className="mb-4 flex gap-2 flex-wrap">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Add Files</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFilesChange}
              accept=".pdf,.doc,.docx,.txt,.md"
              disabled={isProcessing}
            />
          </label>
          
          {files.length > 0 && !isProcessing && pendingCount > 0 && (
            <button
              onClick={processFiles}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Process {pendingCount} Files</span>
            </button>
          )}
          
          {completedCount > 0 && (
            <>
              <button
                onClick={downloadAllAsZip}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                title="Download all files as ZIP (Recommended for multiple files)"
              >
                <Archive className="w-4 h-4" />
                <span>{isDownloading ? 'Creating ZIP...' : `Download ZIP (${completedCount})`}</span>
              </button>
              
              {downloadedFiles.size > 0 && (
                <button
                  onClick={resetDownloads}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  title="Reset download status"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Downloads</span>
                </button>
              )}
            </>
          )}
          
          {files.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all files?')) {
                  setFiles([])
                  setDownloadedFiles(new Set())
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {files.map(fileItem => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl">{getFileTypeIcon(fileItem.file.type)}</span>
                  {getStatusIcon(fileItem.status)}
                  <div className="flex-1">
                    <p className="font-medium text-sm truncate max-w-xs">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(fileItem.file.size / 1024).toFixed(1)} KB
                      {fileItem.status === 'completed' && ' • Translated ✓'}
                      {downloadedFiles.has(fileItem.id) && ' • Downloaded ✓'}
                      {fileItem.status === 'error' && ` • Error: ${fileItem.error}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {fileItem.status === 'completed' && fileItem.result && (
                    <button
                      onClick={() => downloadSingleFile(fileItem)}
                      className={`p-2 rounded transition-colors ${
                        downloadedFiles.has(fileItem.id)
                          ? 'bg-green-100 hover:bg-green-200 text-green-700'
                          : 'hover:bg-gray-200'
                      }`}
                      title={downloadedFiles.has(fileItem.id) ? 'Re-download file' : 'Download translation'}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  
                  {(fileItem.status === 'pending' || fileItem.status === 'error') && !isProcessing && (
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {files.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No files added yet</p>
            <p className="text-sm mt-1">Click "Add Files" to start</p>
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Total: {files.length} files
              </span>
              <div className="flex gap-4">
                {pendingCount > 0 && (
                  <span className="text-yellow-600">
                    Pending: {pendingCount}
                  </span>
                )}
                {completedCount > 0 && (
                  <span className="text-green-600">
                    Completed: {completedCount}
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-red-600">
                    Failed: {errorCount}
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              <p>• ZIP download recommended for multiple files</p>
              <p>• Downloaded files marked with ✓</p>
              <p>• Click "Reset Downloads" to clear download history</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
