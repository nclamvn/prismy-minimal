// Mock nanoid before any imports
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-123'
}));

// Mock tiktoken module
jest.mock('@dqbd/tiktoken', () => ({
  get_encoding: jest.fn(() => ({
    encode: jest.fn((text) => {
      // Simple mock: 1 token per 4 characters
      return Array(Math.ceil(text.length / 4)).fill(1);
    }),
    decode: jest.fn((tokens) => 'decoded text'),
    free: jest.fn(),
  })),
}));

// Mock p-limit
jest.mock('p-limit', () => {
  return jest.fn(() => {
    return (fn) => fn();
  });
});

// ---- Simple File / Blob polyfill for Jest ----
class MockBlob {
  constructor(parts = [], options = {}) {
    this.parts = parts;
    this.type = options.type || '';
    this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0);
  }

  async arrayBuffer() {
    const str = this.parts.join('');
    const buf = Buffer.from(str);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }

  async text() {
    return this.parts.join('');
  }
}

class MockFile extends MockBlob {
  constructor(parts, name, options = {}) {
    super(parts, options);
    this.name = name;
    this.lastModified = options.lastModified || Date.now();
  }
}

// Force override globals BEFORE any imports
global.Blob = MockBlob;
global.File = MockFile;

// Polyfills for Next.js
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Define Response globally for Node environment
if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
    
    async json() {
      return JSON.parse(this.body);
    }
    
    async text() {
      return String(this.body);
    }
  };
}

// Mock NextResponse with proper json() method
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    method: init?.method || 'GET',
    headers: new Headers(init?.headers || {}),
    formData: () => init?.body || new FormData(),
    nextUrl: { pathname: '/api/test' },
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => {
      // Return a proper Response-like object with json() method
      const response = {
        status: init?.status || 200,
        headers: new Headers(init?.headers || {}),
        ok: true,
        json: jest.fn().mockResolvedValue(data),
        text: jest.fn().mockResolvedValue(JSON.stringify(data)),
        _body: data, // For testing
      };
      return response;
    }),
    error: jest.fn().mockImplementation(() => ({
      status: 500,
      json: jest.fn().mockResolvedValue({ error: 'Internal Server Error' }),
      _body: { error: 'Internal Server Error' },
    })),
  },
}));

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-key'
process.env.NEXT_PUBLIC_SENTRY_DSN = 'test-dsn'
process.env.DISABLE_QUEUE = 'true' // Disable queue for tests

// Mock fetch globally
global.fetch = jest.fn()

// Mock FormData properly
class MockFormData {
  constructor() {
    this._data = new Map();
  }
  
  append(key, value) {
    this._data.set(key, value);
  }
  
  get(key) {
    return this._data.get(key);
  }
  
  has(key) {
    return this._data.has(key);
  }
  
  delete(key) {
    return this._data.delete(key);
  }
  
  *entries() {
    yield* this._data.entries();
  }
  
  *keys() {
    yield* this._data.keys();
  }
  
  *values() {
    yield* this._data.values();
  }
}

global.FormData = MockFormData;

// Mock Headers if needed
if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value);
        });
      }
    }
    
    get(key) {
      return this._headers.get(key.toLowerCase());
    }
    
    set(key, value) {
      this._headers.set(key.toLowerCase(), value);
    }
    
    has(key) {
      return this._headers.has(key.toLowerCase());
    }
  };
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep important logs
  error: jest.fn(console.error),
  warn: jest.fn(console.warn),
  // Silence info/debug logs
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Mock Sentry to prevent actual error reporting in tests
jest.mock('@sentry/nextjs', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
}));