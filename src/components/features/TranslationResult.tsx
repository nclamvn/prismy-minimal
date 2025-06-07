'use client'

import { useState } from 'react'
import { FileText, Download, Copy, Check, Globe } from 'lucide-react'

interface TranslationResultProps {
  result: any
}

export function TranslationResult({ result }: TranslationResultProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (result?.result?.translated) {
      await navigator.clipboard.writeText(result.result.translated)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (result?.result?.translated) {
      const content = `Original:\n${result.result.original}\n\nTranslated:\n${result.result.translated}`
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `translated_${result.result.metadata.fileName || 'document.txt'}`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (!result?.result) return null

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Globe className="w-6 h-6" />
        Translation Result
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Original Text */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Original Text
          </h3>
          <div className="prose prose-sm max-w-none max-h-96 overflow-auto">
            <p className="text-gray-700 whitespace-pre-wrap">
              {result.result.original}
            </p>
          </div>
        </div>

        {/* Translated Text */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Translated Text
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-blue-100 rounded transition-colors"
                title="Copy translation"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-blue-100 rounded transition-colors"
                title="Download translation"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </h3>
          <div className="prose prose-sm max-w-none max-h-96 overflow-auto">
            <p className="text-gray-700 whitespace-pre-wrap">
              {result.result.translated}
            </p>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        Processed: {new Date(result.result.metadata.processedAt).toLocaleString()}
      </div>

      {/* AI Decisions */}
      {result.decisions?.length > 0 && (
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-medium mb-2">AI Decision Log:</h4>
          <div className="space-y-1">
            {result.decisions.map((decision: any, i: number) => (
              <div key={i} className="text-sm text-purple-800">
                • {decision.description} 
                <span className="text-purple-600 ml-2">
                  (Confidence: {Math.round(decision.confidence * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
