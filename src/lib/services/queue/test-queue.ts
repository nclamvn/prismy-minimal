async function testQueue() {
  console.log('Testing queue system...');
  
  try {
    const response = await fetch('http://localhost:3000/api/translate-async', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello world',
        targetLang: 'vi',
        tier: 'basic'
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.jobId) {
      console.log('Job queued successfully. Worker should process it automatically.');
      
      let attempts = 0;
      const checkStatus = async () => {
        attempts++;
        try {
          const status = await fetch(`http://localhost:3000/api/translation-status/${data.jobId}`);
          const result = await status.json();
          console.log(`Attempt ${attempts} - Job status:`, result);
          
          if (result.state === 'completed' || result.state === 'failed' || attempts >= 5) {
            process.exit(0);
          } else {
            setTimeout(checkStatus, 2000);
          }
        } catch (err) {
          console.error('Status check error:', err);
          process.exit(1);
        }
      };
      
      setTimeout(checkStatus, 1000);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testQueue();