'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface AsyncTranslationButtonProps {
 text: string
 targetLang: string
 tier: string
 disabled?: boolean
 onTranslationComplete: (translatedText: string) => void
}

export function AsyncTranslationButton({
 text,
 targetLang,
 tier,
 disabled,
 onTranslationComplete
}: AsyncTranslationButtonProps) {
 const [isLoading, setIsLoading] = useState(false)
 const [jobId, setJobId] = useState<string | null>(null)
 const [status, setStatus] = useState<string>('')
 const [isPolling, setIsPolling] = useState(false)

 useEffect(() => {
   if (!jobId || !isPolling) return

   let startTime = Date.now();
   
   const interval = setInterval(async () => {
     try {
       const response = await fetch(`/api/translation-status/${jobId}`)
       const data = await response.json()
       
       // Calculate elapsed time
       const elapsed = Math.floor((Date.now() - startTime) / 1000);
       const minutes = Math.floor(elapsed / 60);
       const seconds = elapsed % 60;
       const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
       
       // Update progress with time
       if (data.progress !== undefined) {
         setStatus(`Processing... ${data.progress}% (${timeStr})`)
       }
       
       if (data.status === 'completed' && data.result) {
         setIsPolling(false)
         setStatus(`Translation completed! (Total: ${timeStr})`)
         onTranslationComplete(data.result.translatedText)
         setIsLoading(false)
       } else if (data.status === 'failed') {
         setIsPolling(false)
         setStatus(`Failed: ${data.error || 'Unknown error'}`)
         setIsLoading(false)
       }
     } catch (error) {
       console.error('Polling error:', error)
     }
   }, 1000) // Poll every second

   return () => clearInterval(interval)
 }, [jobId, isPolling, onTranslationComplete])

 const handleTranslate = async () => {
   setIsLoading(true)
   setStatus('Queueing translation...')

   try {
     const response = await fetch('/api/translate-async', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         text,
         targetLang,
         tier,
       }),
     })

     const data = await response.json()

     if (response.ok) {
       setJobId(data.jobId)
       setStatus(`Job queued! ID: ${data.jobId}`)
       setIsPolling(true)
     } else {
       setStatus(`Error: ${data.error}`)
       setIsLoading(false)
     }
   } catch (error) {
     console.error('Translation error:', error)
     setStatus('Failed to queue translation')
     setIsLoading(false)
   }
 }

 return (
   <div className="space-y-2">
     <Button
       onClick={handleTranslate}
       disabled={disabled || isLoading}
       variant="outline"
       className="w-full"
     >
       {isLoading ? 'Processing...' : 'Translate (Async Queue)'}
     </Button>
     
     {status && (
       <div className="mt-2 space-y-1">
         <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>
         
         {/* Enhanced Progress bar */}
         {(status.includes('%') || status.includes('Processing')) && (
           <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
             <div 
               className={`h-full rounded-full transition-all duration-500 ease-out ${
                 status.includes('completed') 
                   ? 'bg-green-500' 
                   : status.includes('Failed') 
                   ? 'bg-red-500'
                   : 'bg-blue-500 animate-pulse'
               }`}
               style={{ 
                 width: `${parseInt(status.match(/\d+/)?.[0] || '0')}%`,
               }}
             >
               {/* Text inside progress bar */}
               <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                 {status.match(/\d+/)?.[0] || '0'}%
               </span>
             </div>
           </div>
         )}
         
         {/* Success message */}
         {status.includes('completed') && (
           <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
             </svg>
             <span className="text-sm font-medium">Translation completed successfully!</span>
           </div>
         )}
         
         {/* Error message */}
         {status.includes('Failed') && (
           <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
             <span className="text-sm font-medium">{status}</span>
           </div>
         )}
       </div>
     )}
   </div>
 )
}