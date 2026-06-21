import { useState, useRef } from 'react';
import { UploadIcon, FileIcon, CheckIcon, XIcon, AlertIcon, DownloadIcon } from '../components/Icons';
import { parseCSV, isValidEmail, SAMPLE_RECIPIENTS, generateSampleCSV, downloadFile } from '../data/mockData';
import './UploadPage.css';

export default function UploadPage({ onDataReady, recipients, setRecipients, headers, setHeaders }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [emailColumn, setEmailColumn] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { headers: parsedHeaders, rows } = parseCSV(text);
      setHeaders(parsedHeaders);
      setRecipients(rows);

      // Auto-detect email column
      const emailCol = parsedHeaders.find(h =>
        h.toLowerCase().includes('email') || h.toLowerCase().includes('mail')
      );
      if (emailCol) {
        setEmailColumn(emailCol);
        validateEmails(rows, emailCol);
      }
    };
    reader.readAsText(file);
  };

  const validateEmails = (rows, col) => {
    const emails = rows.map(r => r[col]).filter(Boolean);
    const valid = emails.filter(isValidEmail);
    const invalid = emails.filter(e => !isValidEmail(e));
    const duplicates = emails.filter((e, i) => emails.indexOf(e) !== i);
    const blanks = rows.length - emails.length;

    setValidationResult({
      total: rows.length,
      valid: valid.length,
      invalid: invalid.length,
      duplicates: [...new Set(duplicates)].length,
      blanks,
      invalidEmails: invalid.slice(0, 5),
    });
  };

  const handleColumnChange = (col) => {
    setEmailColumn(col);
    if (recipients.length > 0) {
      validateEmails(recipients, col);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUseSample = () => {
    setHeaders(Object.keys(SAMPLE_RECIPIENTS[0]));
    setRecipients(SAMPLE_RECIPIENTS);
    setFileName('sample_recipients.csv');
    setFileSize(1240);
    setEmailColumn('email');
    validateEmails(SAMPLE_RECIPIENTS, 'email');
  };

  const handleDownloadSample = () => {
    downloadFile(generateSampleCSV(), 'sample_recipients.csv');
  };

  const canProceed = recipients.length > 0 && emailColumn && validationResult && validationResult.valid > 0;

  return (
    <div className="upload-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Recipients</h1>
          <p className="page-subtitle">Import your spreadsheet with recipient data and merge fields</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper">
        <div className="step active"><div className="step-num">1</div><span className="step-label">Upload</span></div>
        <div className="step-line" />
        <div className="step"><div className="step-num">2</div><span className="step-label">Compose</span></div>
        <div className="step-line" />
        <div className="step"><div className="step-num">3</div><span className="step-label">Send</span></div>
        <div className="step-line" />
        <div className="step"><div className="step-num">4</div><span className="step-label">Report</span></div>
      </div>

      {/* Upload Zone */}
      {recipients.length === 0 ? (
        <div
          className={`upload-zone ${dragOver ? 'dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          id="upload-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <div className="upload-icon-wrapper">
            <UploadIcon style={{ width: 40, height: 40 }} />
          </div>
          <div className="upload-text">
            <p className="upload-text-main">Drop your spreadsheet here</p>
            <p className="upload-text-sub">or click to browse — supports .CSV, .XLSX, .XLS</p>
          </div>
          <div className="upload-divider-row">
            <span className="upload-divider-line" />
            <span className="upload-divider-text">or</span>
            <span className="upload-divider-line" />
          </div>
          <button className="btn-pill-dark" onClick={(e) => { e.stopPropagation(); handleUseSample(); }}>
            Use Sample Data (15 recipients)
          </button>
        </div>
      ) : (
        <>
          {/* File Info Card */}
          <div className="file-info-card">
            <div className="file-info-left">
              <div className="file-icon-box">
                <FileIcon style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <p className="file-name">{fileName}</p>
                <p className="file-meta">{(fileSize / 1024).toFixed(1)} KB · {recipients.length} rows · {headers.length} columns</p>
              </div>
            </div>
            <button className="btn-pill-outlined-sm" onClick={() => {
              setRecipients([]); setHeaders([]); setFileName(''); setValidationResult(null); setEmailColumn('');
            }}>
              Change File
            </button>
          </div>

          {/* Column Mapping */}
          <div className="mapping-section">
            <h2 className="section-title-sm">Column Mapping</h2>
            <div className="mapping-row">
              <label className="mapping-label">Email Column</label>
              <select
                className="select-pill"
                value={emailColumn}
                onChange={(e) => handleColumnChange(e.target.value)}
                id="email-column-select"
              >
                <option value="">Select column...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="detected-fields">
              <span className="detected-label">Detected merge fields:</span>
              <div className="field-chips">
                {headers.map(h => (
                  <span key={h} className={`field-chip ${h === emailColumn ? 'field-chip--email' : ''}`}>
                    {'{{' + h + '}}'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Validation */}
          {validationResult && (
            <div className="validation-card">
              <h2 className="section-title-sm">Validation</h2>
              <div className="validation-grid">
                <div className="val-item val-item--good">
                  <CheckIcon style={{ width: 16, height: 16 }} />
                  <span>{validationResult.valid} valid emails</span>
                </div>
                {validationResult.invalid > 0 && (
                  <div className="val-item val-item--bad">
                    <XIcon style={{ width: 16, height: 16 }} />
                    <span>{validationResult.invalid} invalid</span>
                  </div>
                )}
                {validationResult.duplicates > 0 && (
                  <div className="val-item val-item--warn">
                    <AlertIcon style={{ width: 16, height: 16 }} />
                    <span>{validationResult.duplicates} duplicates</span>
                  </div>
                )}
                {validationResult.blanks > 0 && (
                  <div className="val-item val-item--warn">
                    <AlertIcon style={{ width: 16, height: 16 }} />
                    <span>{validationResult.blanks} blank rows</span>
                  </div>
                )}
              </div>
              {validationResult.total > 500 && (
                <div className="limit-warning">
                  <AlertIcon style={{ width: 16, height: 16 }} />
                  <span>
                    {validationResult.total} recipients exceeds personal Gmail limit (500/day).
                    Workspace accounts support up to 1,500–2,000.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Preview Table */}
          <div className="preview-section">
            <div className="preview-header">
              <h2 className="section-title-sm">Preview (first {Math.min(10, recipients.length)} rows)</h2>
              <button className="btn-pill-outlined-sm" onClick={handleDownloadSample}>
                <DownloadIcon style={{ width: 14, height: 14 }} />
                Download Sample CSV
              </button>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {headers.map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {recipients.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td className="row-num">{i + 1}</td>
                      {headers.map(h => (
                        <td key={h} className={h === emailColumn ? 'email-cell' : ''}>
                          {h === emailColumn ? (
                            <span className={`email-value ${isValidEmail(row[h]) ? 'valid' : 'invalid'}`}>
                              {row[h]}
                            </span>
                          ) : row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Continue Button */}
          <div className="action-bar">
            <button
              className={`btn-pill-green ${!canProceed ? 'disabled' : ''}`}
              onClick={() => canProceed && onDataReady()}
              disabled={!canProceed}
              id="continue-to-compose"
            >
              Continue to Compose
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
