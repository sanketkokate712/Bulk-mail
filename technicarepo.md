Bulk Email Sender — Technical Requirements Internal Use
Page 1 of 7
Technical Requirements & Methodology
Internal Bulk Email Sender Web Application
Personalized Mail Merge from Excel / Google Sheets via Gmail
Prepared for: Internal Office Communication Tool
Scope: 500–1000 personalized recipients per send
Date: June 2026
Bulk Email Sender — Technical Requirements Internal Use
Page 2 of 7
Table of Contents
Table of Contents....................................................................................................................... 2
1. Project Overview .................................................................................................................... 3
1.1 Goals ................................................................................................................................ 3
1.2 Non-Goals ........................................................................................................................ 3
2. Functional Requirements ....................................................................................................... 3
2.1 Recipient Data Ingestion................................................................................................... 3
2.2 Template Authoring .......................................................................................................... 3
2.3 Sending Engine ................................................................................................................ 4
2.4 Authentication & Sending Identity ..................................................................................... 4
2.5 Reporting .......................................................................................................................... 4
3. Non-Functional Requirements ................................................................................................ 4
4. Email Provider Constraints ..................................................................................................... 5
5. System Architecture & Methodology ...................................................................................... 5
5.1 High-Level Components ................................................................................................... 5
5.2 Implementation Methodology (Phases) ............................................................................. 6
Phase 1 — Data Ingestion & Validation .............................................................................. 6
Phase 2 — Template Engine .............................................................................................. 6
Phase 3 — OAuth & Sending Integration ............................................................................ 6
Phase 4 — Queue, Throttling & Retry Logic........................................................................ 6
Phase 5 — Reporting & Controls ........................................................................................ 6
Phase 6 — Testing ............................................................................................................. 6
6. Deliverability & Compliance Considerations ........................................................................... 6
7. Risk Summary........................................................................................................................ 7
8. Summary ............................................................................................................................... 7
Bulk Email Sender — Technical Requirements Internal Use
Page 3 of 7
1. Project Overview
This document defines the technical requirements and implementation methodology for an
internal web application that sends personalized bulk emails (500–1,000 recipients per
campaign) to office staff, using recipient data sourced from an Excel file or Google Sheet.
This is an internal communication tool, not a marketing or cold-outreach system. Recipients are
known employees with an existing relationship to the sender, which removes most anti-spam
and consent concerns that apply to unsolicited bulk email — but sending-limit, deliverability, and
data-handling requirements still apply in full.
1.1 Goals
• Allow a non-technical user to upload a spreadsheet of recipients and a message
template.
• Merge per-row data (name, department, etc.) into a personalized email body and subject
line.
• Send emails in a controlled, rate-limited, auditable manner without triggering spam filters
or provider suspensions.
• Track delivery status, bounces, and failures per recipient.
1.2 Non-Goals
• This system is not designed for unsolicited/cold outreach, marketing blasts, or sending to
purchased lists.
• It is not a replacement for a dedicated transactional email service (e.g. payroll slips, legal
notices) where compliance/audit requirements are stricter.
2. Functional Requirements
2.1 Recipient Data Ingestion
1. Accept file upload in .xlsx, .xls, .csv, or a Google Sheets URL (via Google Sheets API /
shared link).
2. Parse the first row as column headers; map columns to merge fields (e.g. {{first_name}},
{{department}}, {{email}}).
3. Validate the email column: syntax check (RFC 5322), duplicate detection, and blank-row
rejection.
4. Display a preview table (first 10–20 rows) so the user can confirm column mapping
before sending.
5. Reject the file with a clear error if the email column is missing or if row count exceeds
the configured maximum.
2.2 Template Authoring
6. Provide a subject-line field and a rich-text (or plain-text) body editor.
Bulk Email Sender — Technical Requirements Internal Use
Page 4 of 7
7. Support merge tags using a clear delimiter syntax, e.g. {{first_name}}, consistent with the
uploaded column headers.
8. Provide a "render preview" mode that shows the email as it will appear for a specific row
(e.g. row 1, or a randomly sampled row).
9. Warn (not block) if a merge tag in the template has no matching column in the uploaded
sheet.
10. Support a plain-text fallback version for HTML emails (improves deliverability and
accessibility).
2.3 Sending Engine
11. Queue all recipients server-side; do not send synchronously from a single HTTP request
(1000 emails will exceed typical request timeouts).
12. Throttle sends to stay within the connected account's provider limit (see Section 4).
13. Process the queue in batches with a delay between batches and between individual
sends to mimic human sending patterns and avoid burst-triggered spam flags.
14. Retry transient failures (e.g. temporary SMTP error 4xx) with exponential backoff; do not
retry permanent failures (5xx, invalid address).
15. Record a status (queued, sent, bounced, failed) per recipient row, with timestamp and
error message if applicable.
16. Provide a pause/resume/cancel control for an in-progress campaign.
2.4 Authentication & Sending Identity
17. Authenticate the sending user via OAuth 2.0 against their own Gmail / Google
Workspace account — never store raw Gmail passwords.
18. Send each campaign using the authenticated user's own mailbox as the From address,
so replies route correctly and the send counts against that user's own provider limit and
reputation.
19. Store only the OAuth refresh/access token, scoped to the minimum required scope
(gmail.send), encrypted at rest.
2.5 Reporting
20. Dashboard showing total sent, bounced, failed, and pending counts per campaign.
21. Downloadable CSV log of per-recipient outcome for record-keeping.
22. Optional: open/click tracking — only with disclosure, since this requires embedding
tracking pixels/links (see Section 6).
3. Non-Functional Requirements
Category Requirement
Performance Process 1,000-row campaign without blocking the UI;
background job processing required.
Bulk Email Sender — Technical Requirements Internal Use
Page 5 of 7
Reliability Job queue must survive a server restart mid-campaign
(persisted state, not in-memory only).
Security OAuth tokens encrypted at rest; HTTPS only; no plaintext
credential storage.
Data Privacy Uploaded spreadsheets may contain personal data (names,
emails); store only as long as needed, restrict access to the
uploading user.
Auditability Every send attempt logged with timestamp, recipient, and result
for at least 90 days.
Usability Non-technical staff must be able to complete upload → preview
→ send without engineering support.
4. Email Provider Constraints
These limits govern the throttling logic in Section 2.3 and must be treated as hard ceilings, not
targets.
Account Type Daily Send Limit Practical Notes
Personal Gmail (@gmail.com) 500 recipients/day Counts total recipients across
To/Cc/Bcc, not just messages.
Google Workspace (Business
Starter/Standard)
~1,500 recipients/day Limit is per user mailbox, resets on
a rolling 24-hour basis.
Google Workspace
(Enterprise) / Gmail API
relayed
Up to 2,000
recipients/day
Exact figure varies by Workspace
edition; verify in Google Admin
console.
Gmail API (gmail.send scope) Subject to per-user
sending limits above,
plus API quota
API quota is separate from but does
not override the mailbox sending
limit.
For a 500–1,000 recipient campaign on a personal Gmail account, the application must split the
send across two days or warn the user before proceeding. On Workspace, a single day is
usually sufficient but the application should still throttle (not burst) the send.
5. System Architecture & Methodology
5.1 High-Level Components
• Frontend: file upload UI, template editor, preview, campaign dashboard.
• Backend API: handles auth, file parsing, validation, campaign creation.
• Job Queue / Worker: dequeues recipients, applies rate limiting, calls the email-sending
API, writes results.
• Database: stores users, OAuth tokens (encrypted), campaigns, recipients, send logs.
Bulk Email Sender — Technical Requirements Internal Use
Page 6 of 7
• Email Sending API: Gmail API (gmail.send) called per message, using the authenticated
user's token.
5.2 Implementation Methodology (Phases)
Phase 1 — Data Ingestion & Validation
• Build the spreadsheet parser (handle .xlsx/.csv structures; map headers to merge fields).
• Implement email-format validation and duplicate removal before any data reaches the
send queue.
Phase 2 — Template Engine
• Build a merge-tag renderer that substitutes {{column}} tokens with per-row values.
• Add a preview mode rendering against sample rows so users catch broken tags before
sending.
Phase 3 — OAuth & Sending Integration
• Implement Google OAuth 2.0 consent flow, requesting only the gmail.send scope.
• Integrate the Gmail API send endpoint; construct MIME messages with both HTML and
plain-text parts.
Phase 4 — Queue, Throttling & Retry Logic
• Introduce a background job queue (e.g. a worker process separate from the web server)
so sends don't block HTTP requests.
• Implement rate limiting: cap messages per minute/hour, with a configurable daily ceiling
matching Section 4.
• Implement retry-with-backoff for transient errors and permanent failure handling for
invalid addresses.
Phase 5 — Reporting & Controls
• Build the live campaign dashboard (sent/bounced/failed/pending counts).
• Add pause/resume/cancel controls tied to the job queue state.
• Add CSV export of the final send log.
Phase 6 — Testing
• Test with a small internal recipient list (5–10 addresses you control) before any full-scale
send.
• Load-test the queue and throttling logic at the target volume (500–1,000) in a staging
environment using disposable test mailboxes.
• Verify retry and failure-logging behavior by deliberately including a malformed address in
a test run.
6. Deliverability & Compliance Considerations
Bulk Email Sender — Technical Requirements Internal Use
Page 7 of 7
Even for internal mail, the following practices materially affect whether messages land in the
inbox versus spam, and keep the tool within acceptable use even though recipients are
colleagues:
• Send from a verified, properly configured domain (SPF, DKIM, and DMARC records
correctly set for the sending domain) if using a Workspace custom domain.
• Avoid spam-trigger patterns even internally: excessive links, ALL-CAPS subject lines,
large attachments, or identical content sent in a tight burst.
• Throttle sends (Section 2.3 / 4) rather than firing all messages simultaneously — this
protects the sending account's reputation, which affects deliverability for everyone in the
organization, not just this campaign.
• If open/click tracking is added, disclose this to recipients in line with internal IT policy,
since tracking pixels collect read-receipt-like data.
• Provide a clear, truthful subject line and sender identity — internal mail should never
spoof a different sender.
• Limit data retention of uploaded spreadsheets (which may contain employee PII) to
what's operationally necessary, and restrict access by role.
7. Risk Summary
Risk Mitigation
Account suspension from burst
sending
Server-side throttling matched to provider limits (Section
4); never send all messages in one batch.
Emails landing in spam SPF/DKIM/DMARC on sending domain; plain-text
fallback; avoid spam-trigger content patterns.
Broken personalization (wrong
name/department)
Mandatory preview-before-send step against sample
rows; warn on unmapped merge tags.
Partial failure mid-campaign
(server restart, crash)
Persist queue state in the database, not in memory, so
sending can resume.
Sensitive employee data
exposure
Encrypt stored OAuth tokens; restrict spreadsheet
access by role; set a data-retention/deletion policy.
8. Summary
The core technical challenge is not the email-sending API itself but controlling the rate and
pattern of sending so it stays within Gmail/Workspace limits and doesn't damage the sending
account's reputation. A background job queue with persisted state, OAuth-based sending under
the user's own identity, and a mandatory preview step are the three components that most
reduce risk for this kind of internal mail-merge to
