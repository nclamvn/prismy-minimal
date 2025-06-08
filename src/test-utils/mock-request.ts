import { NextRequest } from 'next/server';

export function mockNextRequest(init: {
  method?: string;
  headers?: HeadersInit;
  body?: any;
  pathname?: string;
} = {}) {
  const headers = new Headers(init.headers || {});
  
  return {
    method: init.method || 'POST',
    headers,
    body: init.body || null,
    nextUrl: { 
      pathname: init.pathname || '/api/translate-async',
      href: `http://localhost:3000${init.pathname || '/api/translate-async'}`
    },
    formData: async () => init.body || new FormData(),
  } as unknown as NextRequest;
}