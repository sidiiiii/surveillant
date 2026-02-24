const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Create reusable transporter object
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const path = require('path');
const fs = require('fs');

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
    let useCustomSMTP = false;

    if (senderInfo.smtp_user && senderInfo.smtp_pass) {
        useCustomSMTP = true;
        try {
            mailTransport = nodemailer.createTransport({
                host: senderInfo.smtp_host || 'smtp.gmail.com',
                port: senderInfo.smtp_port || 587,
                secure: false,
                auth: {
                    user: senderInfo.smtp_user,
                    pass: senderInfo.smtp_pass,
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        } catch (err) {
            console.error('[EmailService] Failed to create custom transport', err);
            useCustomSMTP = false;
        }
    }

    const arPart = typeof content === 'string' ? content : content.ar;
    const frPart = typeof content === 'string' ? '' : content.fr;

    const htmlContent = `
        <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif; border-bottom: ${frPart ? '2px solid #eee' : 'none'}; padding-bottom: 20px; margin-bottom: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="cid:logo" alt="Surveillant" style="width: 80px; height: 80px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
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
        const fromAddress = useCustomSMTP ? senderInfo.smtp_user : process.env.SMTP_USER;

        const mailOptions = {
            from: `"${fromName}" <${fromAddress}>`,
            to,
            subject,
            html: htmlContent,
            attachments: [{
                filename: 'logo.jpeg',
                path: path.resolve(__dirname, '../../../Surveillant.jpeg'),
                cid: 'logo' // same as in img src
            }]
        };

        if (senderInfo.email && !useCustomSMTP) {
            mailOptions.replyTo = senderInfo.email;
        }

        const info = await mailTransport.sendMail(mailOptions);
        console.log(`[EmailService] Sent: ${info.messageId}`);
    } catch (error) {
        console.error('[EmailService] Error:', error);
        throw error;
    }
}

module.exports = { sendEmail };
