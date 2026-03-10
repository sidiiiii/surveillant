const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Detect if port uses SSL (465) or TLS (587)
const isSSLPort = (port) => parseInt(port) === 465;

// Create reusable transporter object (fallback with .env credentials)
const FALLBACK_PORT = parseInt(process.env.SMTP_PORT) || 587;

// FORCED FALLBACK due to Coolify Env Var bug
// If SMTP_PASS is somehow 'votre_mot_de_passe_application' (the example string stuck in Coolify), replace it with the real one
const realPass = process.env.SMTP_PASS === 'votre_mot_de_passe_application'
    ? 'czukaybhikwucpcr'
    : process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: FALLBACK_PORT,
    secure: isSSLPort(FALLBACK_PORT), // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER || 'ssurveilleur@gmail.com',
        pass: realPass,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const path = require('path');
const fs = require('fs');

// Logo path - check existence once at startup
const LOGO_PATH = path.resolve(__dirname, '../../../Surveillant.jpeg');
const logoExists = fs.existsSync(LOGO_PATH);
if (!logoExists) {
    console.warn('[EmailService] ⚠️ Logo file not found at:', LOGO_PATH, '- Emails will be sent without logo.');
}

/**
 * Send an email notification (Bilingual Arabic/French)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {object} content - { ar: string, fr: string } or string (if string, it will be used as both)
 * @param {object} [senderInfo] - Optional sender info { name, email, ...smtp }
 */
async function sendEmail(to, subject, content, senderInfo = {}) {
    if (!to) {
        console.warn('[EmailService] No recipient email provided. Skipping.');
        return;
    }

    let mailTransport = transporter;
    let smtpUserUsed = process.env.SMTP_USER || 'ssurveilleur@gmail.com';

    if (!smtpUserUsed || !realPass) {
        console.error('[EmailService] ❌ No SMTP credentials configured. Cannot send email to:', to);
        throw new Error('No SMTP credentials configured');
    }

    console.log(`[EmailService] Sending email to: ${to} | Subject: "${subject}" | SMTP: ${smtpUserUsed}`);

    const arPart = typeof content === 'string' ? content : content.ar;
    const frPart = typeof content === 'string' ? '' : content.fr;

    const htmlContent = `
        <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif; border-bottom: ${frPart ? '2px solid #eee' : 'none'}; padding-bottom: 20px; margin-bottom: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                ${logoExists ? '<img src="cid:logo" alt="Surveillant" style="width: 80px; height: 80px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />' : ''}
                <h2 style="color: #4f46e5; margin-top: 10px;">Surveillant - المراقب</h2>
            </div>
            <div style="font-size: 16px; color: #333;">
                ${arPart}
            </div>
            <p style="text-align: center; margin-top: 20px;">
                <a href="https://surveillant.it.com" style="color: #4f46e5; text-decoration: none; font-weight: bold;">surveillant.it.com</a>
            </p>
        </div>
        ${frPart ? `
        <div style="direction: ltr; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 16px; color: #333;">
                ${frPart}
            </div>
            <p style="text-align: center; margin-top: 20px;">
                <a href="https://surveillant.it.com" style="color: #4f46e5; text-decoration: none; font-weight: bold;">surveillant.it.com</a>
            </p>
            <br/>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px; text-align: center;">
                &copy; ${new Date().getFullYear()} Surveillant. Tous droits réservés.
            </p>
        </div>
        ` : `
        <div style="direction: ltr; text-align: center; font-family: Arial, sans-serif;">
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Surveillant. Tous droits réservés.
            </p>
        </div>
        `}
    `;

    try {
        const fromName = senderInfo.name || "Surveillant";
        const fromAddress = process.env.SMTP_USER;

        const mailOptions = {
            from: `"${fromName}" <${fromAddress}>`,
            to,
            subject,
            html: htmlContent,
        };

        // Only attach logo if the file exists
        if (logoExists) {
            mailOptions.attachments = [{
                filename: 'logo.jpeg',
                path: LOGO_PATH,
                cid: 'logo'
            }];
        }

        if (senderInfo.email) {
            mailOptions.replyTo = senderInfo.email;
        }

        const info = await mailTransport.sendMail(mailOptions);
        console.log(`[EmailService] ✅ Email sent successfully! MessageId: ${info.messageId} | To: ${to}`);
    } catch (error) {
        console.error(`[EmailService] ❌ Failed to send email to ${to}:`, error.message);
        console.error('[EmailService] SMTP details - Host:', process.env.SMTP_HOST, '| User:', smtpUserUsed);
        if (error.code === 'EAUTH') {
            console.error('[EmailService] 🔑 AUTHENTICATION ERROR: The App Password may be expired or revoked. Please generate a new Gmail App Password.');
        }
        throw error;
    }
}

module.exports = { sendEmail };
