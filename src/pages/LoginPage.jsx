import { useState } from 'react';
import { BulkMailLogo, MailIcon, GoogleIcon, UploadIcon, CheckIcon, DashboardIcon } from '../components/Icons';
import { loginWithGoogle } from '../firebase/auth';
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { user } = await loginWithGoogle();
      
      onLogin({
        uid: user.uid,
        name: user.displayName || 'User',
        email: user.email,
        photoURL: user.photoURL,
        accountType: 'workspace_standard',
        provider: 'google'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const body = isLoginMode ? { email, password } : { email, password, name };

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'https://bulkmailer-wxyb.onrender.com';
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Server returned an invalid response. Is MongoDB running?');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Save token
      localStorage.setItem('authToken', data.token);

      // Pass user up to App state
      onLogin({
        uid: data.user.id,
        name: data.user.name,
        email: data.user.email,
        accountType: 'workspace_standard',
        provider: 'mongodb'
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      {/* Ambient glow effects */}
      <div className="login-glow login-glow--1" />
      <div className="login-glow login-glow--2" />

      <div className="login-card">
        <div className="login-logo">
          <BulkMailLogo style={{ width: 56, height: 56 }} />
        </div>
        <h1 className="login-title">BulkMailer</h1>
        <p className="login-subtitle">
          Internal mail-merge for your team — personalized, rate-limited, auditable.
        </p>

        <div className="login-features">
          <div className="login-feature">
            <div className="login-feature-icon"><UploadIcon style={{ width: 16, height: 16 }} /></div>
            <span>Upload Excel/CSV recipient lists</span>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon"><MailIcon style={{ width: 16, height: 16 }} /></div>
            <span>Personalize with merge tags</span>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon"><CheckIcon style={{ width: 16, height: 16 }} /></div>
            <span>Smart throttling within Gmail limits</span>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon"><DashboardIcon style={{ width: 16, height: 16 }} /></div>
            <span>Real-time delivery dashboard</span>
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--negative)', fontSize: '0.8125rem', marginBottom: '16px', padding: '10px', background: 'rgba(243, 114, 127, 0.1)', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <button className="login-btn" onClick={handleGoogleLogin} disabled={loading} id="login-google-btn">
          <GoogleIcon style={{ width: 20, height: 20 }} />
          <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <div className="login-divider">
          <span>OR CONTINUE WITH EMAIL</span>
        </div>

        <form onSubmit={handleEmailSubmit} className="login-form" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!isLoginMode && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem' }}
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem' }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem' }}
          />

          <button type="submit" className="login-btn" disabled={loading} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', marginTop: '4px' }}>
            <MailIcon style={{ width: 18, height: 18 }} />
            <span>{loading ? 'Processing...' : (isLoginMode ? 'Sign In with Email' : 'Create Account')}</span>
          </button>
        </form>

        <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => { setIsLoginMode(!isLoginMode); setError(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
          >
            {isLoginMode ? 'Sign up' : 'Log in'}
          </button>
        </div>

        <p className="login-footer" style={{ marginTop: '16px' }}>
          Sends using your own Gmail / Workspace mailbox.<br />
          500–2,000 recipients/day depending on account type.
        </p>
      </div>
    </div>
  );
}
