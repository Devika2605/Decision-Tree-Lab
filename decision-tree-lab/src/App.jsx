import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './styles/globals.css';
import Intro       from './modules/Intro';
import Builder     from './modules/Builder';

import Challenge   from './modules/Challenge';
import Overfitting from './modules/Overfitting';
import Advanced    from './modules/Advanced';
import Quiz        from './modules/Quiz';

const TABS = [
  { label: 'Intro',       path: '/'            },
  { label: 'Builder',     path: '/builder'      },

  { label: 'Challenge', path: '/challenge'    },
  { label: 'Algorithm',   path: '/overfitting'  },
  { label: 'Advanced',    path: '/advanced'     },
  { label: 'Quiz',        path: '/quiz'         },
];

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #0d0d14)' }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        textAlign: 'center',
        padding: '2rem 1.5rem 0',
        animation: 'fadeDown 0.6s ease both',
      }}>
        <h1 style={{
          margin: '0 0 0.3rem',
          fontFamily: '"Courier New", monospace',
          fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
          fontWeight: 800,
          color: '#f0f0f8',
          letterSpacing: '0.04em',
          lineHeight: 1.15,
          textTransform: 'uppercase',
        }}>
          Decision Tree Lab
        </h1>
        <p style={{
          margin: '0 0 1.2rem',
          fontFamily: '"Courier New", monospace',
          fontSize: '0.68rem',
          color: '#00f5a0',
          letterSpacing: '0.06em',
        }}>
          Interactive Algorithm Visualizer · 6 Sections
        </p>

        {/* ── PILL TAB BAR — single scrollable row ── */}
        <div style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '0 1rem 0.2rem',
        }}>
          <div style={{
            display: 'inline-flex',
            gap: '0.3rem',
            whiteSpace: 'nowrap',
            minWidth: 'max-content',
            margin: '0 auto',
          }}>
            {TABS.map(tab => {
              const active = location.pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  style={{
                    fontFamily: '"Courier New", monospace',
                    fontSize: '0.65rem',
                    fontWeight: active ? 700 : 400,
                    padding: '0.35rem 0.85rem',
                    borderRadius: 999,
                    border: active
                      ? '1.5px solid #00f5a0'
                      : '1.5px solid #ffffff18',
                    background: active ? '#00f5a0' : 'transparent',
                    color: active ? '#080c0a' : '#9ca3af',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.03em',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.borderColor = '#00f5a050';
                      e.currentTarget.style.color = '#e0e0e8';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.borderColor = '#ffffff18';
                      e.currentTarget.style.color = '#9ca3af';
                    }
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, #ffffff14, transparent)',
          margin: '1rem 0 0',
        }} />
      </div>

      {/* ── PAGE CONTENT ── */}
      <div style={{ paddingTop: '0' }}>
        <Routes>
          <Route path="/"            element={<Intro />} />
          <Route path="/builder"     element={<Builder />} />
          <Route path="/challenge"   element={<Challenge />} />
          <Route path="/overfitting" element={<Overfitting />} />
          <Route path="/advanced"    element={<Advanced />} />
          <Route path="/quiz"        element={<Quiz />} />
        </Routes>
      </div>

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}