import { useState } from 'react';

const tabs = [
  {
    id: 'rf', label: 'Random Forest', icon: '🌲',
    color: '#00f5a0',
    headline: 'Many trees vote together',
    desc: 'Random Forest builds hundreds of decision trees on random subsets of data. Each tree votes on the final prediction — the majority wins. This dramatically reduces overfitting.',
    pros: ['Reduces overfitting', 'Handles missing values', 'Works on large datasets', 'Built-in feature importance'],
    stat: { label: 'Accuracy gain over single tree', value: '+15–25%' },
    viz: 'rf',
  },
  {
    id: 'gb', label: 'Gradient Boosting', icon: '⚡',
    color: '#f59e0b',
    headline: 'Trees that learn from mistakes',
    desc: 'Each new tree focuses on the errors made by previous trees. Mistakes are corrected sequentially, making the model progressively more accurate.',
    pros: ['Highest accuracy', 'Handles complex patterns', 'Flexible loss functions'],
    libs: ['XGBoost', 'LightGBM', 'CatBoost'],
    stat: { label: 'Used in Kaggle competitions', value: '~60%' },
    viz: 'gb',
  },
  {
    id: 'pruned', label: 'Pruned Tree', icon: '✂️',
    color: '#7c3aed',
    headline: 'Cut the complexity',
    desc: 'Pruning removes branches that provide little predictive power. The result is a simpler, faster, more interpretable model that generalizes better.',
    pros: ['More interpretable', 'Faster predictions', 'Less memory usage', 'Better generalization'],
    stat: { label: 'Complexity reduction', value: '~40%' },
    viz: 'pruned',
  },
];

function RFViz() {
  return (
    <svg viewBox="0 0 300 120" style={{ width: '100%' }}>
      {[0, 1, 2, 3, 4].map(i => {
        const x = 20 + i * 54;
        const labels = [['A'], ['B'], ['A'], ['A'], ['B']];
        return (
          <g key={i}>
            <rect x={x} y="10" width="44" height="26" rx="5" fill="#1c1c28" stroke="#00f5a040" strokeWidth="1" />
            <text x={x + 22} y="27" textAnchor="middle" fill="#00f5a0" fontSize="8" fontFamily="Space Mono">Tree {i + 1}</text>
            <line x1={x + 22} y1="36" x2="150" y2="80" stroke="#00f5a020" strokeWidth="1" strokeDasharray="3 2" />
            <rect x={x + 8} y="55" width="28" height="20" rx="4" fill="#0a2a1a" stroke="#00f5a040" strokeWidth="1" />
            <text x={x + 22} y="68" textAnchor="middle" fill="#00f5a0" fontSize="8" fontFamily="Space Mono">{labels[i]}</text>
          </g>
        );
      })}
      <rect x="115" y="90" width="70" height="24" rx="6" fill="#0a2a1a" stroke="#00f5a0" strokeWidth="1.5" />
      <text x="150" y="106" textAnchor="middle" fill="#00f5a0" fontSize="9" fontFamily="Space Mono">Vote: A 🏆</text>
    </svg>
  );
}

function GBViz() {
  const trees = ['Base Tree', '+ Fix Errors', '+ Fix More', 'Final Model'];
  const accs  = [65, 78, 88, 95];
  return (
    <svg viewBox="0 0 300 110" style={{ width: '100%' }}>
      {trees.map((t, i) => (
        <g key={i}>
          <rect x={10 + i * 72} y="10" width="62" height="30" rx="5"
            fill="#2a200a" stroke="#f59e0b" strokeWidth={i === 3 ? 2 : 1} strokeOpacity={i === 3 ? 1 : 0.4} />
          <text x={41 + i * 72} y="24" textAnchor="middle" fill="#f59e0b" fontSize="7" fontFamily="Space Mono">{t}</text>
          <text x={41 + i * 72} y="34" textAnchor="middle" fill="#f59e0b80" fontSize="7">{accs[i]}%</text>
          {i < 3 && (
            <text x={73 + i * 72} y="28" textAnchor="middle" fill="#f59e0b" fontSize="14">→</text>
          )}
        </g>
      ))}
      <rect x="90" y="65" width="120" height="30" rx="6" fill="#2a200a" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="150" y="84" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="Space Mono">Accuracy: 95% ⚡</text>
    </svg>
  );
}

function PrunedViz() {
  return (
    <svg viewBox="0 0 300 130" style={{ width: '100%' }}>
      {/* Before label */}
      <text x="60" y="12" textAnchor="middle" fill="#666680" fontSize="8" fontFamily="Space Mono">BEFORE</text>
      <rect x="30" y="18" width="60" height="22" rx="4" fill="#1c1c28" stroke="#7c3aed40" strokeWidth="1" />
      <text x="60" y="33" textAnchor="middle" fill="#7c3aed" fontSize="8" fontFamily="Space Mono">Root</text>
      {[[-22, 55], [22, 55]].map(([dx, y], i) => (
        <g key={i}>
          <line x1="60" y1="40" x2={60 + dx} y2={y} stroke="#7c3aed20" strokeWidth="1" />
          <rect x={60 + dx - 18} y={y} width="36" height="18" rx="3" fill="#1c1c28" stroke="#7c3aed40" strokeWidth="1" />
          <text x={60 + dx} y={y + 13} textAnchor="middle" fill="#7c3aed80" fontSize="7" fontFamily="Space Mono">Node</text>
        </g>
      ))}
      {[-40, -4, 16, 50].map((dx, i) => (
        <g key={i}>
          <line x1={60 + (i < 2 ? -22 : 22)} y1="73" x2={60 + dx} y2="95" stroke="#7c3aed15" strokeWidth="1" />
          <rect x={60 + dx - 14} y="95" width="28" height="16" rx="3" fill="#2a1010" stroke="#ef444440" strokeWidth="1" />
          <text x={60 + dx} y="107" textAnchor="middle" fill="#ef444480" fontSize="6" fontFamily="Space Mono">Leaf</text>
        </g>
      ))}

      {/* Arrow */}
      <text x="155" y="65" textAnchor="middle" fill="#7c3aed" fontSize="18">→</text>
      <text x="155" y="78" textAnchor="middle" fill="#7c3aed" fontSize="7" fontFamily="Space Mono">PRUNE</text>

      {/* After label */}
      <text x="230" y="12" textAnchor="middle" fill="#666680" fontSize="8" fontFamily="Space Mono">AFTER</text>
      <rect x="200" y="18" width="60" height="22" rx="4" fill="#1c1c28" stroke="#7c3aed" strokeWidth="1.5" />
      <text x="230" y="33" textAnchor="middle" fill="#7c3aed" fontSize="8" fontFamily="Space Mono">Root</text>
      {[[-18, 55], [18, 55]].map(([dx, y], i) => (
        <g key={i}>
          <line x1="230" y1="40" x2={230 + dx} y2={y} stroke="#7c3aed40" strokeWidth="1.5" />
          <rect x={230 + dx - 20} y={y} width="40" height="20" rx="4" fill="#0a0a1a" stroke="#7c3aed" strokeWidth="1.5" />
          <text x={230 + dx} y={y + 14} textAnchor="middle" fill="#7c3aed" fontSize="7" fontFamily="Space Mono">Leaf</text>
        </g>
      ))}
    </svg>
  );
}

export default function Advanced() {
  const [active, setActive] = useState('rf');
  const tab = tabs.find(t => t.id === active);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
        Advanced Models
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        How simple trees evolve into powerful ensemble methods.
      </p>

      {/* Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            background: active === t.id ? t.color + '20' : 'var(--surface)',
            border: `1.5px solid ${active === t.id ? t.color : '#ffffff15'}`,
            borderRadius: 8, padding: '0.6rem 0.25rem',
            color: active === t.id ? t.color : 'var(--muted)',
            fontFamily: 'var(--font-display)', fontSize: '0.6rem',
            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{t.icon}</div>
            {t.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Visualization */}
      <div className="card" style={{ marginBottom: '1.5rem', borderColor: tab.color + '40' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
          {tab.icon} {tab.headline.toUpperCase()}
        </p>
        {tab.viz === 'rf'     && <RFViz />}
        {tab.viz === 'gb'     && <GBViz />}
        {tab.viz === 'pruned' && <PrunedViz />}
      </div>

      {/* Description */}
      <div className="card" style={{ marginBottom: '1rem', borderColor: '#ffffff10' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.7, marginBottom: '1rem' }}>{tab.desc}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {tab.pros.map(p => (
            <span key={p} style={{
              fontSize: '0.7rem', padding: '0.25rem 0.6rem', borderRadius: 20,
              background: tab.color + '15', color: tab.color, border: `1px solid ${tab.color}30`,
            }}>✓ {p}</span>
          ))}
        </div>
        {tab.libs && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
              POPULAR LIBRARIES
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {tab.libs.map(l => (
                <span key={l} style={{
                  fontSize: '0.7rem', padding: '0.25rem 0.75rem', borderRadius: 6,
                  background: 'var(--surface2)', color: tab.color,
                  fontFamily: 'var(--font-display)',
                }}>{l}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stat */}
      <div className="card" style={{ textAlign: 'center', borderColor: tab.color + '40', background: tab.color + '08' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>{tab.stat.label}</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: tab.color }}>{tab.stat.value}</p>
      </div>
    </div>
  );
}