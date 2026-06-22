import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import UploadPage from './pages/UploadPage';
import ComposePage from './pages/ComposePage';
import SendPage from './pages/SendPage';
import DashboardPage from './pages/DashboardPage';
import { subscribeToAuthChanges } from './firebase/auth';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('upload');
  const [recipients, setRecipients] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [template, setTemplate] = useState({ subject: '', body: '' });
  const [campaignResults, setCampaignResults] = useState([]);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // 1. Check for custom MongoDB token
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setLoadingAuth(false);
      } catch (e) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }

    // 2. Listen for Firebase Google Auth changes
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          accountType: 'workspace_standard',
          provider: 'google'
        };
        setUser(userData);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('authUser', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      const { logout } = await import('./firebase/auth');
      await logout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
  };

  const handleNavigate = useCallback((view) => {
    setCurrentView(view);
  }, []);

  const handleDataReady = () => {
    setCurrentView('compose');
  };

  const handleComposeReady = () => {
    setCurrentView('send');
  };

  const handleSendComplete = (results) => {
    setCampaignResults(results);
    setCurrentView('dashboard');
  };

  if (loadingAuth) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <div className="main-scroll">
          {currentView === 'upload' && (
            <UploadPage
              onDataReady={handleDataReady}
              recipients={recipients}
              setRecipients={setRecipients}
              headers={headers}
              setHeaders={setHeaders}
            />
          )}
          {currentView === 'compose' && (
            <ComposePage
              headers={headers}
              recipients={recipients}
              template={template}
              setTemplate={setTemplate}
              onReady={handleComposeReady}
            />
          )}
          {currentView === 'send' && (
            <SendPage
              recipients={recipients}
              template={template}
              headers={headers}
              user={user}
              onComplete={handleSendComplete}
            />
          )}
          {currentView === 'dashboard' && (
            <DashboardPage
              currentResults={campaignResults}
              recipients={recipients}
              user={user}
            />
          )}
        </div>
        <div className="bottom-bar">
          <div className="bottom-bar-left">
            <span className="connection-dot" />
            <span>Connected as {user.email}</span>
          </div>
          <div className="bottom-bar-right">
            <span>{recipients.length > 0 ? `${recipients.length} recipients loaded` : 'No data loaded'}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
