"use client";

import { useState } from 'react';

export default function ApiTestPage() {
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const createApiKey = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/create-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tier: 'free' }),
      });
      
      const data = await res.json();
      if (data.apiKey) {
        setApiKey(data.apiKey);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">🔐 API Key Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="your@email.com"
            />
          </div>
          
          <button
            onClick={createApiKey}
            disabled={loading || !email}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create API Key'}
          </button>
          
          {apiKey && (
            <div className="mt-6 p-4 bg-gray-100 rounded">
              <p className="text-sm font-medium">Your API Key:</p>
              <code className="block mt-2 p-2 bg-white rounded text-xs break-all">
                {apiKey}
              </code>
              
              <div className="mt-4 text-sm">
                <p className="font-medium">Test with cURL:</p>
                <pre className="mt-2 p-2 bg-black text-white rounded text-xs overflow-x-auto">
{`curl -X POST http://localhost:3000/api/translate-async \\
  -H "x-api-key: ${apiKey}" \\
  -F "file=@document.pdf" \\
  -F "targetLanguage=vi" \\
  -F "tier=basic"`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}