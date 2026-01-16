const { sendEmail } = require('./src/services/emailService');
require('dotenv').config();

console.log('Testing Email Service...');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_USER:', process.env.SMTP_USER ? '***' : 'Missing');

(async () => {
    try {
        const info = await sendEmail(
            'test@example.com',
            'Test Email',
            '<p>This is a test email from the school platform.</p>'
        );
        console.log('Email sent successfully:', info);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
})();
