const fs = require('fs');
const path = './src/lib/services/email/email.service.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  "private from = process.env.RESEND_FROM_EMAIL || 'PRISMY <hello@send.prismy.in>';",
  "private from = process.env.RESEND_FROM_EMAIL || 'PRISMY <onboarding@resend.dev>';"
);
fs.writeFileSync(path, content);
console.log('✅ Updated email to use onboarding@resend.dev');
