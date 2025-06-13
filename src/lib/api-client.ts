export class ApiClient {
 private baseUrl: string;

 constructor(baseUrl: string) {
   this.baseUrl = baseUrl;
 }

 private getToken(): string | null {
   if (typeof window === 'undefined') return null;
   return localStorage.getItem('auth-token');
 }

 async request(endpoint: string, options: RequestInit = {}) {
   const url = `${this.baseUrl}${endpoint}`;
   
   // Create headers object with proper type
   const headerObj: Record<string, string> = {
     'Content-Type': 'application/json',
     ...(options.headers as Record<string, string> || {})
   };
   
   const token = this.getToken();
   if (token) {
     headerObj['Authorization'] = `Bearer ${token}`;
   }

   const response = await fetch(url, {
     ...options,
     headers: headerObj
   });

   if (!response.ok) {
     const error = await response.json().catch(() => ({ error: 'Unknown error' }));
     throw new Error(error.error || `HTTP ${response.status}`);
   }

   return response.json();
 }

 get(endpoint: string) {
   return this.request(endpoint);
 }

 post(endpoint: string, data: any) {
   return this.request(endpoint, {
     method: 'POST',
     body: JSON.stringify(data)
   });
 }

 put(endpoint: string, data: any) {
   return this.request(endpoint, {
     method: 'PUT',
     body: JSON.stringify(data)
   });
 }

 delete(endpoint: string) {
   return this.request(endpoint, {
     method: 'DELETE'
   });
 }
}

export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || '/api');
