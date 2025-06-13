import { Resend } from 'resend';

const resend = new Resend('re_WbdAb7xG_3NcYmvMWPxnd9YMCb4ps1LpH');

async function test() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Email mặc định của Resend
      to: 'nclamvn@gmail.com',
      subject: 'Test from PRISMY',
      html: '<p>If you see this, Resend is working! 🎉</p>'
    });

    console.log('Result:', { data, error });
    
    if (error) {
      console.error('Error details:', error);
    } else {
      console.log('✅ Email sent with ID:', data.id);
      console.log('ID prefix:', data.id.substring(0, 10));
    }
  } catch (err) {
    console.error('Caught error:', err);
  }
}

test();
