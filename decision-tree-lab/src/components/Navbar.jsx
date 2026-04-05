import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',            label: '01 Intro' },
  { to: '/builder',     label: '02 Builder' },

  { to: '/challenge',   label: '04 Challenge' },
  { to: '/overfitting', label: '05 Overfit' },
  { to: '/advanced',    label: '06 Advanced' },
  { to: '/quiz',        label: '07 Quiz' },
];

export default function Navbar() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #ffffff10',
      display: 'flex', alignItems: 'center',
      padding: '0 2rem', height: '56px', gap: '0.25rem',
    }}>
      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', marginRight: '2rem', fontSize: '0.85rem' }}>
        🌿 DT_LAB
      </span>
      {links.map(l => (
        <NavLink key={l.to} to={l.to} end={l.to === '/'}
          style={({ isActive }) => ({
            fontFamily: 'var(--font-display)', fontSize: '0.7rem',
            padding: '0.35rem 0.75rem', borderRadius: '6px',
            color: isActive ? '#000' : 'var(--muted)',
            background: isActive ? 'var(--accent)' : 'transparent',
            textDecoration: 'none', transition: 'all 0.2s',
          })}>
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}