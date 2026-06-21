import { useState, useEffect } from 'react';
import { EyeIcon, AlertIcon } from '../components/Icons';
import { mergeTemplate, findUnmatchedTags, SAMPLE_TEMPLATE } from '../data/mockData';
import './ComposePage.css';

export default function ComposePage({ headers, recipients, template, setTemplate, onReady }) {
  const [subject, setSubject] = useState(template.subject || SAMPLE_TEMPLATE.subject);
  const [body, setBody] = useState(template.body || SAMPLE_TEMPLATE.body);
  const [previewRow, setPreviewRow] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [unmatchedTags, setUnmatchedTags] = useState([]);

  useEffect(() => {
    const allText = subject + ' ' + body;
    setUnmatchedTags(findUnmatchedTags(allText, headers));
  }, [subject, body, headers]);

  useEffect(() => {
    setTemplate({ subject, body });
  }, [subject, body, setTemplate]);

  const currentRow = recipients[previewRow] || {};
  const previewSubject = mergeTemplate(subject, currentRow);
  const previewBody = mergeTemplate(body, currentRow);

  const insertTag = (tag) => {
    setBody(prev => prev + `{{${tag}}}`);
  };

  const canProceed = subject.trim() && body.trim() && recipients.length > 0;

  return (
    <div className="compose-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compose Email</h1>
          <p className="page-subtitle">Create your template with personalized merge tags</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper">
        <div className="step completed"><div className="step-num">✓</div><span className="step-label">Upload</span></div>
        <div className="step-line completed" />
        <div className="step active"><div className="step-num">2</div><span className="step-label">Compose</span></div>
        <div className="step-line" />
        <div className="step"><div className="step-num">3</div><span className="step-label">Send</span></div>
        <div className="step-line" />
        <div className="step"><div className="step-num">4</div><span className="step-label">Report</span></div>
      </div>

      <div className="compose-layout">
        {/* Editor Panel */}
        <div className="editor-panel">
          {/* Merge Tags */}
          <div className="merge-tags-bar">
            <span className="merge-tags-label">Insert merge tag:</span>
            <div className="merge-tags-chips">
              {headers.map(h => (
                <button key={h} className="tag-chip" onClick={() => insertTag(h)}>
                  {'{{' + h + '}}'}
                </button>
              ))}
            </div>
          </div>

          {/* Unmatched Warning */}
          {unmatchedTags.length > 0 && (
            <div className="unmatched-warning">
              <AlertIcon style={{ width: 16, height: 16 }} />
              <span>
                Unmatched tags: {unmatchedTags.map(t => `{{${t}}}`).join(', ')} — no matching column found
              </span>
            </div>
          )}

          {/* Subject */}
          <div className="input-group">
            <label className="input-label-sm">Subject Line</label>
            <input
              type="text"
              className="input-pill"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject with {{merge_tags}}"
              id="subject-input"
            />
          </div>

          {/* Body */}
          <div className="input-group">
            <label className="input-label-sm">Email Body</label>
            <textarea
              className="textarea-dark"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email body here. Use {{column_name}} for personalization..."
              rows={14}
              id="body-input"
            />
          </div>

          <div className="compose-info">
            <span className="compose-info-item">{recipients.length} recipients</span>
            <span className="compose-info-dot" />
            <span className="compose-info-item">{headers.length} merge fields available</span>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="preview-panel">
          <div className="preview-panel-header">
            <div className="preview-panel-title">
              <EyeIcon style={{ width: 16, height: 16 }} />
              <span>Live Preview</span>
            </div>
            <div className="row-selector">
              <label>Row:</label>
              <select
                value={previewRow}
                onChange={(e) => setPreviewRow(Number(e.target.value))}
                className="select-sm"
              >
                {recipients.slice(0, 20).map((r, i) => (
                  <option key={i} value={i}>
                    {i + 1} — {r[headers.find(h => h.toLowerCase().includes('name'))] || r[headers[0]] || `Row ${i+1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="email-preview-card">
            <div className="email-preview-meta">
              <div className="preview-meta-row">
                <span className="meta-label">From:</span>
                <span className="meta-value">you@company.com</span>
              </div>
              <div className="preview-meta-row">
                <span className="meta-label">To:</span>
                <span className="meta-value">{currentRow.email || 'recipient@company.com'}</span>
              </div>
              <div className="preview-meta-row">
                <span className="meta-label">Subject:</span>
                <span className="meta-value meta-subject">{previewSubject || '(empty subject)'}</span>
              </div>
            </div>
            <div className="email-preview-body">
              {previewBody.split('\n').map((line, i) => (
                <p key={i}>{line || '\u00A0'}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar-compose">
        <button
          className={`btn-pill-green ${!canProceed ? 'disabled' : ''}`}
          onClick={() => canProceed && onReady()}
          disabled={!canProceed}
          id="continue-to-send"
        >
          Preview & Send
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
