// Mock data generators and sample data for the Bulk Email Sender

export const SAMPLE_RECIPIENTS = [
  { first_name: 'Sarah', last_name: 'Chen', email: 'sarah.chen@company.com', department: 'Engineering', role: 'Senior Developer' },
  { first_name: 'Marcus', last_name: 'Rivera', email: 'marcus.r@company.com', department: 'Marketing', role: 'Campaign Manager' },
  { first_name: 'Aisha', last_name: 'Patel', email: 'aisha.patel@company.com', department: 'Design', role: 'UX Lead' },
  { first_name: 'James', last_name: 'O\'Brien', email: 'james.obrien@company.com', department: 'Sales', role: 'Account Executive' },
  { first_name: 'Yuki', last_name: 'Tanaka', email: 'yuki.t@company.com', department: 'Engineering', role: 'DevOps Engineer' },
  { first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@company.com', department: 'HR', role: 'People Ops' },
  { first_name: 'David', last_name: 'Kim', email: 'david.kim@company.com', department: 'Finance', role: 'Financial Analyst' },
  { first_name: 'Elena', last_name: 'Volkov', email: 'elena.v@company.com', department: 'Product', role: 'Product Manager' },
  { first_name: 'Omar', last_name: 'Hassan', email: 'omar.hassan@company.com', department: 'Engineering', role: 'Backend Developer' },
  { first_name: 'Lisa', last_name: 'Thompson', email: 'lisa.t@company.com', department: 'Legal', role: 'Compliance Officer' },
  { first_name: 'Carlos', last_name: 'Mendez', email: 'carlos.m@company.com', department: 'Support', role: 'Support Lead' },
  { first_name: 'Anna', last_name: 'Kowalski', email: 'anna.k@company.com', department: 'Marketing', role: 'Content Writer' },
  { first_name: 'Rajesh', last_name: 'Kumar', email: 'rajesh.kumar@company.com', department: 'Engineering', role: 'Tech Lead' },
  { first_name: 'Sophie', last_name: 'Dubois', email: 'sophie.d@company.com', department: 'Design', role: 'UI Designer' },
  { first_name: 'Michael', last_name: 'Brown', email: 'michael.brown@company.com', department: 'Sales', role: 'Sales Director' },
];

export const SAMPLE_TEMPLATE = {
  subject: 'Important Update: {{department}} Team Meeting — {{first_name}}',
  body: `Hi {{first_name}},

I hope this message finds you well. I'm reaching out to let you know about an upcoming team meeting for the {{department}} department.

As a {{role}}, your input will be especially valuable in our discussion about Q3 priorities and resource allocation.

Meeting Details:
• Date: Thursday, June 26, 2026
• Time: 2:00 PM — 3:30 PM IST
• Location: Conference Room B (Floor 3)
• Virtual Link: https://meet.google.com/abc-defg-hij

Please come prepared with:
1. Your team's progress update
2. Any blockers or concerns
3. Resource requests for next quarter

If you're unable to attend, please let me know and I'll share the meeting notes afterward.

Best regards,
Office Communications`,
};

export const PROVIDER_LIMITS = {
  personal: { label: 'Personal Gmail', limit: 500, note: 'Counts To/Cc/Bcc total' },
  workspace_standard: { label: 'Workspace Standard', limit: 1500, note: 'Rolling 24-hour reset' },
  workspace_enterprise: { label: 'Workspace Enterprise', limit: 2000, note: 'Verify in Admin console' },
};

export const PAST_CAMPAIGNS = [
  {
    id: 'cmp-001',
    name: 'Q2 All-Hands Meeting Invite',
    date: '2026-06-18',
    total: 487,
    sent: 482,
    bounced: 3,
    failed: 2,
    pending: 0,
    status: 'completed',
  },
  {
    id: 'cmp-002',
    name: 'IT Security Policy Update',
    date: '2026-06-15',
    total: 612,
    sent: 608,
    bounced: 1,
    failed: 3,
    pending: 0,
    status: 'completed',
  },
  {
    id: 'cmp-003',
    name: 'Office Holiday Schedule 2026',
    date: '2026-06-10',
    total: 523,
    sent: 520,
    bounced: 2,
    failed: 1,
    pending: 0,
    status: 'completed',
  },
];

// Generate a random send result
export function generateSendResult(email) {
  const rand = Math.random();
  if (rand < 0.92) return { status: 'sent', message: 'Delivered successfully' };
  if (rand < 0.96) return { status: 'bounced', message: 'Mailbox not found' };
  if (rand < 0.98) return { status: 'failed', message: 'SMTP 550: User unknown' };
  return { status: 'retry', message: 'Temporary error 421, retrying...' };
}

// Parse CSV text into array of objects
export function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length === headers.length && values.some(v => v)) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
      rows.push(row);
    }
  }

  return { headers, rows };
}

// Validate email format
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Merge template with row data
export function mergeTemplate(template, row) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return row[key] !== undefined ? row[key] : match;
  });
}

// Find unmatched merge tags
export function findUnmatchedTags(template, headers) {
  const tags = [...template.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
  return tags.filter(tag => !headers.includes(tag));
}

// Generate sample CSV content for download
export function generateSampleCSV() {
  const headers = 'first_name,last_name,email,department,role';
  const rows = SAMPLE_RECIPIENTS.map(r =>
    `${r.first_name},${r.last_name},${r.email},${r.department},${r.role}`
  );
  return [headers, ...rows].join('\n');
}

// Export campaign results as CSV
export function exportResultsCSV(results) {
  const headers = 'email,status,message,timestamp';
  const rows = results.map(r =>
    `${r.email},${r.status},"${r.message}",${r.timestamp}`
  );
  return [headers, ...rows].join('\n');
}

// Download string as file
export function downloadFile(content, filename, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
