const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
const auth = require('../middleware/auth');

// Use SendGrid HTTP API instead of SMTP
// Render's free tier blocks all outbound SMTP ports (465, 587)
// SendGrid's API sends over HTTPS (port 443) which always works
sgMail.setApiKey(process.env.SENDGRID_API_KEY || process.env.SMTP_PASS || '');

router.post('/', auth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASS;
    if (!apiKey) {
      return res.status(500).json({ error: 'SendGrid API Key not configured' });
    }

    const msg = {
      to,
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      subject,
      text: body,
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}`);
    res.json({ success: true, messageId: `sg-${Date.now()}` });
  } catch (err) {
    const errorMsg = err.response?.body?.errors?.[0]?.message || err.message || 'Failed to send email';
    console.error('Email send error:', errorMsg);
    res.status(500).json({ error: errorMsg });
  }
});

module.exports = router;
