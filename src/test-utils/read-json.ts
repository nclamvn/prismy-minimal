// Helper to read JSON from any response type
export async function readJson(response: any) {
  // Debug log
  console.log('Response type:', response?.constructor?.name);
  console.log('Response properties:', Object.keys(response || {}));
  
  // Check if response has json() method
  if (response && typeof response.json === 'function') {
    return response.json();
  }
  
  // Check for _body property (from our mock)
  if (response && response._body !== undefined) {
    return response._body;
  }
  
  // Try text() method
  if (response && typeof response.text === 'function') {
    const text = await response.text();
    return JSON.parse(text);
  }
  
  // Last resort - direct parse
  if (response && response.body) {
    return JSON.parse(String(response.body));
  }
  
  throw new Error(`Cannot read JSON from response: ${JSON.stringify(response)}`);
}