/**
 * Merges the template with row data
 */
export function mergeTemplate(templateStr, rowData) {
  if (!templateStr) return '';
  return templateStr.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return rowData[key] !== undefined ? rowData[key] : match;
  });
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://bulkmailer-wxyb.onrender.com';

/**
 * Wakes up the Render server (free tier goes to sleep after 15 min)
 * Shows a status update to the user while waiting
 */
export async function wakeUpServer(onStatus) {
  onStatus?.('Waking up server... (may take 30s on free tier)');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
    await fetch(`${API_BASE}/`, { signal: controller.signal });
    clearTimeout(timeout);
    onStatus?.('Server ready!');
  } catch (e) {
    onStatus?.('Server may be slow to respond, trying anyway...');
  }
}

/**
 * Sends an email using the Node.js backend
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body (plain text)
 * @returns {Promise<Object>} The API response or error
 */
export async function sendEmail({ to, subject, body }) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('You must be logged in to send emails.');
  }

  // 30 second timeout per email
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ to, subject, body }),
      signal: controller.signal
    });

    clearTimeout(timeout);
    const data = await response.json();

    if (!response.ok) {
      console.error('Backend Send Error:', data);
      throw new Error(data.error || data.message || 'Failed to send email');
    }

    return { success: true, messageId: data.messageId };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out — server may be waking up, retry');
    }
    console.error('sendEmail failed:', error);
    throw error;
  }
}
