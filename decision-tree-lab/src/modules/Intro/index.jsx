import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const nodes = [
  { id: 1, label: 'Glucose > 140?', x: 50,  y: 6,  type: 'decision' },
  { id: 2, label: 'BMI > 30?',      x: 22,  y: 36, type: 'decision' },
  { id: 3, label: 'Age > 45?',      x: 78,  y: 36, type: 'decision' },
  { id: 4, label: 'High Risk',      x: 9,   y: 66, type: 'leaf-high' },
  { id: 5, label: 'Med Risk',       x: 36,  y: 66, type: 'leaf-med'  },
  { id: 6, label: 'Med Risk',       x: 64,  y: 66, type: 'leaf-med'  },
  { id: 7, label: 'Low Risk',       x: 91,  y: 66, type: 'leaf-low'  },
];

const edges = [
  { from: 1, to: 2, label: 'YES' },
  { from: 1, to: 3, label: 'NO'  },
  { from: 2, to: 4, label: 'YES' },
  { from: 2, to: 5, label: 'NO'  },
  { from: 3, to: 6, label: 'YES' },
  { from: 3, to: 7, label: 'NO'  },
];

const NODE_STYLES = {
  decision:    { bg: '#0e1f18', border: '#00f5a0', color: '#00f5a0' },
  'leaf-high': { bg: '#1f0e0e', border: '#ef4444', color: '#ef4444' },
  'leaf-med':  { bg: '#1f180a', border: '#f59e0b', color: '#f59e0b' },
  'leaf-low':  { bg: '#0a1f14', border: '#00f5a0', color: '#00f5a0' },
};

const concepts = [
  {
    icon: '◉',
    color: '#7c3aed',
    title: 'Root Node',
    desc: 'The first decision point where the tree begins splitting the entire dataset.',
  },
  {
    icon: '◆',
    color: '#00f5a0',
    title: 'Internal Nodes',
    desc: 'Intermediate checks that split data further based on feature thresholds.',
  },
  {
    icon: '⟶',
    color: '#f59e0b',
    title: 'Branches',
    desc: 'YES / NO paths leading out from each decision node to the next level.',
  },
  {
    icon: '▪',
    color: '#ef4444',
    title: 'Leaf Nodes',
    desc: 'Terminal nodes that output the final class prediction or value.',
  },
];

export default function Intro() {
  const [visibleNodes,   setVisibleNodes]   = useState([]);
  const [visibleEdges,   setVisibleEdges]   = useState([]);
  const [pulse,          setPulse]          = useState(false);
  const [shownConcepts,  setShownConcepts]  = useState([]);
  const timersRef = useRef([]);
  const navigate  = useNavigate();

  const runTreeAnimation = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    setVisibleNodes([]);
    setVisibleEdges([]);
    nodes.forEach((n, i) => {
      const t = setTimeout(() => setVisibleNodes(v => [...v, n.id]), i * 260 + 300);
      timersRef.current.push(t);
    });
    edges.forEach((_, i) => {
      const t = setTimeout(() => setVisibleEdges(v => [...v, i]), i * 260 + 560);
      timersRef.current.push(t);
    });
  };

  useEffect(() => {
    concepts.forEach((_, i) =>
      setTimeout(() => setShownConcepts(v => [...v, i]), i * 140 + 200)
    );
    runTreeAnimation();
    const loopId  = setInterval(runTreeAnimation, 5400);
    const pulseId = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 700);
    }, 2800);
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      clearInterval(loopId);
      clearInterval(pulseId);
    };
  }, []);

  const getNode = id => nodes.find(n => n.id === id);

  return (
    <div style={{
      maxWidth: 560,
      margin: '0 auto',
      padding: '1.4rem 1.4rem 3rem',
      // header now lives in App.jsx Layout
      minHeight: '100vh',
    }}>

      {/* ── WHAT IS A DECISION TREE ── */}
      <SectionLabel>What is a Decision Tree?</SectionLabel>
      <div style={{
        borderRadius: 14,
        border: '1px solid #ffffff12',
        background: 'linear-gradient(135deg, #13131a 0%, #0d1a10 100%)',
        padding: '1.1rem 1.2rem 1.1rem 1.5rem',
        marginBottom: '1.4rem',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeUp 0.6s ease 0.05s both',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage:
            'linear-gradient(#00f5a0 1px,transparent 1px),' +
            'linear-gradient(90deg,#00f5a0 1px,transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', left: 0, top: 20, bottom: 20,
          width: 3,
          background: 'linear-gradient(180deg, #7c3aed, #00f5a0)',
          borderRadius: '0 2px 2px 0',
        }} />
        <p style={{ fontSize: '0.73rem', color: '#c8cad8', lineHeight: 1.72, marginBottom: '0.65rem', fontFamily: 'Georgia, serif' }}>
          A decision tree is a{' '}
          <Hl>supervised machine learning model</Hl>{' '}
          that makes predictions by splitting data through a sequence of{' '}
          <Hl>if–else conditions</Hl>{' '}
          — like a flowchart your computer can learn from data.
        </p>
        <p style={{ fontSize: '0.73rem', color: '#c8cad8', lineHeight: 1.72, marginBottom: '0.65rem', fontFamily: 'Georgia, serif' }}>
          Starting from a{' '}
          <span style={{ color: '#7c3aed', fontWeight: 600 }}>root node</span>,
          the tree evaluates one feature at a time, branching left or right
          based on the answer, until it reaches a{' '}
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>leaf node</span>{' '}
          — the final prediction.
        </p>
        <p style={{ fontSize: '0.73rem', color: '#c8cad8', lineHeight: 1.72, margin: 0, fontFamily: 'Georgia, serif' }}>
          Unlike neural networks, every decision is{' '}
          <Hl>fully visible and traceable</Hl>{' '}
          — making decision trees one of the most trusted models in explainable AI.
        </p>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #00f5a050, transparent)',
        }} />
      </div>
      {/* ── LIVE TREE ── */}
      <SectionLabel>Live Tree Simulation</SectionLabel>
      <div style={{
        borderRadius: 14,
        border: '1px solid #ffffff0e',
        background: '#0c0c14',
        padding: '1rem 1rem 1.3rem',
        marginBottom: '1.4rem',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeUp 0.6s ease 0.3s both',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.02,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #00f5a0 3px, #00f5a0 4px)',
        }} />
        <div style={{ position: 'relative', height: 195 }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {edges.map((e, i) => {
              if (!visibleEdges.includes(i)) return null;
              const from = getNode(e.from);
              const to   = getNode(e.to);
              return (
                <g key={i}>
                  <line
                    x1={`${from.x}%`} y1={`${from.y + 10}%`}
                    x2={`${to.x}%`}   y2={`${to.y}%`}
                    stroke="#00f5a022"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                  />
                  <text
                    x={`${(from.x + to.x) / 2}%`}
                    y={`${(from.y + to.y) / 2 + 3.5}%`}
                    fill="#7c3aed"
                    fontSize="9"
                    textAnchor="middle"
                    fontFamily='"Courier New", monospace'
                    fontWeight="700"
                  >
                    {e.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {nodes.map(n => {
            const c      = NODE_STYLES[n.type];
            const isRoot = n.id === 1;
            const show   = visibleNodes.includes(n.id);
            return (
              <div key={n.id} style={{
                position: 'absolute',
                left: `${n.x}%`,
                top:  `${n.y}%`,
                transform: `translateX(-50%) scale(${show ? (isRoot && pulse ? 1.1 : 1) : 0.6})`,
                background: c.bg,
                border: `1.5px solid ${c.border}`,
                color: c.color,
                borderRadius: 8,
                padding: '3px 8px',
                fontSize: '0.56rem',
                fontFamily: '"Courier New", monospace',
                whiteSpace: 'nowrap',
                opacity: show ? 1 : 0,
                transition: 'opacity 0.45s ease, transform 0.35s ease',
                boxShadow: isRoot && pulse
                  ? `0 0 20px ${c.border}70`
                  : `0 0 8px ${c.border}28`,
              }}>
                {n.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── KEY CONCEPTS 2×2 ── */}
      <SectionLabel>Key Concepts</SectionLabel>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.65rem',
        marginBottom: '1.4rem',
      }}>
        {concepts.map((c, i) => (
          <ConceptCard
            key={i}
            concept={c}
            visible={shownConcepts.includes(i)}
            delay={i * 0.07}
          />
        ))}
      </div>

      

      {/* ── REAL USES BANNER ── */}
      <div style={{
        borderRadius: 10,
        border: '1px solid #00f5a022',
        background: '#0d1a10',
        padding: '0.75rem 1rem',
        marginBottom: '1.4rem',
        animation: 'fadeUp 0.6s ease 0.4s both',
      }}>
        <p style={{
          fontSize: '0.7rem',
          color: '#9ca3af',
          lineHeight: 1.7,
          margin: 0,
          fontFamily: 'Georgia, serif',
        }}>
          <span style={{ color: '#00f5a0', fontWeight: 700, fontFamily: '"Courier New", monospace' }}>
            Real uses:{' '}
          </span>
          medical diagnosis, credit scoring, fraud detection, customer churn prediction,
          and clinical decision support.
        </p>
      </div>

      {/* ── CTA ── */}
      <button
        onClick={() => navigate('/builder')}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '0.72rem',
          fontFamily: '"Courier New", monospace',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: '#080c0a',
          background: 'linear-gradient(135deg, #00f5a0, #00c97a)',
          border: 'none',
          borderRadius: 10,
          cursor: 'pointer',
          animation: 'fadeUp 0.6s ease 0.5s both',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.opacity = '0.88';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        START EXPLORING →
      </button>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatUp {
          0%   { transform: translateY(0);     opacity: 0.6; }
          100% { transform: translateY(-36px); opacity: 0;   }
        }
      `}</style>
    </div>
  );
}

/* ── Concept Card ── */
function ConceptCard({ concept: c, visible, delay }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        border: `1px solid ${hovered ? c.color + '65' : c.color + '22'}`,
        background: hovered
          ? `linear-gradient(135deg, ${c.color}12, ${c.color}06)`
          : '#0f0f18',
        padding: '0.9rem 0.85rem',
        cursor: 'default',
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered ? 'translateY(-4px) scale(1.015)' : 'translateY(0) scale(1)'
          : 'translateY(14px) scale(0.92)',
        transition: `opacity 0.4s ease ${delay}s, transform 0.3s ease, border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease`,
        boxShadow: hovered ? `0 10px 30px ${c.color}20` : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* corner glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: hovered ? 52 : 24,
        height: hovered ? 52 : 24,
        background: `radial-gradient(circle at top right, ${c.color}38, transparent 70%)`,
        transition: 'all 0.35s ease',
        borderRadius: '0 12px 0 0',
        pointerEvents: 'none',
      }} />

      {/* particles */}
      {hovered && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(5)].map((_, p) => (
            <div key={p} style={{
              position: 'absolute',
              width: 3, height: 3,
              borderRadius: '50%',
              background: c.color,
              opacity: 0.55,
              left: `${12 + p * 18}%`,
              top: '85%',
              animation: `floatUp 1.1s ease ${p * 0.18}s infinite`,
            }} />
          ))}
        </div>
      )}

      <span style={{
        display: 'block',
        fontSize: '1.1rem',
        color: c.color,
        marginBottom: '0.4rem',
        transition: 'transform 0.25s ease',
        transform: hovered ? 'scale(1.2) rotate(-6deg)' : 'scale(1)',
        fontFamily: '"Courier New", monospace',
      }}>{c.icon}</span>

      <p style={{
        fontFamily: '"Courier New", monospace',
        fontSize: '0.65rem',
        fontWeight: 700,
        color: c.color,
        marginBottom: '0.35rem',
        letterSpacing: '0.02em',
        margin: '0 0 0.35rem 0',
      }}>{c.title}</p>

      <p style={{
        fontSize: '0.67rem',
        color: '#9ca3af',
        lineHeight: 1.55,
        margin: 0,
        fontFamily: 'Georgia, serif',
      }}>{c.desc}</p>
    </div>
  );
}

/* ── Helpers ── */
function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: '"Courier New", monospace',
      fontSize: '0.6rem',
      color: '#6b7280',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginBottom: '0.65rem',
      margin: '0 0 0.65rem 0',
    }}>{children}</p>
  );
}

function Hl({ children }) {
  return <span style={{ color: '#00f5a0', fontWeight: 600 }}>{children}</span>;
}