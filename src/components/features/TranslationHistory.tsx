'use client'

import { useState, useEffect } from 'react'
import { Clock, Download, Eye, Trash2, RefreshCw } from 'lucide-react'

interface HistoryItem {
  id: string
  fileName: string
  fileSize: number
  sourceLang: string
  targetLang: string
  processedAt: string
  status: 'completed' | 'failed'
}

export function TranslationHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  const loadHistory = () => {
    const saved = localStorage.getItem('translationHistory')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setHistory(parsed)
      } catch (error) {
        console.error('Error loading history:', error)
      }
    }
  }

  useEffect(() => {
    loadHistory()
    
    // Listen for storage events (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'translationHistory') {
        loadHistory()
      }
    }
    
    // Poll for changes (same tab)
    const interval = setInterval(() => {
      loadHistory()
    }, 2000)
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const clearHistory = () => {
    if (confirm('Clear all translation history?')) {
      localStorage.removeItem('translationHistory')
      setHistory([])
    }
  }

  const refreshHistory = () => {
    loadHistory()
    setLastUpdate(Date.now())
  }

  if (history.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No translation history yet</p>
          <button
            onClick={refreshHistory}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Translation History</h3>
          <div className="flex gap-2">
            <button
              onClick={refreshHistory}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={clearHistory}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear History
            </button>
          </div>
        </div>
        
        <div className="divide-y max-h-96 overflow-y-auto">
          {history.map(item => (
            <div key={item.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{item.fileName}</p>
                  <p className="text-sm text-gray-500">
                    {(item.fileSize / 1024).toFixed(1)} KB • 
                    {' '}{item.sourceLang.toUpperCase()} → {item.targetLang.toUpperCase()} • 
                    {' '}{new Date(item.processedAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t text-center text-xs text-gray-500">
          Showing {history.length} recent translations
        </div>
      </div>
    </div>
  )
}
