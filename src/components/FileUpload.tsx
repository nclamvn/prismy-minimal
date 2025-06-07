'use client'

import { useState, useRef } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  loading?: boolean
}

export default function FileUpload({ onFileSelect, loading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0])
    }
  }

  return (
    <div
      className={`upload-area ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragActive ? 'var(--color-text-primary)' : 'var(--color-border)'}`,
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        background: dragActive ? 'var(--glass-bg)' : 'transparent',
        marginTop: '16px'
      }}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        accept=".txt,.pdf,.doc,.docx"
        style={{ display: 'none' }}
        disabled={loading}
      />
      
      <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📄</div>
      
      <p style={{ 
        fontSize: '16px', 
        color: 'var(--color-text-primary)',
        marginBottom: '8px'
      }}>
        Drop your document here or click to browse
      </p>
      
      <p style={{ 
        fontSize: '14px', 
        color: 'var(--color-text-tertiary)'
      }}>
        Supports TXT, PDF, DOC, DOCX (Max 10MB)
      </p>
    </div>
  )
}
