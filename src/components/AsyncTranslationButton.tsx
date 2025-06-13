'use client'

interface AsyncTranslationButtonProps {
 text: string
 targetLang: string
 tier: string
 disabled?: boolean
 onTranslationComplete: (translatedText: any) => void
}

export function AsyncTranslationButton({ 
 text, 
 targetLang, 
 tier, 
 disabled, 
 onTranslationComplete 
}: AsyncTranslationButtonProps) {
 const handleClick = async () => {
   // Simple implementation - just call the callback
   // In real app, this would call the API
   onTranslationComplete(`Translated: ${text}`)
 }

 return (
   <button 
     onClick={handleClick}
     disabled={disabled}
     className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
   >
     Translate Async
   </button>
 )
}
