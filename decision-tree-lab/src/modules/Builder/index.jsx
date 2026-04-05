import { useState, useEffect, useRef } from 'react';

// ── Math helpers ─────────────────────────────────────────────────────────────
const gini = (counts, total) => {
  if (total === 0) return 0;
  return 1 - counts.reduce((s, c) => s + (c / total) ** 2, 0);
};

const entropy = (counts, total) => {
  if (total === 0) return 0;
  return -counts.reduce((s, c) => {
    const p = c / total;
    return s + (p > 0 ? p * Math.log2(p) : 0);
  }, 0);
};

const weightedImpurity = (fn, left, right) => {
  const total = left.total + right.total;
  if (total === 0) return 0;
  return (left.total / total) * fn(left.counts, left.total)
       + (right.total / total) * fn(right.counts, right.total);
};

// ── Dataset ──────────────────────────────────────────────────────────────────
const DATASET = [
  { glucose: 170, bmi: 35, age: 52, label: 'High' },
  { glucose: 155, bmi: 32, age: 45, label: 'High' },
  { glucose: 148, bmi: 29, age: 60, label: 'Med'  },
  { glucose: 142, bmi: 31, age: 38, label: 'High' },
  { glucose: 135, bmi: 28, age: 55, label: 'Med'  },
  { glucose: 128, bmi: 26, age: 42, label: 'Med'  },
  { glucose: 120, bmi: 33, age: 50, label: 'Med'  },
  { glucose: 112, bmi: 24, age: 48, label: 'Low'  },
  { glucose: 105, bmi: 22, age: 35, label: 'Low'  },
  { glucose:  98, bmi: 21, age: 28, label: 'Low'  },
];

const LABELS   = ['High', 'Med', 'Low'];
const L_COLORS = { High: '#ef4444', Med: '#f59e0b', Low: '#00f5a0' };

const FEATURES = [
  { key: 'glucose', label: 'Glucose', min: 90, max: 180, step: 5,  unit: 'mg/dL' },
  { key: 'bmi',     label: 'BMI',     min: 20, max: 38,  step: 1,  unit: '' },
  { key: 'age',     label: 'Age',     min: 25, max: 65,  step: 5,  unit: 'yrs' },
];

function getSplit(feature, threshold) {
  const left  = DATASET.filter(d => d[feature] >= threshold);
  const right = DATASET.filter(d => d[feature] <  threshold);
  const countOf = arr => LABELS.map(l => arr.filter(d => d.label === l).length);
  const lc = countOf(left),  rc = countOf(right);
  const parentCounts = countOf(DATASET);

  const parentG = gini(parentCounts, DATASET.length);
  const parentE = entropy(parentCounts, DATASET.length);

  const childG = weightedImpurity(gini,    { counts: lc, total: left.length  }, { counts: rc, total: right.length });
  const childE = weightedImpurity(entropy, { counts: lc, total: left.length  }, { counts: rc, total: right.length });

  return {
    left,  right,
    lc, rc,
    giniParent:   parentG,
    giniChild:    childG,
    gainGini:     parentG - childG,
    entropyParent: parentE,
    entropyChild:  childE,
    gainEntropy:  parentE - childE,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid #ffffff10',
      background: '#0f0f1a',
      padding: '1rem',
      ...style,
    }}>{children}</div>
  );
}

function Label({ children, style = {} }) {
  return (
    <p style={{
      fontFamily: '"Courier New", monospace',
      fontSize: '0.58rem',
      color: '#6b7280',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      margin: '0 0 0.5rem 0',
      ...style,
    }}>{children}</p>
  );
}

function Bar({ value, max = 1, color, label, pct }) {
  const w = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontFamily: '"Courier New", monospace', fontSize: '0.6rem', color: '#9ca3af' }}>{label}</span>
        <span style={{ fontFamily: '"Courier New", monospace', fontSize: '0.6rem', color }}>{pct ?? value.toFixed(4)}</span>
      </div>
      <div style={{ height: 6, background: '#ffffff0a', borderRadius: 3 }}>
        <div style={{
          height: '100%', width: `${w}%`, background: color,
          borderRadius: 3, transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

function GainMeter({ value, max = 1, color, label }) {
  const pct = Math.min((value / max) * 100, 100);
  const [animated, setAnimated] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const end   = pct;
    const dur   = 400;
    const t0    = Date.now();
    const tick  = () => {
      const elapsed = Date.now() - t0;
      const progress = Math.min(elapsed / dur, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimated(start + (end - start) * ease);
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = end;
    };
    requestAnimationFrame(tick);
  }, [pct]);

  return (
    <div style={{
      borderRadius: 10,
      border: `1px solid ${color}30`,
      background: `${color}08`,
      padding: '0.85rem',
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: '"Courier New", monospace',
        fontSize: '0.58rem', color: '#6b7280',
        letterSpacing: '0.1em', margin: '0 0 0.4rem',
      }}>{label}</p>
      <p style={{
        fontFamily: '"Courier New", monospace',
        fontSize: '1.4rem', fontWeight: 800,
        color, margin: '0 0 0.5rem',
      }}>{value.toFixed(4)}</p>
      <div style={{ height: 6, background: '#ffffff0a', borderRadius: 3 }}>
        <div style={{
          height: '100%', width: `${animated}%`,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          borderRadius: 3, transition: 'width 0.05s',
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
      <p style={{
        fontFamily: '"Courier New", monospace',
        fontSize: '0.55rem', color: '#6b7280',
        margin: '0.35rem 0 0',
      }}>
        {value > 0.15 ? '🔥 Excellent split' : value > 0.05 ? '✓ Decent split' : '✗ Poor split'}
      </p>
    </div>
  );
}

function SplitGroup({ title, data, counts, side }) {
  const borderColor = side === 'left' ? '#7c3aed' : '#00f5a0';
  return (
    <div style={{
      borderRadius: 8,
      border: `1px solid ${borderColor}30`,
      background: `${borderColor}06`,
      padding: '0.7rem',
      flex: 1,
    }}>
      <p style={{
        fontFamily: '"Courier New", monospace', fontSize: '0.58rem',
        color: borderColor, margin: '0 0 0.5rem', letterSpacing: '0.08em',
      }}>{title} ({data.length})</p>
      {LABELS.map((l, i) => (
        <div key={l} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: L_COLORS[l], flexShrink: 0 }} />
          <span style={{ fontFamily: '"Courier New", monospace', fontSize: '0.58rem', color: '#9ca3af', flex: 1 }}>{l}</span>
          <span style={{ fontFamily: '"Courier New", monospace', fontSize: '0.58rem', color: L_COLORS[l] }}>
            {counts[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Algorithm() {
  const [feature,   setFeature]   = useState('glucose');
  const [threshold, setThreshold] = useState(135);
  const [activeTab, setActiveTab] = useState('both'); // 'gini' | 'entropy' | 'both'

  const feat   = FEATURES.find(f => f.key === feature);
  const split  = getSplit(feature, threshold);

  const showGini    = activeTab !== 'entropy';
  const showEntropy = activeTab !== 'gini';

  return (
    <div style={{
      maxWidth: 580,
      margin: '0 auto',
      padding: '1.4rem 1.2rem 3rem',
      fontFamily: '"Courier New", monospace',
    }}>

      {/* ── INTRO BANNER ── */}
      <Card style={{
        marginBottom: '1.2rem',
        background: 'linear-gradient(135deg, #13131a, #0d1a10)',
        border: '1px solid #ffffff12',
        position: 'relative', overflow: 'hidden',
        animation: 'fadeUp 0.5s ease both',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 16, bottom: 16, width: 3,
          background: 'linear-gradient(180deg, #7c3aed, #00f5a0)',
          borderRadius: '0 2px 2px 0',
        }} />
        <div style={{ paddingLeft: '0.9rem' }}>
          <p style={{ fontSize: '0.72rem', color: '#c8cad8', lineHeight: 1.7, margin: 0 }}>
            Decision trees pick splits by measuring <span style={{ color: '#7c3aed', fontWeight: 700 }}>Gini Impurity</span> and{' '}
            <span style={{ color: '#00f5a0', fontWeight: 700 }}>Information Gain (Entropy)</span>.
            Both score how "pure" the resulting groups are — lower impurity = better split.
            Adjust the feature and threshold below to see both metrics update live.
          </p>
        </div>
      </Card>

      {/* ── CONTROLS ── */}
      <Card style={{ marginBottom: '1.2rem', animation: 'fadeUp 0.5s ease 0.06s both' }}>
        <Label>Feature & Threshold</Label>

        {/* Feature tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.9rem' }}>
          {FEATURES.map(f => (
            <button key={f.key} onClick={() => {
              setFeature(f.key);
              setThreshold(Math.round((f.min + f.max) / 2));
            }} style={{
              flex: 1,
              fontFamily: '"Courier New", monospace',
              fontSize: '0.62rem',
              padding: '0.3rem 0.5rem',
              borderRadius: 6,
              border: `1px solid ${feature === f.key ? '#00f5a0' : '#ffffff15'}`,
              background: feature === f.key ? '#00f5a015' : 'transparent',
              color: feature === f.key ? '#00f5a0' : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Threshold slider */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>
            {feat.label} ≥ <span style={{ color: '#e0e0f0', fontWeight: 700 }}>{threshold}{feat.unit}</span>
          </span>
          <span style={{ fontSize: '0.6rem', color: '#6b7280' }}>
            {split.left.length}L / {split.right.length}R
          </span>
        </div>
        <input type="range"
          min={feat.min} max={feat.max} step={feat.step} value={threshold}
          onChange={e => setThreshold(+e.target.value)}
          style={{ width: '100%', accentColor: '#00f5a0', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.55rem', color: '#4b5563' }}>{feat.min}{feat.unit}</span>
          <span style={{ fontSize: '0.55rem', color: '#4b5563' }}>{feat.max}{feat.unit}</span>
        </div>

        {/* Split preview */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
          <SplitGroup title={`≥ ${threshold}${feat.unit}`} data={split.left}  counts={split.lc} side="left" />
          <SplitGroup title={`< ${threshold}${feat.unit}`} data={split.right} counts={split.rc} side="right" />
        </div>
      </Card>

      {/* ── VIEW TOGGLE ── */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.2rem', animation: 'fadeUp 0.5s ease 0.1s both' }}>
        {[['both', 'Both'], ['gini', 'Gini Only'], ['entropy', 'Entropy Only']].map(([v, l]) => (
          <button key={v} onClick={() => setActiveTab(v)} style={{
            flex: 1, fontFamily: '"Courier New", monospace', fontSize: '0.6rem',
            padding: '0.35rem', borderRadius: 6,
            border: `1px solid ${activeTab === v ? '#ffffff40' : '#ffffff10'}`,
            background: activeTab === v ? '#ffffff0e' : 'transparent',
            color: activeTab === v ? '#e0e0f0' : '#6b7280',
            cursor: 'pointer', transition: 'all 0.2s',
          }}>{l}</button>
        ))}
      </div>

      {/* ── METRICS SIDE BY SIDE ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showGini && showEntropy ? '1fr 1fr' : '1fr',
        gap: '1rem',
        marginBottom: '1.2rem',
        animation: 'fadeUp 0.5s ease 0.14s both',
      }}>

        {/* GINI */}
        {showGini && (
          <Card style={{ borderColor: '#7c3aed30' }}>
            <Label style={{ color: '#7c3aed' }}>Gini Impurity</Label>

            <div style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '0.6rem', color: '#6b7280',
              background: '#0c0c14', borderRadius: 6,
              padding: '0.5rem 0.65rem', marginBottom: '0.75rem',
              lineHeight: 1.8,
              border: '1px solid #7c3aed20',
            }}>
              <span style={{ color: '#7c3aed' }}>Gini</span> = 1 − Σ(pᵢ²)<br/>
              <span style={{ color: '#4b5563' }}>Range: 0 (pure) → 0.67 (max)</span>
            </div>

            <Bar label="Parent Gini"   value={split.giniParent} color="#7c3aed" max={0.7} />
            <Bar label="Weighted Child" value={split.giniChild}  color="#9f67ff" max={0.7} />

            <div style={{ height: 1, background: '#ffffff08', margin: '0.6rem 0' }} />
            <GainMeter
              value={split.gainGini}
              max={0.5}
              color="#7c3aed"
              label="Gini Gain (parent − child)"
            />

            <p style={{
              fontSize: '0.6rem', color: '#6b7280',
              lineHeight: 1.65, margin: '0.6rem 0 0',
            }}>
              Used by <span style={{ color: '#7c3aed' }}>CART</span> algorithm.
              Measures probability of misclassifying a randomly chosen element.
              Fast to compute — no logarithms.
            </p>
          </Card>
        )}

        {/* ENTROPY */}
        {showEntropy && (
          <Card style={{ borderColor: '#00f5a030' }}>
            <Label style={{ color: '#00f5a0' }}>Information Gain</Label>

            <div style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '0.6rem', color: '#6b7280',
              background: '#0c0c14', borderRadius: 6,
              padding: '0.5rem 0.65rem', marginBottom: '0.75rem',
              lineHeight: 1.8,
              border: '1px solid #00f5a020',
            }}>
              <span style={{ color: '#00f5a0' }}>H</span> = −Σ(p·log₂p)<br/>
              <span style={{ color: '#4b5563' }}>Range: 0 (pure) → log₂k (max)</span>
            </div>

            <Bar label="Parent Entropy"  value={split.entropyParent} color="#00f5a0" max={1.6} />
            <Bar label="Weighted Child"  value={split.entropyChild}  color="#00c97a" max={1.6} />

            <div style={{ height: 1, background: '#ffffff08', margin: '0.6rem 0' }} />
            <GainMeter
              value={split.gainEntropy}
              max={1.0}
              color="#00f5a0"
              label="Info Gain (parent − child)"
            />

            <p style={{
              fontSize: '0.6rem', color: '#6b7280',
              lineHeight: 1.65, margin: '0.6rem 0 0',
            }}>
              Used by <span style={{ color: '#00f5a0' }}>ID3 / C4.5</span> algorithms.
              Based on Shannon entropy from information theory.
              More sensitive to class distribution changes.
            </p>
          </Card>
        )}
      </div>

      {/* ── COMPARISON TABLE ── */}
      {activeTab === 'both' && (
        <Card style={{ marginBottom: '1.2rem', animation: 'fadeUp 0.5s ease 0.18s both' }}>
          <Label>Side-by-Side Comparison</Label>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.62rem' }}>
            <thead>
              <tr>
                {['', 'Gini Impurity', 'Info Gain (Entropy)'].map((h, i) => (
                  <th key={i} style={{
                    padding: '0.4rem 0.5rem',
                    textAlign: i === 0 ? 'left' : 'center',
                    color: i === 1 ? '#7c3aed' : i === 2 ? '#00f5a0' : '#6b7280',
                    fontFamily: '"Courier New", monospace',
                    borderBottom: '1px solid #ffffff10',
                    fontWeight: 700,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Algorithm',  'CART',           'ID3, C4.5'],
                ['Formula',    '1 − Σpᵢ²',       '−Σ pᵢ log₂pᵢ'],
                ['Max value',  '0.5 (binary)',    '1.0 (binary)'],
                ['Speed',      'Faster',          'Slower (log)'],
                ['Sensitivity','Less sensitive',  'More sensitive'],
                ['Parent',     split.giniParent.toFixed(4), split.entropyParent.toFixed(4)],
                ['After split',split.giniChild.toFixed(4),  split.entropyChild.toFixed(4)],
                ['Gain ↑',     split.gainGini.toFixed(4),   split.gainEntropy.toFixed(4)],
              ].map(([rowLabel, giniVal, entVal], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff03' : 'transparent' }}>
                  <td style={{ padding: '0.38rem 0.5rem', color: '#6b7280', fontFamily: '"Courier New", monospace' }}>
                    {rowLabel}
                  </td>
                  <td style={{ padding: '0.38rem 0.5rem', color: '#9f67ff', textAlign: 'center', fontFamily: '"Courier New", monospace' }}>
                    {giniVal}
                  </td>
                  <td style={{ padding: '0.38rem 0.5rem', color: '#00c97a', textAlign: 'center', fontFamily: '"Courier New", monospace' }}>
                    {entVal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── WINNER BADGE ── */}
      <Card style={{ animation: 'fadeUp 0.5s ease 0.22s both', textAlign: 'center' }}>
        <Label style={{ textAlign: 'center' }}>Best Split for Current Settings</Label>
        {split.gainGini === 0 && split.gainEntropy === 0 ? (
          <p style={{ fontSize: '0.7rem', color: '#ef4444' }}>
            ✗ This split gives zero gain — try adjusting the threshold.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: '#7c3aed15', border: '1px solid #7c3aed40',
                borderRadius: 8, padding: '0.5rem 0.9rem',
              }}>
                <span style={{ fontSize: '0.62rem', color: '#7c3aed' }}>Gini Gain</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#9f67ff' }}>{split.gainGini.toFixed(4)}</span>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: '#00f5a015', border: '1px solid #00f5a040',
                borderRadius: 8, padding: '0.5rem 0.9rem',
              }}>
                <span style={{ fontSize: '0.62rem', color: '#00f5a0' }}>Info Gain</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#00c97a' }}>{split.gainEntropy.toFixed(4)}</span>
              </div>
            </div>
            <p style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.6rem' }}>
              {split.gainGini > 0.1 && split.gainEntropy > 0.1
                ? `Both metrics agree — ${feat.label} ≥ ${threshold}${feat.unit} is a strong split!`
                : `Moderate split. Try different thresholds to find the optimal cut.`}
            </p>
          </>
        )}
      </Card>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}