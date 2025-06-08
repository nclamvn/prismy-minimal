'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AsyncTranslationButtonProps {
  text: string;
  targetLang: string;
  tier: string;
  onComplete: (result: any) => void;
}

export function AsyncTranslationButton({ 
  text, 
  targetLang, 
  tier, 
  onComplete 
}: AsyncTranslationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const startAsyncTranslation = async () => {
    setLoading(true);
    
    try {
      // Start translation job
      const response = await fetch('/api/translate-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang, tier })
      });
      
      const data = await response.json();
      if (data.jobId) {
        setJobId(data.jobId);
        pollJobStatus(data.jobId);
      }
    } catch (error) {
      console.error('Failed to start translation:', error);
      setLoading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/translation-status/${jobId}`);
        const status = await response.json();
        
        if (status.state === 'completed') {
          clearInterval(interval);
          setLoading(false);
          onComplete(status.result);
        } else if (status.state === 'failed') {
          clearInterval(interval);
          setLoading(false);
          console.error('Translation failed');
        } else if (status.state === 'active') {
          setProgress(50);
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, 1000);
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={startAsyncTranslation} 
        disabled={loading || !text}
        variant="outline"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Translate (Async Queue)'
        )}
      </Button>
      
      {loading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}