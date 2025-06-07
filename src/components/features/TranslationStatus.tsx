'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface TranslationStatusProps {
  translationId?: string
  onComplete?: (result: any) => void
}

export function TranslationStatus({ translationId, onComplete }: TranslationStatusProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [decisions, setDecisions] = useState<any[]>([])

  useEffect(() => {
    if (!translationId) return

    setStatus('processing')
    
    // Simulate progress for MVP
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setStatus('complete')
          onComplete?.({ success: true })
          return 100
        }
        return prev + 10
      })
    }, 500)

    return () => clearInterval(interval)
  }, [translationId, onComplete])

  if (status === 'idle') return null

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Translation Progress</h3>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Processing</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          {status === 'processing' && (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>AI is translating your document...</span>
            </>
          )}
          {status === 'complete' && (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Translation complete!</span>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>An error occurred</span>
            </>
          )}
        </div>

        {/* AI Decisions */}
        {decisions.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm font-medium mb-2">AI Decisions:</p>
            <div className="space-y-1">
              {decisions.map((decision, i) => (
                <div key={i} className="text-sm text-gray-600">
                  • {decision.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
