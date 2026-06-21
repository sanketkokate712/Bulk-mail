import { useState, useEffect, useRef, useCallback } from 'react';
import { PlayIcon, PauseIcon, StopIcon, CheckIcon, XIcon, RefreshIcon, AlertIcon, ClockIcon } from '../components/Icons';
import { mergeTemplate } from '../data/mockData';
import { createCampaign, updateCampaignStatus } from '../api/db';
import { sendEmail, mergeTemplate as realMergeTemplate, wakeUpServer } from '../services/gmail';
import { PROVIDER_LIMITS } from '../data/mockData';
import './SendPage.css';

export default function SendPage({ recipients, template, headers, user, onComplete }) {
  const [state, setState] = useState('ready'); // ready | sending | paused | completed
  const [sentCount, setSentCount] = useState(0);
  const [bouncedCount, setBouncedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [results, setResults] = useState([]);
  const [feed, setFeed] = useState([]);
  const [sendRate, setSendRate] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const indexRef = useRef(0);

  const total = recipients.length;
  const providerLimit = PROVIDER_LIMITS[user?.accountType || 'personal'];
  const exceedsLimit = total > providerLimit.limit;

  const isRunningRef = useRef(false);
  const [campaignId, setCampaignId] = useState(null);

  const processNext = useCallback(async (cid) => {
    if (indexRef.current >= total || !isRunningRef.current) {
      if (indexRef.current >= total) {
        setState('completed');
        updateCampaignStatus(cid, 'completed');
      }
      return;
    }

    const currentIndex = indexRef.current;
    indexRef.current += 1;

    const recipient = recipients[currentIndex];
    const email = recipient.email || recipient[headers.find(h => h.toLowerCase().includes('email'))];
    let statusInfo = { status: 'pending', message: '' };

    try {
      const subject = realMergeTemplate(template.subject, recipient);
      const body = realMergeTemplate(template.body, recipient);
      
      await sendEmail({ to: email, subject, body });
      statusInfo = { status: 'sent', message: 'Delivered successfully via Gmail API' };
      setSentCount(prev => prev + 1);
    } catch (error) {
      statusInfo = { status: 'failed', message: error.message };
      setFailedCount(prev => prev + 1);
    }

    const timestamp = new Date().toLocaleTimeString();
    const entry = { index: currentIndex, email, ...statusInfo, timestamp };

    setResults(prev => [...prev, entry]);
    setFeed(prev => [entry, ...prev].slice(0, 50));

    // Calculate rate
    const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60;
    if (elapsed > 0) {
      setSendRate(Math.round(indexRef.current / elapsed));
    }

    if (isRunningRef.current) {
      setTimeout(() => processNext(cid), 1000); // 1 email per second throttle
    }
  }, [total, recipients, headers, template]);

  const startSending = useCallback(async () => {
    setState('sending');
    isRunningRef.current = true;
    if (!startTimeRef.current) startTimeRef.current = Date.now();

    // Wake up Render server first (free tier sleeps after 15 min)
    await wakeUpServer((msg) => console.log('[Wake]', msg));

    let cid = campaignId;
    if (!cid) {
      try {
        cid = await createCampaign(user.uid, template, recipients);
        setCampaignId(cid);
      } catch (err) {
        console.warn("Could not create campaign in DB (non-fatal):", err);
      }
    }

    if (cid) {
      try {
        await updateCampaignStatus(cid, 'sending');
      } catch (err) {
        console.warn("Could not update campaign status:", err);
      }
    }

    // ALWAYS start sending regardless of DB errors
    processNext(cid);
  }, [processNext, campaignId, template, recipients, user.uid]);

  const pauseSending = () => {
    setState('paused');
    isRunningRef.current = false;
    if (campaignId) updateCampaignStatus(campaignId, 'paused');
  };

  const resumeSending = () => {
    startSending();
  };

  const cancelSending = () => {
    setState('completed');
    isRunningRef.current = false;
    if (campaignId) updateCampaignStatus(campaignId, 'completed');
  };

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (indexRef.current >= total && state === 'sending') {
      setState('completed');
      isRunningRef.current = false;
    }
  }, [sentCount, bouncedCount, failedCount, total, state]);

  const progress = total > 0 ? ((sentCount + bouncedCount + failedCount) / total) * 100 : 0;
  const pending = total - sentCount - bouncedCount - failedCount;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <span className="feed-icon feed-icon--sent">✓</span>;
      case 'bounced': return <span className="feed-icon feed-icon--bounced">↩</span>;
      case 'failed': return <span className="feed-icon feed-icon--failed">✗</span>;
      default: return <span className="feed-icon feed-icon--pending">⟳</span>;
    }
  };

  return (
    <div className="send-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {state === 'completed' ? 'Campaign Complete' : state === 'sending' ? 'Sending Campaign...' : state === 'paused' ? 'Campaign Paused' : 'Ready to Send'}
          </h1>
          <p className="page-subtitle">
            {state === 'ready' && `${total} recipients will receive personalized emails`}
            {state === 'sending' && `Processing queue — ${sendRate} emails/min`}
            {state === 'paused' && `Paused at ${sentCount + bouncedCount + failedCount}/${total}`}
            {state === 'completed' && `${sentCount} delivered, ${bouncedCount} bounced, ${failedCount} failed`}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper">
        <div className="step completed"><div className="step-num">✓</div><span className="step-label">Upload</span></div>
        <div className="step-line completed" />
        <div className="step completed"><div className="step-num">✓</div><span className="step-label">Compose</span></div>
        <div className="step-line completed" />
        <div className="step active"><div className="step-num">3</div><span className="step-label">Send</span></div>
        <div className="step-line" />
        <div className="step"><div className="step-num">4</div><span className="step-label">Report</span></div>
      </div>

      {/* Provider Warning */}
      {exceedsLimit && state === 'ready' && (
        <div className="provider-warning">
          <AlertIcon style={{ width: 18, height: 18 }} />
          <div>
            <strong>{total} recipients</strong> exceeds your {providerLimit.label} daily limit of <strong>{providerLimit.limit}/day</strong>.
            The campaign may need to span multiple days. {providerLimit.note}.
          </div>
        </div>
      )}

      {/* Campaign Summary */}
      {state === 'ready' && (
        <div className="campaign-summary">
          <div className="summary-card">
            <span className="summary-label">Recipients</span>
            <span className="summary-value">{total}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Account Type</span>
            <span className="summary-value summary-value--sm">{providerLimit.label}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Daily Limit</span>
            <span className="summary-value">{providerLimit.limit}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Est. Time</span>
            <span className="summary-value summary-value--sm">{Math.ceil(total * 0.5 / 60)} min</span>
          </div>
        </div>
      )}

      {/* Progress Section */}
      {state !== 'ready' && (
        <div className="progress-section">
          <div className="progress-stats">
            <div className="stat-mini stat-mini--green">
              <span className="stat-mini-value">{sentCount}</span>
              <span className="stat-mini-label">Sent</span>
            </div>
            <div className="stat-mini stat-mini--orange">
              <span className="stat-mini-value">{bouncedCount}</span>
              <span className="stat-mini-label">Bounced</span>
            </div>
            <div className="stat-mini stat-mini--red">
              <span className="stat-mini-value">{failedCount}</span>
              <span className="stat-mini-label">Failed</span>
            </div>
            <div className="stat-mini stat-mini--gray">
              <span className="stat-mini-value">{pending}</span>
              <span className="stat-mini-label">Pending</span>
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-bar-meta">
              <span>{Math.round(progress)}%</span>
              <span>{sentCount + bouncedCount + failedCount} / {total}</span>
            </div>
          </div>

          {/* Throttle Info */}
          {state === 'sending' && (
            <div className="throttle-info">
              <ClockIcon style={{ width: 14, height: 14 }} />
              <span>Throttling: ~{sendRate} emails/min • Mimicking human send pattern</span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="campaign-controls">
        {state === 'ready' && (
          <button className="btn-play" onClick={startSending} id="start-send-btn">
            <PlayIcon style={{ width: 24, height: 24 }} />
            <span>Start Sending</span>
          </button>
        )}
        {state === 'sending' && (
          <>
            <button className="btn-control btn-control--pause" onClick={pauseSending} id="pause-btn">
              <PauseIcon style={{ width: 20, height: 20 }} />
              <span>Pause</span>
            </button>
            <button className="btn-control btn-control--cancel" onClick={cancelSending} id="cancel-btn">
              <StopIcon style={{ width: 18, height: 18 }} />
              <span>Cancel</span>
            </button>
          </>
        )}
        {state === 'paused' && (
          <>
            <button className="btn-play" onClick={resumeSending} id="resume-btn">
              <PlayIcon style={{ width: 24, height: 24 }} />
              <span>Resume</span>
            </button>
            <button className="btn-control btn-control--cancel" onClick={cancelSending}>
              <StopIcon style={{ width: 18, height: 18 }} />
              <span>Cancel</span>
            </button>
          </>
        )}
        {state === 'completed' && (
          <button className="btn-pill-green" onClick={() => onComplete(results)} id="view-report-btn">
            View Report
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        )}
      </div>

      {/* Live Feed */}
      {feed.length > 0 && (
        <div className="feed-section">
          <h3 className="feed-title">Live Activity</h3>
          <div className="feed-list">
            {feed.map((item, i) => (
              <div key={`${item.index}-${i}`} className="feed-item" style={{ animationDelay: `${i * 0.02}s` }}>
                {getStatusIcon(item.status)}
                <span className="feed-email">{item.email}</span>
                <span className={`feed-status feed-status--${item.status}`}>{item.status}</span>
                <span className="feed-time">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
