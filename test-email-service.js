import { emailService } from './src/lib/services/email/email.service.js';

async function testDirect() {
  console.log('Testing email service directly...');
  
  const result = await emailService.sendPaymentConfirmation('nclamvn@gmail.com', {
    planName: 'Direct Test',
    amount: 99000,
    reference: 'DIRECT-TEST-123',
    bankAccounts: [{
      bankName: 'Test Bank',
      accountNumber: '1234567890',
      accountName: 'TEST USER'
    }]
  });
  
  console.log('Result:', result);
}

testDirect();
EO
cat > test-email-service.js << 'EOF'
import { emailService } from './src/lib/services/email/email.service.js';

async function testDirect() {
  console.log('Testing email service directly...');
  
  const result = await emailService.sendPaymentConfirmation('nclamvn@gmail.com', {
    planName: 'Direct Test',
    amount: 99000,
    reference: 'DIRECT-TEST-123',
    bankAccounts: [{
      bankName: 'Test Bank',
      accountNumber: '1234567890',
      accountName: 'TEST USER'
    }]
  });
  
  console.log('Result:', result);
}

testDirect();
