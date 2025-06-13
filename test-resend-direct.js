import { Resend } from 'resend';

const resend = new Resend('re_WbdAb7xG_3NcYmvMWPxnd9YMCb4ps1LpH');

async function test() {
  console.log('Testing with different FROM emails...\n');
  
  const emails = [
    'hello@send.prismy.in',
    'info@send.prismy.in', 
    'support@send.prismy.in',
    'PRISMY <hello@send.prismy.in>',
    'onboarding@resend.dev' // This one worked before
  ];
  
  for (const from of emails) {
    console.log(`\nTesting: ${from}`);
    
    try {
      const { data, error } = await resend.emails.send({
        from,
        to: 'nclamvn@gmail.com',
        subject: `Test from: ${from}`,
        html: `<p>Testing email from: <strong>${from}</strong></p><p>Time: ${new Date().toISOString()}</p>`
      });
      
      if (error) {
        console.log('❌ Error:', error.message);
      } else {
        console.log('✅ Success! ID:', data.id);
        console.log('   Full response:', JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.log('❌ Exception:', err.message);
    }
    
    // Wait 1 second between attempts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

test();
