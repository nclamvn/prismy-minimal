'use client'

import { useState, useRef, useEffect } from 'react'
import { TierSelector } from '@/components/features/TierSelector'

export default function Home() {
  const [input, setInput] = useState('')
  const [activeTag, setActiveTag] = useState('all')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [targetLang, setTargetLang] = useState('vi')
  const [interfaceLang, setInterfaceLang] = useState('en')
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const [copied, setCopied] = useState(false)
  const [detectedLang, setDetectedLang] = useState<string>('')
  const [wordCount, setWordCount] = useState(0)
  const [showRewriteModal, setShowRewriteModal] = useState(false)
  const [isRewrite, setIsRewrite] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'basic' | 'standard' | 'premium'>('standard')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const langDropdownRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Translations for UI
  const translations = {
    en: {
      signIn: 'Sign in',
      getStarted: 'Get Started',
      hello: 'Hello',
      whatCanI: 'What can I translate for you today?',
      sourceText: 'Source Text',
      placeholder: 'Paste your text or describe what you need translated...',
      translateTo: 'Translate to',
      translateNow: 'Translate Now',
      translating: 'Translating...',
      processing: 'Processing...',
      uploadDoc: 'Upload document',
      summary: 'Summary',
      translationResult: 'Translation Result',
      originalText: 'Original Text',
      translation: 'Translation',
      copy: 'Copy',
      copied: 'Copied!',
      download: 'Download',
      model: 'Model',
      document: 'Document',
      analyze: 'Analyze',
      contextual: 'Contextual',
      quick: 'Quick',
      allTasks: 'All Tasks',
      academic: 'Academic',
      business: 'Business',
      technical: 'Technical',
      legal: 'Legal',
      creative: 'Creative',
      tryThis: 'Try this',
      networkError: 'Network error. Please try again.',
      translationFailed: 'Translation failed',
      uploadFailed: 'File upload failed',
      failedToProcess: 'Failed to process file',
      swissArmyKnife: 'The Swiss Army Knife for Documents',
      poweredBy: 'Powered by Lâm',
      pressKey: 'Press',
      toTranslate: 'to translate',
      words: 'words',
      autoDetect: 'Auto-detect',
      rewriteTitle: 'Same Language Selected',
      rewriteMessage: 'Source and target languages are the same. Would you like to rewrite/improve the text instead?',
      rewrite: 'Rewrite',
      cancel: 'Cancel',
      pdfNotSupported: 'PDF support is coming soon! Currently we support DOCX and TXT files.'
    },
    vi: {
      signIn: 'Đăng nhập',
      getStarted: 'Bắt đầu',
      hello: 'Xin chào',
      whatCanI: 'Hôm nay bạn cần dịch gì?',
      sourceText: 'Văn bản gốc',
      placeholder: 'Dán văn bản hoặc mô tả nội dung cần dịch...',
      translateTo: 'Dịch sang',
      translateNow: 'Dịch ngay',
      translating: 'Đang dịch...',
      processing: 'Đang xử lý...',
      uploadDoc: 'Tải lên tài liệu',
      summary: 'Tóm tắt',
      translationResult: 'Kết quả dịch',
      originalText: 'Văn bản gốc',
      translation: 'Bản dịch',
      copy: 'Sao chép',
      copied: 'Đã sao chép!',
      download: 'Tải xuống',
      model: 'Mô hình',
      document: 'Tài liệu',
      analyze: 'Phân tích',
      contextual: 'Ngữ cảnh',
      quick: 'Nhanh',
      allTasks: 'Tất cả',
      academic: 'Học thuật',
      business: 'Kinh doanh',
      technical: 'Kỹ thuật',
      legal: 'Pháp lý',
      creative: 'Sáng tạo',
      tryThis: 'Thử ngay',
      networkError: 'Lỗi mạng. Vui lòng thử lại.',
      translationFailed: 'Dịch thất bại',
      uploadFailed: 'Tải lên thất bại',
      failedToProcess: 'Không thể xử lý tệp',
      swissArmyKnife: 'Công cụ vạn năng cho Tài liệu',
      poweredBy: 'Phát triển bởi Lâm',
      pressKey: 'Nhấn',
      toTranslate: 'để dịch',
      words: 'từ',
      autoDetect: 'Tự động nhận diện',
      rewriteTitle: 'Cùng ngôn ngữ',
      rewriteMessage: 'Ngôn ngữ nguồn và đích giống nhau. Bạn có muốn viết lại/cải thiện văn bản không?',
      rewrite: 'Viết lại',
      cancel: 'Hủy',
      pdfNotSupported: 'PDF sẽ được hỗ trợ sớm! Hiện tại chúng tôi hỗ trợ file DOCX và TXT.'
    }
  }

  const t = translations[interfaceLang as keyof typeof translations]

  const languages = [
    { code: 'vi', name: interfaceLang === 'vi' ? 'Tiếng Việt' : 'Vietnamese' },
    { code: 'en', name: interfaceLang === 'vi' ? 'Tiếng Anh' : 'English' },
    { code: 'zh', name: interfaceLang === 'vi' ? 'Tiếng Trung' : 'Chinese' },
    { code: 'ja', name: interfaceLang === 'vi' ? 'Tiếng Nhật' : 'Japanese' },
    { code: 'ko', name: interfaceLang === 'vi' ? 'Tiếng Hàn' : 'Korean' },
    { code: 'fr', name: interfaceLang === 'vi' ? 'Tiếng Pháp' : 'French' },
    { code: 'es', name: interfaceLang === 'vi' ? 'Tiếng Tây Ban Nha' : 'Spanish' },
    { code: 'de', name: interfaceLang === 'vi' ? 'Tiếng Đức' : 'German' },
  ]

  const sampleTasks = [
    { 
      id: 1, 
      text: interfaceLang === 'vi' 
        ? "Dịch bài nghiên cứu machine learning từ tiếng Anh sang tiếng Việt"
        : "Translate my machine learning research paper from English to Vietnamese", 
      author: "Alex Chen" 
    },
    { 
      id: 2, 
      text: interfaceLang === 'vi'
        ? "Chuyển đổi tài liệu API kỹ thuật giữ nguyên code snippets"
        : "Convert technical API documentation maintaining code snippets", 
      author: "Sarah Kim" 
    },
    { 
      id: 3, 
      text: interfaceLang === 'vi'
        ? "Dịch hợp đồng pháp lý giữ nguyên thuật ngữ chuyên môn"
        : "Translate legal contract preserving formal terminology", 
      author: "Michael Park" 
    },
    { 
      id: 4, 
      text: interfaceLang === 'vi'
        ? "Dịch nhanh email công việc cho đội ngũ quốc tế"
        : "Quick translation of business emails for international team", 
      author: "Lisa Wang" 
    },
  ]

  // Detect language and count words
  useEffect(() => {
    if (input.trim()) {
      const text = input.toLowerCase();
      
      const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(input);
      const vietnameseWords = /\b(của|và|là|có|được|cho|với|đã|sẽ|này|đó|một|các|những|tôi|bạn|anh|chị|em)\b/i.test(input);
      const hasChinese = /[\u4e00-\u9fa5]/.test(input);
      const hasKorean = /[\uac00-\ud7af]/.test(input);
      const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(input);
      const englishWords = /\b(the|is|are|was|were|been|have|has|had|do|does|did|will|would|could|should|may|might|must|shall|can|this|that|these|those|i|you|he|she|it|we|they|what|when|where|who|why|how)\b/i.test(input);
      
      if (hasVietnamese && vietnameseWords) {
        setDetectedLang('vi');
      } else if (hasChinese) {
        setDetectedLang('zh');
      } else if (hasKorean) {
        setDetectedLang('ko');
      } else if (hasJapanese) {
        setDetectedLang('ja');
      } else if (englishWords || (!hasVietnamese && !hasChinese && !hasKorean && !hasJapanese)) {
        setDetectedLang('en');
      } else {
        setDetectedLang('en');
      }
      
      const words = input.trim().split(/\s+/).filter(word => word.length > 0).length;
      setWordCount(words);
    } else {
      setDetectedLang('');
      setWordCount(0);
    }
  }, [input]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    localStorage.setItem('interfaceLang', interfaceLang)
  }, [interfaceLang])

  useEffect(() => {
    const savedLang = localStorage.getItem('interfaceLang')
    if (savedLang && (savedLang === 'en' || savedLang === 'vi')) {
      setInterfaceLang(savedLang)
    }
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const demoText = urlParams.get('text')
    if (demoText) {
      setInput(decodeURIComponent(demoText))
    }
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`
    }
  }, [input])

  const handleTranslate = async () => {
    if (!input.trim()) return
    
    if (detectedLang === targetLang) {
      setShowRewriteModal(true)
      return
    }
    
    setIsRewrite(false)
    performTranslation()
  }

  const performTranslation = async (rewrite: boolean = false) => {
    if (!input.trim()) return

    setLoading(true)
    setError('')
    setResult(null)
    setProgress(0)
    setIsRewrite(rewrite)

    const isLongText = input.length > 500
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90
        const increment = isLongText ? 1 : 2
        return Math.min(90, Math.round(prev + increment))
      })
    }, 200)

    try {
      const controller = new AbortController()
      const timeoutMs = input.length > 1500 ? 120000 : 60000
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: input,
          targetLang: targetLang,
          isRewrite: rewrite,
          tier: selectedTier
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setProgress(100)
        
        setTimeout(() => {
          setResult(data)
          setProgress(0)
          setLoading(false)
        }, 200)
      } else {
        console.error('Translation failed:', data)
        clearInterval(progressInterval)
        setError(data.error || t.translationFailed)
        setProgress(0)
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Translation error:', err)
      clearInterval(progressInterval)
      
      if (err.name === 'AbortError') {
        setError('Translation is taking too long. The text might be too complex. Try breaking it into smaller parts.')
      } else if (err.message.includes('504')) {
        setError('Server timeout. Please try with shorter text or break into paragraphs.')
      } else if (err.message.includes('Failed to fetch')) {
        setError('Network error. Please check your connection.')
      } else {
        setError(err.message || t.networkError || 'Translation failed')
      }
      
      setProgress(0)
      setLoading(false)
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.name.toLowerCase().endsWith('.pdf')) {
      setError(t.pdfNotSupported)
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError(
        interfaceLang === 'vi' 
          ? `Kích thước file vượt quá 10MB. File của bạn: ${(file.size / 1024 / 1024).toFixed(1)}MB`
          : `File size exceeds 10MB. Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB`
      )
      return
    }

    const fileInfo = {
      name: file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name,
      size: file.size < 1024 
        ? file.size + ' B'
        : file.size < 1024 * 1024 
        ? (file.size / 1024).toFixed(1) + ' KB'
        : (file.size / 1024 / 1024).toFixed(1) + ' MB'
    }
    
    showToast(
      `${interfaceLang === 'vi' ? '📄 Đang xử lý' : '📄 Processing'}: ${fileInfo.name} (${fileInfo.size})`
    )

    setLoading(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const uploadData = await uploadResponse.json()
      
      if (uploadData.success) {
        setInput(uploadData.text)
        
        const charCount = uploadData.textLength.toLocaleString()
        const pageEstimate = Math.ceil(uploadData.textLength / 3000)
        
        showToast(
          `✅ ${uploadData.fileName} (${uploadData.fileSizeFormatted})\n` +
          `${charCount} ${interfaceLang === 'vi' ? 'ký tự' : 'characters'} ` +
          `(~${pageEstimate} ${interfaceLang === 'vi' ? 'trang' : pageEstimate === 1 ? 'page' : 'pages'})`
        )
      } else {
        setInput('')
        
        let errorMessage = uploadData.error || t.uploadFailed
        if (uploadData.details) {
          errorMessage += '\n' + uploadData.details
        }
        if (uploadData.fileName) {
          errorMessage = `📄 ${uploadData.fileName}\n${errorMessage}`
        }
        
        setError(errorMessage)
        showToast(`❌ ${uploadData.error}`)
      }
    } catch (err) {
      setError(t.failedToProcess)
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownload = () => {
    if (!result) return
    
    const langName = languages.find(l => l.code === targetLang)?.name
    const content = `${result.translated}\n\n---\n${interfaceLang === 'vi' ? 'Dịch sang' : 'Translated to'}: ${langName}\n${interfaceLang === 'vi' ? 'Bởi' : 'By'} Prismy AI (${result.model})`
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `translation_${targetLang}_${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.translated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showToast = (message: string) => {
    const existingToasts = document.querySelectorAll('.toast')
    existingToasts.forEach(toast => toast.remove())
    
    const toast = document.createElement('div')
    toast.className = 'toast'
    
    const lines = message.split('\n')
    if (lines.length > 1) {
      toast.innerHTML = lines.map(line => `<div>${line}</div>`).join('')
    } else {
      toast.textContent = message
    }
    
    document.body.appendChild(toast)
    
    toast.offsetHeight
    
    setTimeout(() => toast.classList.add('show'), 10)
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 300)
    }, 4000)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fafaf9' }}>
      <style jsx global>{`
        :root {
          --color-bg: #fafaf9;
          --color-surface: #ffffff;
          --color-border: #e5e4e2;
          --color-border-light: #f0efed;
          --color-text-primary: #1a1918;
          --color-text-secondary: #57534e;
          --color-text-tertiary: #a8a29e;
          --glass-bg: rgba(255, 255, 255, 0.7);
          --glass-blur: blur(10px);
          --glass-border: rgba(229, 228, 226, 0.5);
          --color-button-primary: #292524;
          --color-button-hover: #1c1917;
          --color-button-secondary: #f5f5f4;
          --border-radius-standard: 14px;
        }

        body {
          background: var(--color-bg) !important;
          -webkit-tap-highlight-color: transparent;
        }

        * {
          box-sizing: border-box;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .slide-in {
          animation: slideIn 0.2s ease-out;
        }

        .toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          background: var(--color-text-primary);
          color: white;
          padding: 16px 24px;
          border-radius: var(--border-radius-standard);
          font-size: 14px;
          line-height: 1.5;
          z-index: 9999;
          transition: transform 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          max-width: 90vw;
          text-align: center;
          pointer-events: none;
        }

        .toast.show {
          transform: translateX(-50%) translateY(0);
        }

        .toast div {
          margin: 2px 0;
        }

        .toast div:first-child {
          font-weight: 600;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          background: var(--color-surface);
          border-radius: 20px;
          padding: 32px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease-out;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 12px;
        }

        .modal-message {
          font-size: 15px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .modal-button {
          padding: 10px 20px;
          border-radius: var(--border-radius-standard);
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-button-primary {
          background: var(--color-button-primary);
          color: white;
        }

        .modal-button-primary:hover {
          background: var(--color-button-hover);
          transform: translateY(-1px);
        }

        .modal-button-secondary {
          background: transparent;
          color: var(--color-text-secondary);
        }

        .modal-button-secondary:hover {
          background: var(--color-button-secondary);
        }

        .btn-loading {
          position: relative;
          color: transparent !important;
        }

        .btn-loading::after {
          content: "";
          position: absolute;
          width: 16px;
          height: 16px;
          top: 50%;
          left: 50%;
          margin-left: -8px;
          margin-top: -8px;
          border: 2px solid #ffffff;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spinner 0.6s linear infinite;
        }

        @keyframes spinner {
          to { transform: rotate(360deg); }
        }

        .input-field {
          resize: none !important;
          font-size: 15px !important;
          line-height: 1.6 !important;
        }

        .input-field::-webkit-resizer {
          display: none;
        }

        .language-select {
          appearance: none;
          background: transparent;
          border: 1px solid #e5e4e240;
          border-radius: var(--border-radius-standard);
          padding: 10px 36px 10px 12px;
          font-size: 14px;
          color: var(--color-text-secondary);
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23a8a29e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          transition: all 0.2s ease;
        }

        .language-select:hover {
          border-color: #e5e4e280;
          background-color: var(--color-button-secondary);
        }

        .language-select:focus {
          outline: none;
          border-color: #e5e4e280;
        }

        .translate-btn {
          background: var(--color-button-primary);
          border: none;
          color: white;
          font-weight: 600;
          padding: 10px 24px;
          border-radius: var(--border-radius-standard);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          position: relative;
          overflow: hidden;
          min-width: 140px;
          text-align: center;
        }

        .translate-btn:hover:not(:disabled) {
          background: var(--color-button-hover);
          transform: translateY(-1px);
        }

        .translate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .translate-btn.loading {
          background: var(--color-button-primary);
        }

        .lang-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--color-text-tertiary);
          margin: 0 12px;
        }

        .lang-info span {
          padding: 4px 8px;
          background: var(--color-button-secondary);
          border-radius: 8px;
        }

        .result-container {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 12px;
        }

        .result-container::-webkit-scrollbar {
          width: 6px;
        }

        .result-container::-webkit-scrollbar-track {
          background: var(--color-border-light);
          border-radius: 3px;
        }

        .result-container::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 3px;
        }

        .result-container::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-tertiary);
        }

        .nav-link {
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: var(--border-radius-standard);
          transition: all 0.2s ease;
          display: none;
        }

        .nav-link:hover {
          background: var(--color-button-secondary);
          color: var(--color-text-primary);
        }

        .lang-switcher {
          display: flex;
          gap: 0;
          background: var(--color-button-secondary);
          padding: 2px;
          border-radius: var(--border-radius-standard);
        }

        .lang-button {
          padding: 6px 12px;
          border: none;
          background: transparent;
          color: var(--color-text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border-radius: calc(var(--border-radius-standard) - 2px);
          transition: all 0.2s ease;
        }

        .lang-button.active {
          background: var(--color-surface);
          color: var(--color-text-primary);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .lang-button:hover:not(.active) {
          color: var(--color-text-primary);
        }

        .tag-button {
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-secondary);
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .tag-button:hover {
          background: var(--color-button-secondary);
          color: var(--color-text-primary);
        }

        .tag-button:active {
          background: var(--color-button-secondary);
        }

        .tag-button.active {
          background: var(--color-text-primary);
          color: white;
          border-color: var(--color-text-primary);
        }

        .pill-button {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
          padding: 12px 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          white-space: nowrap;
        }

        .pill-button:hover {
          background: var(--color-button-secondary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .error-message {
          padding: 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 16px;
          color: #dc2626;
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: fadeIn 0.3s ease-out;
        }

        .error-icon {
          flex-shrink: 0;
        }

        .section-header {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .upload-doc-button {
          background: var(--color-surface);
          border: 1px dashed var(--color-border);
          color: var(--color-text-secondary);
          padding: 12px 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          white-space: nowrap;
        }

        .upload-doc-button:hover {
          background: var(--color-button-secondary);
          border-color: var(--color-text-secondary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        @media (min-width: 769px) {
          .nav-link {
            display: inline-block;
          }
        }

        @media (max-width: 768px) {
          .header-content {
            padding: 12px 16px !important;
          }

          .header-logo {
            font-size: 20px !important;
          }

          .btn-mobile {
            padding: 6px 12px !important;
            font-size: 13px !important;
          }

          .greeting h2 {
            font-size: 28px !important;
          }

          .greeting p {
            font-size: 20px !important;
          }

          .function-pills {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .pill-button,
          .upload-doc-button {
            width: 100%;
            justify-content: center;
          }

          .cards-grid {
            grid-template-columns: 1fr !important;
          }

          .bottom-controls {
            justify-content: space-between !important;
            flex-wrap: wrap;
          }

          .translate-btn {
            padding: 8px 16px !important;
            font-size: 13px !important;
            min-width: 120px;
          }

          .lang-info {
            display: none;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .input-wrapper > div > div:first-child::-webkit-scrollbar {
          width: 4px;
        }

        .input-wrapper > div > div:first-child::-webkit-scrollbar-track {
          background: transparent;
        }

        .input-wrapper > div > div:first-child::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 2px;
        }

        .input-wrapper > div > div:first-child::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-tertiary);
        }
      `}</style>

      {/* Header */}
      <header style={{ background: 'var(--color-bg)' }}>
        <div className="container header-content" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '56px',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          {/* Logo - Using logo.png */}
          <a href="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            textDecoration: 'none'
          }}>
            <img 
              src="/logo.png" 
              alt="Prismy Logo" 
              style={{ 
                height: '32px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <span className="header-logo" style={{
              fontSize: '20px',
              fontWeight: '700',
              letterSpacing: '-0.03em',
              color: 'var(--color-text-primary)',
              lineHeight: '1'
            }}>
              Prismy
            </span>
          </a>

          {/* Right side controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Language Switcher */}
            <div className="lang-switcher">
              <button
                className={`lang-button ${interfaceLang === 'en' ? 'active' : ''}`}
                onClick={() => setInterfaceLang('en')}
              >
                EN
              </button>
              <button
                className={`lang-button ${interfaceLang === 'vi' ? 'active' : ''}`}
                onClick={() => setInterfaceLang('vi')}
              >
                VI
              </button>
            </div>

            <button className="btn btn-ghost btn-mobile" style={{ 
              padding: '8px 16px',
              borderRadius: 'var(--border-radius-standard)',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-button-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}>{t.signIn}</button>
            
            <button className="btn btn-primary btn-mobile" style={{ 
              padding: '8px 16px',
              borderRadius: 'var(--border-radius-standard)',
              border: 'none',
              background: 'var(--color-button-primary)',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-button-hover)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-button-primary)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}>{t.getStarted}</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: '720px', margin: '0 auto', padding: '40px 24px 60px', width: '100%' }}>
        {/* Greeting */}
        <div className="greeting" style={{ marginBottom: '36px' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--color-text-primary)',
            margin: '0',
            letterSpacing: '-0.02em',
            lineHeight: '1.2'
          }}>
            {t.hello}
          </h2>
          <p style={{
            fontSize: '24px',
            fontWeight: '500',
            color: 'var(--color-text-tertiary)',
            margin: 0,
            letterSpacing: '-0.01em',
            lineHeight: '1.3',
            marginTop: '6px'
          }}>
            {t.whatCanI}
          </p>
        </div>
        
        {/* Input Section with Header */}
        <div style={{ marginBottom: '32px' }}>
          <div className="section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
              <path d="M2 17L12 22L22 17"/>
              <path d="M2 12L12 17L22 12"/>
            </svg>
            {t.sourceText}
          </div>
          
          <div className="input-wrapper">
            <div style={{ 
              position: 'relative',
              background: 'var(--color-surface)',
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Input Area - NO SCROLLBAR */}
              <div style={{
                padding: '20px 20px 10px 20px',
                maxHeight: '200px',
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                <textarea
                  ref={textareaRef}
                  className="input-field"
                  placeholder={t.placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleTranslate()
                  }}
                  style={{ 
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    background: 'transparent',
                    minHeight: '80px',
                    resize: 'none'
                  }}
                />
              </div>
              
              {/* Hidden File Input - FIXED */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".txt,.doc,.docx"
                style={{ 
                  display: 'none',
                  position: 'absolute',
                  left: '-9999px',
                  visibility: 'hidden'
                }}
                aria-hidden="true"
              />
              
              {/* Bottom Controls - Separate Container */}
              <div style={{
                padding: '12px 20px 16px 20px',
                borderTop: '1px solid var(--color-border-light)',
                background: 'var(--color-surface)',
                borderRadius: '0 0 24px 24px',
                position: 'relative'
              }}>
                <div className="bottom-controls" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  {/* Left side - Upload and Language */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                    {/* Upload Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      title={t.uploadDoc}
                      aria-label={t.uploadDoc}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--border-radius-standard)',
                        border: '1px solid #e5e4e240',
                        background: 'var(--color-surface)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        color: loading ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
                        opacity: loading ? 0.5 : 1,
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = 'var(--color-button-secondary)'
                          e.currentTarget.style.borderColor = '#e5e4e280'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--color-surface)'
                        e.currentTarget.style.borderColor = '#e5e4e240'
                      }}
                    >
                      {loading ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin">
                          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25"/>
                          <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                      )}
                    </button>

                    {/* Language Info */}
                    {input.trim() && (
                      <div className="lang-info" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'var(--color-text-tertiary)',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          background: 'var(--color-button-secondary)',
                          borderRadius: '8px',
                          whiteSpace: 'nowrap'
                        }}>{detectedLang ? t.autoDetect + ': ' + languages.find(l => l.code === detectedLang)?.name : '...'}</span>
                        <span style={{
                          padding: '4px 8px',
                          background: 'var(--color-button-secondary)',
                          borderRadius: '8px',
                          whiteSpace: 'nowrap'
                        }}>{wordCount} {t.words}</span>
                      </div>
                    )}

                    {/* Language Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="language-select"
                        style={{ minWidth: '140px' }}
                      >
                        {languages.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right side - Translate Button FIXED */}
                  <button 
                    className={`translate-btn ${loading ? 'loading' : ''}`}
                    onClick={handleTranslate}
                    disabled={loading || !input.trim()}
                  >
                    <span>{loading ? `${t.translating} ${progress}%` : t.translateNow}</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Keyboard shortcut hint */}
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              textAlign: 'center'
            }}>
              {t.pressKey} <kbd style={{
                padding: '2px 6px',
                background: 'var(--color-button-secondary)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}>⌘</kbd> + <kbd style={{
                padding: '2px 6px',
                background: 'var(--color-button-secondary)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}>Enter</kbd> {t.toTranslate}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <svg className="error-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
          </div>
        )}

        {/* Translation Result */}
        {result && (
          <div className="fade-in" style={{ marginTop: '32px' }}>
            <div className="section-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              {t.translationResult}
            </div>
            
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <div>
                <h3 style={{ 
                  fontSize: '14px', 
                  color: 'var(--color-text-tertiary)', 
                  marginBottom: '8px',
                  textAlign: 'left'
                }}>
                  {languages.find(l => l.code === targetLang)?.name} {t.translation}
                </h3>
                <div className="result-container">
                  <p style={{ 
                    fontSize: '15px', 
                    lineHeight: '1.6', 
                    color: 'var(--color-text-primary)', 
                    whiteSpace: 'pre-wrap',
                    textAlign: 'left',
                    margin: 0
                  }}>
                    {result.translated}
                  </p>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid var(--color-border)',
                gap: '12px'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  {t.model}: {result.model}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-ghost slide-in"
                    onClick={handleCopy}
                    style={{ 
                      fontSize: '14px', 
                      padding: '8px 16px', 
                      height: '36px',
                      borderRadius: 'var(--border-radius-standard)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-button-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {copied ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {t.copied}
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        {t.copy}
                      </>
                    )}
                  </button>
                  <button 
                    className="btn btn-ghost slide-in"
                    onClick={handleDownload}
                    style={{ 
                      fontSize: '14px', 
                      padding: '8px 16px', 
                      height: '36px',
                      borderRadius: 'var(--border-radius-standard)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      animationDelay: '0.1s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-button-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    {t.download}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Function Pills - FIXED LAYOUT */}
        {!result && (
          <>
            <div className="function-pills" style={{ 
              marginTop: '32px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button className="pill-button" onClick={() => setInput(interfaceLang === 'vi' ? 'Tóm tắt văn bản này' : 'Summarize this text')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 11H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h5m0-11v11m0-11l3-3m-3 3l-3-3"/>
                  <path d="M15 11h5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-5m0-11v11m0-11l3-3m-3 3l3-3"/>
                </svg>
                {t.summary}
              </button>
              <button className="pill-button" onClick={() => setInput(interfaceLang === 'vi' ? 'Phân tích và dịch văn bản này' : 'Analyze and translate this text')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                {t.analyze}
              </button>
              <button className="pill-button" onClick={() => setInput(interfaceLang === 'vi' ? 'Dịch với ngữ cảnh đầy đủ' : 'Translate with context preservation')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                {t.contextual}
              </button>
              <button className="pill-button" onClick={() => setInput(interfaceLang === 'vi' ? 'Cần dịch nhanh' : 'Quick translation needed')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {t.quick}
              </button>
            </div>

            {/* Tags */}
            <div className="tags" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
              marginTop: '24px',
              marginBottom: '48px'
            }}>
              {['all', 'academic', 'business', 'technical', 'legal', 'creative'].map(tag => (
                <button 
                  key={tag}
                  className={`tag-button ${activeTag === tag ? 'active' : ''}`}
                  onClick={() => setActiveTag(tag)}
                >
                  {t[tag as keyof typeof t] || tag.charAt(0).toUpperCase() + tag.slice(1)} {tag === 'all' && (interfaceLang === 'vi' ? '' : 'Tasks')}
                </button>
              ))}
            </div>

            {/* Cards */}
            <div className="cards-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              {sampleTasks.map(task => (
                <article key={task.id} className="card" onClick={() => setInput(task.text)} style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '20px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}>
                  <div className="card-content">
                    <p className="card-text" style={{ 
                      color: 'var(--color-text-primary)',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      marginBottom: '16px'
                    }}>{task.text}</p>
                  </div>
                  <footer className="card-footer" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <span className="card-meta" style={{ 
                      color: 'var(--color-text-tertiary)',
                      fontSize: '13px'
                    }}>{task.author}</span>
                    <a href="#" className="card-action" onClick={(e) => e.preventDefault()} style={{ 
                      color: 'var(--color-text-secondary)',
                      fontSize: '13px',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}>{t.tryThis} →</a>
                  </footer>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer - FIXED */}
      <footer style={{
        textAlign: 'center',
        padding: '40px 0',
        background: 'var(--color-bg)'
      }}>
        <p style={{
          fontSize: '13px',
          color: 'var(--color-text-tertiary)',
          opacity: 0.7,
          margin: '0 0 2px 0',
          letterSpacing: '0.02em'
        }}>
          {t.swissArmyKnife}
        </p>
        <p style={{
          fontSize: '12px',
          color: 'var(--color-text-tertiary)',
          opacity: 0.6,
          margin: 0,
          letterSpacing: '0.01em'
        }}>
          {t.poweredBy}
        </p>
      </footer>

      {/* Rewrite Modal */}
      {showRewriteModal && (
        <div 
          className="modal-overlay" 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRewriteModal(false)
          }}
        >
          <div className="modal-content">
            <h3 className="modal-title">{t.rewriteTitle}</h3>
            <p className="modal-message">{t.rewriteMessage}</p>
            <div className="modal-buttons">
              <button 
                className="modal-button modal-button-secondary"
                onClick={() => setShowRewriteModal(false)}
              >
                {t.cancel}
              </button>
              <button 
                className="modal-button modal-button-primary"
                onClick={() => {
                  setShowRewriteModal(false)
                  performTranslation(true)
                }}
              >
                {t.rewrite}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}