const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const dns = require('dns');
const auth = require('../middleware/auth');

// Force IPv4 DNS resolution globally for this process
dns.setDefaultResultOrder('ipv4first');

// Resolve Gmail SMTP host to IPv4 address at startup
// This is critical for Render free tier which has no IPv6 outbound
async function createTransporter() {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  
  // Manually resolve to IPv4
  let resolvedHost = smtpHost;
  try {
    const addresses = await dns.promises.resolve4(smtpHost);
    if (addresses && addresses.length > 0) {
      resolvedHost = addresses[0];
      console.log(`✅ Resolved ${smtpHost} to IPv4: ${resolvedHost}`);
    }
  } catch (e) {
    console.warn('DNS resolve4 failed, using hostname:', e.message);
  }

  return nodemailer.createTransport({
    host: resolvedHost,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    tls: {
      // Required when using IP address instead of hostname
      servername: smtpHost
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

// Initialize transporter
let transporter = null;
createTransporter().then(t => {
  transporter = t;
  console.log('✅ Email transporter ready');
}).catch(err => {
  console.error('❌ Failed to create email transporter:', err.message);
});

router.post('/', auth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!process.env.SMTP_PASS) {
      return res.status(500).json({ error: 'SMTP Password not configured in backend .env' });
    }

    if (!transporter) {
      // Retry creating transporter if it failed at startup
      transporter = await createTransporter();
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: body,
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('Email send error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to send email' });
  }
});

module.exports = router;
