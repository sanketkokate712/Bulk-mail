/**
 * Merges the template with row data
 */
export function mergeTemplate(templateStr, rowData) {
  if (!templateStr) return '';
  return templateStr.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return rowData[key] !== undefined ? rowData[key] : match;
  });
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

  try {
    const apiBase = import.meta.env.VITE_API_URL || 'https://bulkmailer-wxyb.onrender.com';
    const response = await fetch(`${apiBase}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ to, subject, body })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend Send Error:', data);
      throw new Error(data.error || data.message || 'Failed to send email');
    }

    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('sendEmail failed:', error);
    throw error;
  }
}
