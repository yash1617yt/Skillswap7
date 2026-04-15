const nodemailer = require('nodemailer');

const FIXED_SENDER_EMAIL = 'skillswap797@gmail.com';
const SMTP_USER = process.env.EMAIL_USER || process.env.SMTP_USER || FIXED_SENDER_EMAIL;
const SMTP_PASS = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service provider
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: FIXED_SENDER_EMAIL,
        envelope: {
            from: FIXED_SENDER_EMAIL,
            to,
        },
        to,
        subject,
        text,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendEmail,
};