import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('🔄 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
    });
    
    // ✅ ADD DETAILED ERROR LOGGING:
    console.error('❌ DETAILED ERROR DATA:', JSON.stringify(error.response?.data, null, 2));
    
    return Promise.reject(error);
  }
);

export const translationAPI = {
  uploadFile: async (file: File, targetLang: string, tier: string = 'standard') => {
    // ✅ ENHANCED FILE DEBUGGING FOR PDF ISSUE:
    console.log('📁 DETAILED FILE INFO:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      extension: file.name.split('.').pop()?.toLowerCase(),
      nameEndsWithPdf: file.name.toLowerCase().endsWith('.pdf'),
      nameEndsWithTxt: file.name.toLowerCase().endsWith('.txt'),
      nameEndsWithDoc: file.name.toLowerCase().endsWith('.doc'),
      nameEndsWithDocx: file.name.toLowerCase().endsWith('.docx'),
      mimeType: file.type,
      isPdfMimeType: file.type === 'application/pdf',
      isTxtMimeType: file.type === 'text/plain',
      isDocMimeType: file.type === 'application/msword',
      isDocxMimeType: file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      lastModified: new Date(file.lastModified).toISOString(),
      webkitRelativePath: (file as any).webkitRelativePath || 'N/A',
    });
    
    // ✅ VALIDATE FILE BEFORE SENDING (UPDATED WITH WORD SUPPORT):
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'txt', 'doc', 'docx'];
    const allowedMimeTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      const errorMsg = `❌ Unsupported file type: .${fileExtension}. Supported formats: PDF, TXT, DOC, DOCX`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // ✅ FILE TYPE SPECIFIC CHECKS:
    if (fileExtension === 'pdf') {
      if (file.type !== 'application/pdf' && file.type !== '') {
        console.warn('⚠️ PDF file has unexpected MIME type:', file.type);
      }
    } else if (fileExtension === 'doc') {
      if (file.type !== 'application/msword' && file.type !== '') {
        console.warn('⚠️ DOC file has unexpected MIME type:', file.type);
      }
    } else if (fileExtension === 'docx') {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && file.type !== '') {
        console.warn('⚠️ DOCX file has unexpected MIME type:', file.type);
      }
    } else if (fileExtension === 'txt') {
      if (file.type !== 'text/plain' && file.type !== '') {
        console.warn('⚠️ TXT file has unexpected MIME type:', file.type);
      }
    }
    
    // ✅ GENERAL FILE CHECKS:
    if (file.size === 0) {
      throw new Error('❌ File is empty (0 bytes)');
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB
      throw new Error('❌ File is too large (max 100MB)');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_lang', 'en');
    formData.append('target_lang', targetLang);
    formData.append('tier', tier);
    
    // ✅ LOG FORMDATA CONTENTS:
    console.log('📦 FormData contents:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}:`, {
          name: value.name,
          type: value.type,
          size: value.size,
          constructor: value.constructor.name
        });
      } else {
        console.log(`  ${key}:`, value);
      }
    }
    
    console.log('📤 Uploading file with final params:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: file.type,
      sourceLang: 'en',
      targetLang: targetLang,
      tier: tier,
      endpoint: '/api/v1/large/translate',
      contentType: 'multipart/form-data'
    });
    
    const response = await api.post('/api/v1/large/translate', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 second timeout
    });
    
    console.log('✅ Upload successful:', response.data);
    return response.data;
  },

  getJobStatus: async (jobId: string) => {
    console.log('📊 Checking job status:', jobId);
    const response = await api.get(`/api/v1/large/status/${jobId}`);
    
    console.log('📈 Job status:', {
      jobId,
      status: response.data.status,
      progress: response.data.progress,
    });
    
    return response.data;
  },

  downloadResult: async (jobId: string) => {
    console.log('📥 Downloading result for job:', jobId);
    const response = await api.get(`/api/v1/large/download/${jobId}`, {
      responseType: 'blob',
      timeout: 30000, // 30 second timeout for downloads
    });
    
    console.log('✅ Download successful:', {
      jobId,
      size: `${(response.data.size / 1024 / 1024).toFixed(2)} MB`,
      type: response.data.type,
    });
    
    return response.data;
  },

  // Add health check method
  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      console.log('🏥 Health check:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  },

  // Add API status check
  checkApiStatus: async () => {
    try {
      const response = await api.get('/api/status');
      console.log('📡 API status:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API status check failed:', error);
      throw error;
    }
  },
};