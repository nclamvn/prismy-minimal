'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Languages, Loader2, Check, FileText, X } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { Header } from '@/components/layout/Header'
import { UseCases } from '@/components/features/UseCases'
import { cn } from '@/lib/utils'

// Animation variants
const fadeVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

// Translations
const translations = {
  en: {
    hero: "Hello! What can I translate for you today?",
    tagline: "The Swiss Army Knife for Documents",
    dropzone: "Drop your document here",
    fileTypes: "PDF, DOCX, or TXT • Max 10MB",
    uploading: "Uploading...",
    translating: "Translating your document",
    processing: "This may take a few moments...",
    complete: "Translation complete!",
    downloaded: "Your file has been downloaded",
    translateAnother: "Translate Another",
    translateTo: "Translate to",
    tierLabel: "Quality",
    academic: "Academic Papers",
    business: "Business Docs",
    technical: "Technical Manuals",
    legal: "Legal Contracts",
    signIn: "Sign in",
    getStarted: "Get Started",
    poweredBy: "Powered by Lâm",
    upgradePro: "Upgrade",
    basic: "Basic",
    standard: "Standard", 
    premium: "Premium",
    basicDesc: "Good • Fast",
    standardDesc: "Better • Balanced",
    premiumDesc: "Best • Slower",
    selectedFile: "Selected file",
    changeFile: "Change file",
    startTranslation: "Start Translation",
    selectLanguageFirst: "Please select a target language different from the source",
    sameLanguageError: "Source and target languages are the same. Please select a different target language."
  },
  vi: {
    hero: "Xin chào! Hôm nay bạn cần dịch gì?",
    tagline: "Công cụ vạn năng cho Tài liệu",
    dropzone: "Thả tài liệu vào đây",
    fileTypes: "PDF, DOCX, hoặc TXT • Tối đa 10MB",
    uploading: "Đang tải lên...",
    translating: "Đang dịch tài liệu",
    processing: "Quá trình này có thể mất vài phút...",
    complete: "Dịch hoàn tất!",
    downloaded: "File đã được tải xuống",
    translateAnother: "Dịch tài liệu khác",
    translateTo: "Dịch sang",
    tierLabel: "Cấp độ",
    academic: "Bài nghiên cứu",
    business: "Tài liệu kinh doanh",
    technical: "Sổ tay kỹ thuật",
    legal: "Hợp đồng pháp lý",
    signIn: "Đăng nhập",
    getStarted: "Bắt đầu",
    poweredBy: "Phát triển bởi Lâm",
    upgradePro: "Nâng cấp",
    basic: "Cơ bản",
    standard: "Tiêu chuẩn",
    premium: "Cao cấp",
    basicDesc: "Tốt • Nhanh",
    standardDesc: "Tốt hơn • Cân bằng",
    premiumDesc: "Tốt nhất • Chậm hơn",
    selectedFile: "File đã chọn",
    changeFile: "Đổi file",
    startTranslation: "Bắt đầu dịch",
    selectLanguageFirst: "Vui lòng chọn ngôn ngữ đích khác với ngôn ngữ nguồn",
    sameLanguageError: "Ngôn ngữ nguồn và đích giống nhau. Vui lòng chọn ngôn ngữ đích khác."
  }
}

// Language options
const LANGUAGES = [
  { code: 'vi', nameEn: 'Vietnamese', nameVi: 'Tiếng Việt' },
  { code: 'en', nameEn: 'English', nameVi: 'Tiếng Anh' },
  { code: 'zh', nameEn: 'Chinese', nameVi: 'Tiếng Trung' },
  { code: 'ja', nameEn: 'Japanese', nameVi: 'Tiếng Nhật' },
  { code: 'ko', nameEn: 'Korean', nameVi: 'Tiếng Hàn' },
  { code: 'fr', nameEn: 'French', nameVi: 'Tiếng Pháp' },
  { code: 'es', nameEn: 'Spanish', nameVi: 'Tiếng Tây Ban Nha' },
  { code: 'de', nameEn: 'German', nameVi: 'Tiếng Đức' },
]

export default function Home() {
  const [targetLang, setTargetLang] = useState('en') // Default to English
  const [selectedTier, setSelectedTier] = useState<'basic' | 'standard' | 'premium'>('standard')
  const [isDragging, setIsDragging] = useState(false)
  const [lang, setLang] = useState<'en' | 'vi'>('en')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detectedSourceLang, setDetectedSourceLang] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const t = translations[lang]

  // ✅ FIXED: Use clearState instead of reset
  const {
    status,
    progress,
    error,
    translateFile,
    clearState  // ✅ Changed from reset
  } = useTranslation()

  // Load saved preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as 'en' | 'vi'
      if (savedLang) setLang(savedLang)
    }
  }, [])

  // ✅ FIXED: No auto-flip to prevent race condition
  const detectSourceLanguage = useCallback((file: File) => {
    const filename = file.name.toLowerCase()
    
    console.log(`🔍 Detecting source language for: ${filename}`)
    
    // Simple detection based on filename patterns
    if (filename.includes('_vi') || filename.includes('vietnamese')) {
      setDetectedSourceLang('vi')
      console.log('📝 Detected source: Vietnamese')
      // ✅ NO AUTO-FLIP: Let user choose target manually
    } else if (filename.includes('_en') || filename.includes('english')) {
      setDetectedSourceLang('en')
      console.log('📝 Detected source: English')
      // ✅ NO AUTO-FLIP: Let user choose target manually
    } else {
      setDetectedSourceLang('auto')
      console.log('📝 Detected source: Auto-detect')
    }
  }, [])  // ✅ Remove targetLang dependency

  const handleFileSelect = useCallback((file: File) => {
    if (!file) return

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`File too large. Max size: 10MB`)
      return
    }

    console.log(`📁 File selected: ${file.name}`)
    
    // Store file but don't translate yet
    setSelectedFile(file)
    detectSourceLanguage(file)
    
    // Reset any previous translation state
    clearState()  // ✅ Use clearState instead of reset
  }, [detectSourceLanguage, clearState])

  // ✅ FIXED: Use snapshot to prevent race condition
  const handleStartTranslation = useCallback(async () => {
    if (!selectedFile) {
      console.error('❌ No file selected')
      return
    }

    // ✅ SNAPSHOT: Freeze values at click time to prevent race condition
    const targetLangSnapshot = targetLang        // Capture current target language
    const sourceLangSnapshot = detectedSourceLang || 'auto'
    const tierSnapshot = selectedTier

    // ✅ DEBUG: Log all snapshot values
    console.log('🚀 Starting translation with frozen snapshots:')
    console.table({
      '📁 File': selectedFile.name,
      '📏 Size (MB)': (selectedFile.size / 1024 / 1024).toFixed(2),
      '🗣️ Source Lang': sourceLangSnapshot,
      '🎯 Target Lang': targetLangSnapshot,  // ← KEY: Should be 'en' for English
      '⭐ Tier': tierSnapshot,
      '🕒 Timestamp': new Date().toLocaleTimeString()
    })

    // Check if source and target are the same
    if (sourceLangSnapshot && sourceLangSnapshot === targetLangSnapshot) {
      alert(t.sameLanguageError)
      return
    }

    // ✅ VALIDATION: Warn if suspicious values
    if (targetLangSnapshot === sourceLangSnapshot) {
      console.warn('⚠️ Warning: Source and target languages are the same!')
    }

    // ✅ Use snapshot values instead of current state
    await translateFile(selectedFile, sourceLangSnapshot, targetLangSnapshot, tierSnapshot)
  }, [selectedFile, targetLang, selectedTier, detectedSourceLang, t.sameLanguageError, translateFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'vi' : 'en'
    setLang(newLang)
    localStorage.setItem('lang', newLang)
  }

  const handleRemoveFile = useCallback(() => {
    console.log('🗑️ Removing file and clearing state')
    setSelectedFile(null)
    setDetectedSourceLang('')
    clearState()  // ✅ Use clearState instead of reset
  }, [clearState])

  const handleTargetLanguageChange = useCallback((newTarget: string) => {
    console.log(`🎯 Target language changed: ${targetLang} → ${newTarget}`)
    setTargetLang(newTarget)
  }, [targetLang])

  const tierOptions = [
    { value: 'basic', label: `${t.basic} - ${t.basicDesc}` },
    { value: 'standard', label: `${t.standard} - ${t.standardDesc}` },
    { value: 'premium', label: `${t.premium} - ${t.premiumDesc}` },
  ]

  // Processing animation
  const processingText = status === 'processing' ? (
    <span className="processing-text" data-label={t.translating}>
      {t.translating}
    </span>
  ) : null

  return (
    <div className="min-h-screen liquid-bg">
      {/* Animated gradient mesh background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="gradient-mesh">
          <div className="gradient-orb gradient-orb-1" />
          <div className="gradient-orb gradient-orb-2" />
        </div>
      </div>

      <Header 
        lang={lang}
        onToggleLang={toggleLang}
        translations={t}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <motion.div 
          variants={fadeVariants}
          initial="hidden"
          animate="show"
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold font-display">
            {t.hero}
          </h1>
        </motion.div>

        {/* Translation Widget - Liquid Glass Card */}
        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
        >
          <div className="liquid-card">
            {/* Show selected file info when file is selected but not processing */}
            {selectedFile && status === 'idle' && (
              <div className="selected-file-info">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="font-medium">{t.selectedFile}</p>
                    <p className="text-sm liquid-text-secondary">
                      {selectedFile.name} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* File Upload Area - Hide when file is selected */}
            {!selectedFile && (
              <div
                role="button"
                aria-busy={status !== 'idle'}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "liquid-upload-zone",
                  isDragging && "drag-active",
                  status !== 'idle' && "pointer-events-none opacity-50"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  className="hidden"
                />

                <AnimatePresence mode="wait">
                  {status === 'idle' ? (
                    <motion.div
                      key="idle"
                      variants={fadeVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="space-y-4"
                    >
                      <div className="liquid-icon-wrapper">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-lg font-medium">{t.dropzone}</p>
                        <p className="text-sm liquid-text-secondary mt-1">{t.fileTypes}</p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )}

            {/* Processing States */}
            {status !== 'idle' && (
              <div className="liquid-upload-zone pointer-events-none">
                <AnimatePresence mode="wait">
                  {status === 'uploading' ? (
                    <motion.div
                      key="uploading"
                      variants={fadeVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="space-y-4"
                    >
                      <Loader2 className="w-12 h-12 animate-spin mx-auto" />
                      <p className="text-lg font-medium">{t.uploading}</p>
                    </motion.div>
                  ) : status === 'processing' ? (
                    <motion.div
                      key="processing"
                      variants={fadeVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="space-y-4"
                    >
                      <div className="liquid-progress-ring">
                        <svg width="120" height="120" className="transform -rotate-90">
                          <circle
                            cx="60"
                            cy="60"
                            r="54"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="liquid-progress-bg"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="54"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={339.292}
                            strokeDashoffset={339.292 - (progress / 100) * 339.292}
                            className="liquid-progress-fill"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">{Math.round(progress)}%</span>
                        </div>
                      </div>
                      <div>
                        {processingText}
                        <p className="text-sm liquid-text-secondary mt-1">{t.processing}</p>
                      </div>
                    </motion.div>
                  ) : status === 'completed' ? (
                    <motion.div
                      key="completed"
                      variants={fadeVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="space-y-4"
                    >
                      <div className="liquid-icon-wrapper">
                        <Check className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-lg font-medium">{t.complete}</p>
                        <p className="text-sm liquid-text-secondary mt-1">{t.downloaded}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null)
                          clearState()  // ✅ Use clearState instead of reset
                        }}
                        className="liquid-button"
                      >
                        {t.translateAnother}
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )}

            {/* Language and Tier Selector Row */}
            <div className="liquid-controls">
              <div className="flex items-center gap-1.5">
                <Languages className="w-4 h-4 liquid-text-secondary" />
                <span className="text-sm liquid-text-secondary">{t.translateTo}</span>
                
                {/* Language Dropdown - Now immediately next to label */}
                <select
                  value={targetLang}
                  onChange={(e) => handleTargetLanguageChange(e.target.value)}  // ✅ Use callback
                  className="liquid-select ml-1"
                  disabled={status !== 'idle'}
                >
                  {LANGUAGES.map(language => (
                    <option key={language.code} value={language.code}>
                      {lang === 'en' ? language.nameEn : language.nameVi}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tier Dropdown */}
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as 'basic' | 'standard' | 'premium')}
                className="liquid-select"
                disabled={status !== 'idle'}
              >
                {tierOptions.map(tier => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Translation Button - Only show when file is selected */}
            {selectedFile && status === 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-center"
              >
                <button
                  onClick={handleStartTranslation}
                  className="liquid-button-primary"
                >
                  {t.startTranslation} → {LANGUAGES.find(l => l.code === targetLang)?.[lang === 'en' ? 'nameEn' : 'nameVi']}
                </button>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="liquid-error"
                role="alert"
              >
                {error}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Use Cases */}
        <UseCases translations={t} />
      </main>

      {/* Footer with smaller text */}
      <footer className="mt-20 py-8 text-center text-xs liquid-text-tertiary">
        <p className="mb-0.5 opacity-70">{t.tagline}</p>
        <p className="opacity-70">{t.poweredBy}</p>
      </footer>

      {/* Liquid Glass CSS */}
      <style jsx global>{`
        /* CSS Variables for Liquid Glass */
        :root {
          --glass-bg: hsla(0 0% 100% / .65);
          --glass-bg-hover: hsla(0 0% 100% / .75);
          --blur-lg: 16px;
          --blur-sm: 8px;
          --border-glass: 1px solid hsla(0 0% 100% / .18);
          
          /* Monochrome palette */
          --mono-100: #ffffff;
          --mono-200: #fafafa;
          --mono-300: #f5f5f5;
          --mono-400: #e5e5e5;
          --mono-500: #a3a3a3;
          --mono-600: #737373;
          --mono-700: #404040;
          --mono-800: #262626;
          --mono-900: #171717;
          --mono-950: #0a0a0a;
        }

        /* Base styles */
        .liquid-bg {
          background: var(--mono-100);
          color: var(--mono-900);
        }

        /* Gradient mesh animation */
        .gradient-mesh {
          position: absolute;
          inset: 0;
          opacity: 0.4;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          mix-blend-mode: multiply;
          filter: blur(60px);
          animation: float 20s infinite;
        }

        .gradient-orb-1 {
          top: -20%;
          right: -10%;
          width: 40%;
          height: 40%;
          background: var(--mono-300);
          animation-delay: 0s;
        }

        .gradient-orb-2 {
          bottom: -20%;
          left: -10%;
          width: 50%;
          height: 50%;
          background: var(--mono-400);
          animation-delay: 10s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        /* Liquid Glass Card */
        .liquid-card {
          background: var(--glass-bg);
          backdrop-filter: blur(var(--blur-lg));
          -webkit-backdrop-filter: blur(var(--blur-lg));
          border: var(--border-glass);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 
            0 0 0 1px hsla(0 0% 100% / .1) inset,
            0 2px 8px hsla(0 0% 0% / .04),
            0 12px 24px hsla(0 0% 0% / .08);
          transition: all 0.3s ease;
        }

        /* Selected file info */
        .selected-file-info {
          background: var(--glass-bg);
          backdrop-filter: blur(var(--blur-sm));
          border: var(--border-glass);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 20px;
        }

        /* Upload Zone */
        .liquid-upload-zone {
          position: relative;
          border: 2px solid var(--mono-400);
          border-radius: 20px;
          padding: 48px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .liquid-upload-zone:hover {
          border-color: var(--mono-500);
          background: var(--glass-bg-hover);
        }

        .liquid-upload-zone.drag-active {
          border-color: var(--mono-600);
          background: var(--glass-bg-hover);
          box-shadow: 0 0 0 4px hsla(0 0% 50% / .1) inset;
        }

        /* Icon wrapper */
        .liquid-icon-wrapper {
          width: 64px;
          height: 64px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--blur-sm));
          border: var(--border-glass);
          border-radius: 16px;
          box-shadow: 0 4px 12px hsla(0 0% 0% / .06);
        }

        /* Text hierarchy */
        .liquid-text-secondary {
          color: var(--mono-600);
        }

        .liquid-text-tertiary {
          color: var(--mono-500);
        }

        /* Controls row */
        .liquid-controls {
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        /* Select styles */
        .liquid-select {
          padding: 10px 16px;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--blur-sm));
          border: var(--border-glass);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 140px;
        }

        .liquid-select:hover:not(:disabled) {
          background: var(--glass-bg-hover);
          border-color: var(--mono-500);
        }

        .liquid-select:focus {
          outline: none;
          box-shadow: 0 0 0 3px hsla(0 0% 50% / .2);
        }

        .liquid-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Button styles */
        .liquid-button {
          padding: 12px 24px;
          background: var(--mono-900);
          color: var(--mono-100);
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .liquid-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px hsla(0 0% 0% / .2);
        }

        /* Primary button with gradient */
        .liquid-button-primary {
          padding: 14px 32px;
          background: linear-gradient(135deg, var(--mono-800), var(--mono-900));
          color: var(--mono-100);
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px hsla(0 0% 0% / .1);
        }

        .liquid-button-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px hsla(0 0% 0% / .2);
        }

        /* Progress ring */
        .liquid-progress-ring {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto;
        }

        .liquid-progress-bg {
          color: var(--mono-300);
        }

        .liquid-progress-fill {
          color: var(--mono-700);
          transition: stroke-dashoffset 0.3s ease;
        }

        /* Processing text animation */
        .processing-text {
          position: relative;
          display: inline-block;
          font-size: 18px;
          font-weight: 500;
          background: linear-gradient(
            90deg,
            var(--mono-900) 0%,
            var(--mono-500) 50%,
            var(--mono-900) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shine 2s linear infinite;
        }

        @keyframes shine {
          to {
            background-position: 200% center;
          }
        }

        /* Error message */
        .liquid-error {
          margin-top: 16px;
          padding: 12px 16px;
          background: hsla(0 0% 0% / .04);
          border: 1px solid var(--mono-400);
          border-radius: 12px;
          font-size: 14px;
        }

        /* Font imports */
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;600&family=Be+Vietnam+Pro:wght@400;500;600&display=swap');
        
        .font-display {
          font-family: "Inter Tight", -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif;
        }
        
        body {
          font-family: "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif;
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        @media (prefers-reduced-transparency: reduce) {
          .liquid-card,
          .liquid-upload-zone,
          .liquid-select {
            backdrop-filter: none;
            background: var(--mono-100);
          }
        }

        /* Focus visible */
        *:focus-visible {
          outline: 2px solid var(--mono-600);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}