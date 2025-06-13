'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Sparkles, Languages, Loader2 } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { GlassCard } from '@/components/ui/glass-card'
import { ProgressRing } from '@/components/ui/progress-ring'
import { TierSelector } from '@/components/features/TierSelector'
import { cn } from '@/lib/utils'

// Animation variants
const fadeVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

interface TranslationWidgetProps {
  translations: any
  lang: 'en' | 'vi'
}

export function TranslationWidget({ translations: t, lang }: TranslationWidgetProps) {
  const [targetLang, setTargetLang] = useState('vi')
  const [selectedTier, setSelectedTier] = useState<'basic' | 'standard' | 'premium'>('standard')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    status,
    progress,
    error,
    downloadUrl,
    translateFile,
    reset
  } = useTranslation()

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      alert(lang === 'en' ? 'File type not supported' : 'Loại file không được hỗ trợ')
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(lang === 'en' ? `File too large. Max size: 10MB` : `File quá lớn. Tối đa: 10MB`)
      return
    }

    await translateFile(file, targetLang, selectedTier)
  }, [translateFile, targetLang, selectedTier, lang])

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

  const languages = [
    { code: 'vi', name: lang === 'en' ? 'Vietnamese' : 'Tiếng Việt' },
    { code: 'en', name: lang === 'en' ? 'English' : 'Tiếng Anh' },
    { code: 'zh', name: lang === 'en' ? 'Chinese' : 'Tiếng Trung' },
    { code: 'ja', name: lang === 'en' ? 'Japanese' : 'Tiếng Nhật' },
    { code: 'ko', name: lang === 'en' ? 'Korean' : 'Tiếng Hàn' },
    { code: 'fr', name: lang === 'en' ? 'French' : 'Tiếng Pháp' },
    { code: 'es', name: lang === 'en' ? 'Spanish' : 'Tiếng Tây Ban Nha' },
    { code: 'de', name: lang === 'en' ? 'German' : 'Tiếng Đức' },
  ]

  return (
    <GlassCard className="p-8">
      {/* Tier Selector */}
      <div className="mb-6">
        <TierSelector
          value={selectedTier}
          onChange={setSelectedTier}
          disabled={status !== 'idle'}
        />
      </div>

      {/* File Upload Area */}
      <div
        role="button"
        aria-busy={status !== 'idle'}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ease-out",
          "border-border-secondary hover:shadow-md hover:-translate-y-0.5",
          isDragging ? "border-blue-500 bg-blue-500/10" : "",
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
          aria-label="File input"
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
              <div className="mx-auto w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center">
                <Upload className="w-8 h-8 text-text-secondary" />
              </div>
              <div>
                <p className="text-lg font-medium">{t.dropzone}</p>
                <p className="text-sm text-text-tertiary mt-1">{t.fileTypes}</p>
              </div>
            </motion.div>
          ) : status === 'uploading' ? (
            <motion.div
              key="uploading"
              variants={fadeVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="space-y-4"
            >
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
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
              <ProgressRing progress={progress} />
              <div>
                <p className="text-lg font-medium">{t.translating}</p>
                <p className="text-sm text-text-secondary mt-1">{t.processing}</p>
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
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-lg font-medium">{t.complete}</p>
                <p className="text-sm text-text-secondary mt-1">{t.downloaded}</p>
              </div>
              <div className="flex gap-4 justify-center mt-4">
                {downloadUrl && (
                  
                    href={downloadUrl}
                    download
                    className="px-6 py-2 bg-surface-secondary text-text-primary rounded-xl hover:bg-surface-hover transition-all"
                  >
                    Download Again
                  </a>
                )}
                <button
                  onClick={reset}
                  className="px-6 py-2 bg-btn-primary text-white rounded-xl hover:bg-btn-primary-hover transition-all hover:scale-105"
                >
                  {t.translateAnother}
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Language Selector */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Languages className="w-4 h-4" />
          <span>{t.translateTo}</span>
        </div>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="px-4 py-2 bg-surface-primary border border-border-primary rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={status !== 'idle'}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm"
          role="alert"
        >
          {error}
        </motion.div>
      )}
    </GlassCard>
  )
}
