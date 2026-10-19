import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Grid,
  Download,
  Home,
  Sliders,
  Menu,
  X,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { KartuliDeckLogo, GeorgianOrnamentDivider } from './GeorgianOrnaments';
import { SystemStatusResponse } from '../services/apiClient';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error';
}

export const Layout: React.FC<{
  children: React.ReactNode;
  systemStatus: SystemStatusResponse | null;
  toasts: ToastMessage[];
  onDismissToast: (id: string) => void;
}> = ({ children, systemStatus, toasts, onDismissToast }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'მთავარი', icon: <Home size={16} /> },
    { to: '/generator', label: 'გენერატორი', icon: <Sparkles size={16} /> },
    { to: '/editor', label: 'კარტის რედაქტორი', icon: <Sliders size={16} /> },
    { to: '/projects', label: 'ჩემი პროექტები', icon: <Layers size={16} /> },
    { to: '/gallery', label: 'გალერეა', icon: <Grid size={16} /> },
    { to: '/export', label: 'ექსპორტი', icon: <Download size={16} /> },
  ];

  return (
    <div className="app-shell">
      {/* Sticky Luxury Header */}
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <KartuliDeckLogo theme="dark" size="md" />
          </Link>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="ნავიგაციის მენიუ"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}

            {systemStatus && (
              <div
                style={{
                  marginLeft: '0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                title={
                  systemStatus.geminiConfigured
                    ? `Gemini API აქტიურია (${systemStatus.activeModel})`
                    : 'ლოკალური დემო რეჟიმი — რეალური Gemini გენერაციისთვის დაამატეთ GEMINI_API_KEY'
                }
              >
                <span
                  className={`badge ${
                    systemStatus.geminiConfigured ? 'badge-success' : 'badge-gold'
                  }`}
                >
                  {systemStatus.geminiConfigured ? (
                    <>
                      <ShieldCheck size={13} />
                      <span>Gemini Live</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={13} />
                      <span>დემო სტუდია</span>
                    </>
                  )}
                </span>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Page Content */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Luxury Footer */}
      <footer
        style={{
          marginTop: '5rem',
          borderTop: 'var(--border-gold-thin)',
          background: '#110E0F',
          padding: '3rem 0 2.5rem',
        }}
      >
        <div className="container">
          <GeorgianOrnamentDivider width="100%" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '2rem',
              marginTop: '1.5rem',
            }}
          >
            <div>
              <KartuliDeckLogo theme="dark" size="sm" />
              <p
                style={{
                  color: 'var(--color-stone)',
                  fontSize: '0.88rem',
                  marginTop: '0.85rem',
                  maxWidth: '340px',
                }}
              >
                ქართული კულტურული მემკვიდრეობით, ტრადიციული ორნამენტებითა და თანამედროვე
                ციფრული ხელოვნებით შთაგონებული სათამაშო ბანქოს დიზაინის სტუდია.
              </p>
            </div>

            <div>
              <h4
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--color-gold)',
                  marginBottom: '0.75rem',
                }}
              >
                სტუდიის გვერდები
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    style={{ color: 'var(--color-stone)', fontSize: '0.88rem' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--color-gold)',
                  marginBottom: '0.75rem',
                }}
              >
                ტექნოლოგია და კონტაქტი
              </h4>
              <p style={{ color: 'var(--color-stone)', fontSize: '0.86rem' }}>
                მოდელი: {systemStatus?.activeModel || 'gemini-nano-banana-2.1'}
              </p>
              <p style={{ color: 'var(--color-stone)', fontSize: '0.86rem', marginTop: '0.35rem' }}>
                რენდერი: ზუსტი ვექტორული SVG + 300 DPI საბეჭდი PDF
              </p>
              <p style={{ color: 'var(--color-stone)', fontSize: '0.86rem', marginTop: '0.35rem' }}>
                ელ-ფოსტა: studio@kartulideck.ge | თბილისი, საქართველო
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: '2.25rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(198, 161, 91, 0.14)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: '1rem',
              fontSize: '0.8rem',
              color: 'var(--color-stone-dark)',
            }}
          >
            <span>© {new Date().getFullYear()} KARTULI DECK AI. ყველა უფლება დაცულია.</span>
            <span>ქართული ორნამენტული ხელოვნებისა და AI ტექნოლოგიის სინთეზი</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Stack */}
      {toasts.length > 0 && (
        <div className="toast-container" role="region" aria-label="შეტყობინებები">
          {toasts.map((t) => (
            <div key={t.id} className={`toast-item ${t.type}`}>
              <span style={{ fontSize: '0.88rem' }}>{t.text}</span>
              <button
                onClick={() => onDismissToast(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-stone)',
                  cursor: 'pointer',
                }}
                aria-label="დახურვა"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
