const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');

// Setup Nodemailer transporter
// You will configure these variables in server/.env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SMTP_PASS || ''
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    // Ensure they have configured their SMTP pass
    if (!process.env.SMTP_PASS) {
      return res.status(500).json({ error: 'SMTP Password not configured in backend .env' });
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@yourdomain.com', // Sender address
      to, // List of receivers
      subject, // Subject line
      text: body, // Plain text body
      // html: body // (Optional) html body
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
});

module.exports = router;
