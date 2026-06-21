import { UploadIcon, EditIcon, SendIcon, DashboardIcon, BulkMailLogo } from './Icons';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'upload', label: 'Upload Data', icon: UploadIcon },
  { id: 'compose', label: 'Compose Email', icon: EditIcon },
  { id: 'send', label: 'Send Campaign', icon: SendIcon },
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
];

export default function Sidebar({ currentView, onNavigate, user }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => onNavigate('upload')}>
        <BulkMailLogo style={{ width: 32, height: 32 }} />
        <span className="sidebar-logo-text">BulkMailer</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            id={`nav-${item.id}`}
          >
            <item.icon style={{ width: 20, height: 20 }} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="nav-divider" />

      {user && (
        <div className="sidebar-user">
          <div className="user-avatar">{user.name[0]}</div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
