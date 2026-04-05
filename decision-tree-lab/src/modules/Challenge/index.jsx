import { useState, useEffect, useRef, useCallback } from 'react';

// ── Palette ───────────────────────────────────────────────────────────────────
const RC    = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
const RC_BG = { high: '#ef444412', medium: '#f59e0b12', low: '#10b98112' };

// ── Cases ─────────────────────────────────────────────────────────────────────
const CASES = [
  { age: 52, bmi: 34, glucose: 150, risk: 'high',
    path: [{ c: 'Glucose > 140', v: 150, r: true  }, { c: 'BMI > 30',  v: 34, r: true  }, { pred: 'High Risk'   }] },
  { age: 29, bmi: 22, glucose: 95,  risk: 'low',
    path: [{ c: 'Glucose > 140', v: 95,  r: false }, { c: 'Age > 45',  v: 29, r: false }, { pred: 'Low Risk'    }] },
  { age: 61, bmi: 31, glucose: 145, risk: 'high',
    path: [{ c: 'Glucose > 140', v: 145, r: true  }, { c: 'Age > 50',  v: 61, r: true  }, { pred: 'High Risk'   }] },
  { age: 38, bmi: 27, glucose: 110, risk: 'medium',
    path: [{ c: 'Glucose > 140', v: 110, r: false }, { c: 'BMI > 25',  v: 27, r: true  }, { c: 'Age > 35', v: 38, r: true }, { pred: 'Medium Risk' }] },
  { age: 55, bmi: 35, glucose: 160, risk: 'high',
    path: [{ c: 'Glucose > 140', v: 160, r: true  }, { c: 'BMI > 30',  v: 35, r: true  }, { pred: 'High Risk'   }] },
  { age: 24, bmi: 20, glucose: 88,  risk: 'low',
    path: [{ c: 'Glucose > 140', v: 88,  r: false }, { c: 'Age > 45',  v: 24, r: false }, { pred: 'Low Risk'    }] },
  { age: 47, bmi: 29, glucose: 135, risk: 'medium',
    path: [{ c: 'Glucose > 140', v: 135, r: false }, { c: 'BMI > 25',  v: 29, r: true  }, { c: 'Age > 45', v: 47, r: true }, { pred: 'Medium Risk' }] },
  { age: 67, bmi: 38, glucose: 175, risk: 'high',
    path: [{ c: 'Glucose > 140', v: 175, r: true  }, { c: 'BMI > 30',  v: 38, r: true  }, { pred: 'High Risk'   }] },
];

const DIFF = {
  high:   { label: 'Hard',   bg: '#ef444420', color: '#ef4444' },
  medium: { label: 'Tricky', bg: '#f59e0b20', color: '#f59e0b' },
  low:    { label: 'Easy',   bg: '#10b98120', color: '#10b981' },
};

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// ── Full decision tree (for live SVG simulation) ──────────────────────────────
//   Glucose > 140?
//     YES → BMI > 30?
//             YES → High
//             NO  → Age > 50?  YES → High    NO → Medium
//     NO  → BMI > 25?
//             YES → Age > 35?  YES → Medium  NO → Low
//             NO  → Low
const FULL_TREE = {
  id: 'root', condition: 'Glucose > 140', feature: 'glucose', threshold: 140,
  yes: {
    id: 'g-yes', condition: 'BMI > 30', feature: 'bmi', threshold: 30,
    yes: { id: 'g-bmi-yes',     leaf: true, risk: 'high',   label: 'High Risk'   },
    no:  {
      id: 'g-bmi-no', condition: 'Age > 50', feature: 'age', threshold: 50,
      yes: { id: 'g-bmi-age-yes', leaf: true, risk: 'high',   label: 'High Risk'   },
      no:  { id: 'g-bmi-age-no',  leaf: true, risk: 'medium', label: 'Medium Risk' },
    },
  },
  no: {
    id: 'g-no', condition: 'BMI > 25', feature: 'bmi', threshold: 25,
    yes: {
      id: 'g-bmi25', condition: 'Age > 35', feature: 'age', threshold: 35,
      yes: { id: 'g-bmi25-age-yes', leaf: true, risk: 'medium', label: 'Medium Risk' },
      no:  { id: 'g-bmi25-age-no',  leaf: true, risk: 'low',    label: 'Low Risk'    },
    },
    no: { id: 'g-no-bmi-no', leaf: true, risk: 'low', label: 'Low Risk' },
  },
};

// Walk tree for a patient → ordered list of visited node IDs
function walkTree(tree, patient) {
  const visited = [];
  let node = tree;
  while (node) {
    visited.push(node.id);
    if (node.leaf) break;
    node = patient[node.feature] > node.threshold ? node.yes : node.no;
  }
  return visited;
}

// Assign (cx, depth) to every node via recursive layout
function layoutTree(node, depth = 0, left = 0, right = 1) {
  const cx = (left + right) / 2;
  const result = { ...node, cx, depth };
  if (!node.leaf) {
    result.yes = layoutTree(node.yes, depth + 1, left, cx);
    result.no  = layoutTree(node.no,  depth + 1, cx,   right);
  }
  return result;
}

function flatNodes(node, acc = []) {
  acc.push(node);
  if (!node.leaf) { flatNodes(node.yes, acc); flatNodes(node.no, acc); }
  return acc;
}

function flatEdges(node, acc = []) {
  if (!node.leaf) {
    acc.push({ from: node, to: node.yes, branch: 'yes' });
    acc.push({ from: node, to: node.no,  branch: 'no'  });
    flatEdges(node.yes, acc);
    flatEdges(node.no,  acc);
  }
  return acc;
}

const LAID_TREE = layoutTree(FULL_TREE);
const ALL_NODES = flatNodes(LAID_TREE);
const ALL_EDGES = flatEdges(LAID_TREE);
const MAX_DEPTH = Math.max(...ALL_NODES.map(n => n.depth));

// ── LiveTree SVG ──────────────────────────────────────────────────────────────
function LiveTree({ patient, treeAnimating, visitedIds }) {
  const SVG_W  = 540;
  const NODE_H = 34;
  const YGAP   = 72;
  const SVG_H  = (MAX_DEPTH + 1) * YGAP + NODE_H + 20;
  const nodeX  = n => n.cx * SVG_W;
  const nodeY  = n => n.depth * YGAP + 24;

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width={SVG_W} height={SVG_H}
        style={{ display: 'block', minWidth: SVG_W, fontFamily: "'DM Mono', monospace" }}
      >
        {/* Edges */}
        {ALL_EDGES.map(({ from, to, branch }, i) => {
          const isActive  = visitedIds.includes(from.id) && visitedIds.includes(to.id);
          const fromX = nodeX(from), fromY = nodeY(from) + NODE_H / 2;
          const toX   = nodeX(to),   toY   = nodeY(to)   - NODE_H / 2;
          const midY  = (fromY + toY) / 2;
          const edgeColor = branch === 'yes' ? RC.high : RC.low;
          return (
            <g key={i}>
              <path
                d={`M${fromX},${fromY} C${fromX},${midY} ${toX},${midY} ${toX},${toY}`}
                fill="none"
                stroke={isActive ? edgeColor : '#ffffff12'}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? 'none' : '4 3'}
                style={{ transition: 'stroke .4s, stroke-width .4s' }}
              />
              <text
                x={(fromX + toX) / 2 + (branch === 'yes' ? -13 : 13)}
                y={(fromY + toY) / 2}
                textAnchor="middle"
                fill={isActive ? edgeColor : '#ffffff20'}
                fontSize={9}
                fontFamily="'DM Mono', monospace"
                style={{ transition: 'fill .4s' }}
              >
                {branch === 'yes' ? 'YES' : 'NO'}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {ALL_NODES.map(node => {
          const nx = nodeX(node), ny = nodeY(node);
          const isVisited = visitedIds.includes(node.id);
          const isCurrent = visitedIds.length > 0 && visitedIds[visitedIds.length - 1] === node.id;
          const nodeW     = node.leaf ? 90 : 124;

          let fill = '#0c0c1a', stroke = '#ffffff14', txtColor = '#ffffff40', subColor = '#ffffff25';
          if (isVisited) {
            if (node.leaf) {
              fill = RC_BG[node.risk]; stroke = RC[node.risk] + '80'; txtColor = RC[node.risk];
            } else {
              fill = '#1a1030'; stroke = '#7c3aed80'; txtColor = '#c4b5fd'; subColor = '#7c3aed';
            }
          }

          return (
            <g key={node.id}>
              {isCurrent && (
                <ellipse
                  cx={nx} cy={ny}
                  rx={nodeW / 2 + 12} ry={NODE_H / 2 + 9}
                  fill={node.leaf ? RC[node.risk] + '18' : '#7c3aed18'}
                  style={{ animation: 'treePulse 1s ease infinite' }}
                />
              )}
              <rect
                x={nx - nodeW / 2} y={ny - NODE_H / 2}
                width={nodeW} height={NODE_H}
                rx={node.leaf ? 17 : 6}
                fill={fill} stroke={stroke}
                strokeWidth={isVisited ? 1.5 : 1}
                style={{ transition: 'fill .4s, stroke .4s' }}
              />
              <text
                x={nx} y={ny + (node.leaf ? 5 : 3)}
                textAnchor="middle"
                fill={txtColor} fontSize={node.leaf ? 9 : 8}
                fontWeight={node.leaf ? '700' : '400'}
                fontFamily="'DM Mono', monospace"
                style={{ transition: 'fill .4s' }}
              >
                {node.leaf ? node.label : node.condition}
              </text>
              {!node.leaf && patient && (
                <text
                  x={nx} y={ny + 14}
                  textAnchor="middle"
                  fill={subColor} fontSize={7}
                  fontFamily="'DM Mono', monospace"
                  style={{ transition: 'fill .4s' }}
                >
                  {`val: ${patient[node.feature]}`}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Scoreboard ────────────────────────────────────────────────────────────────
function Scoreboard({ humanW, played, streak }) {
  const hp = played ? Math.round(humanW / played * 100) : 0;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1,
      background: '#ffffff08', borderRadius: 12, overflow: 'hidden',
      border: '0.5px solid #ffffff0a', marginBottom: '1rem',
    }}>
      {[
        { label: 'You',    value: hp + '%', sub: `${humanW} correct`,                       color: '#a78bfa', bar: hp   },
        { label: 'Played', value: played,   sub: streak >= 2 ? `🔥 ${streak} streak` : '—', color: '#e5e7eb', bar: null },
        { label: 'AI',     value: '100%',   sub: 'always correct',                           color: '#10b981', bar: 100  },
      ].map(({ label, value, sub, color, bar }) => (
        <div key={label} style={{ background: '#0b0b1a', padding: '.75rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: 10, letterSpacing: '.1em', color: '#4b5563', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>{label}</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
          {bar !== null && (
            <div style={{ height: 3, background: '#ffffff08', borderRadius: 2, margin: '5px 0 3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${bar}%`, background: color, borderRadius: 2, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
            </div>
          )}
          <div style={{ fontSize: 10, color: '#4b5563', marginTop: bar !== null ? 0 : 8, fontFamily: "'DM Mono', monospace" }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── PatientCard ───────────────────────────────────────────────────────────────
function PatientCard({ patient, caseIdx, total }) {
  const fields = [
    { label: 'Age',     key: 'age',     unit: 'yrs',   warn: v => v > 45,  caution: v => v > 35  },
    { label: 'BMI',     key: 'bmi',     unit: 'kg/m²', warn: v => v > 30,  caution: v => v > 25  },
    { label: 'Glucose', key: 'glucose', unit: 'mg/dL', warn: v => v > 140, caution: v => v > 110 },
  ];
  const hints = [];
  if (patient.age > 45)      hints.push('age above threshold');
  if (patient.bmi > 30)      hints.push('BMI elevated');
  if (patient.glucose > 140) hints.push('glucose critical');
  const diff = DIFF[patient.risk];

  return (
    <div style={{
      background: '#0b0b1a', border: '0.5px solid #ffffff0a',
      borderTop: '2.5px solid #7c3aed', borderRadius: 12,
      padding: '1rem', marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
        <span style={{ fontSize: 10, letterSpacing: '.12em', color: '#4b5563', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
          Case {caseIdx + 1} of {total}
        </span>
        <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, background: diff.bg, color: diff.color, fontFamily: "'DM Mono', monospace" }}>
          {diff.label}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem' }}>
        {fields.map(({ label, key, unit, warn, caution }) => {
          const v = patient[key];
          const color = warn(v) ? RC.high : caution(v) ? RC.medium : '#e5e7eb';
          return (
            <div key={key} style={{ background: '#06060f', borderRadius: 8, padding: '.6rem .5rem', textAlign: 'center', border: `0.5px solid ${color}25` }}>
              <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: "'DM Mono', monospace" }}>{label}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{v}</div>
              <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{unit}</div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: '.6rem', padding: '.45rem .7rem', borderRadius: 8,
        background: hints.length ? '#ef444410' : '#10b98110',
        border: `0.5px solid ${hints.length ? '#ef444430' : '#10b98130'}`,
        fontSize: 11, color: hints.length ? '#fca5a5' : '#6ee7b7',
        fontFamily: "'DM Mono', monospace",
      }}>
        {hints.length ? '⚠ ' + hints.join(' · ') : '✓ All vitals within normal range'}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AIvsHuman() {
  const [caseOrder,     setCaseOrder]     = useState(() => shuffle([...Array(CASES.length).keys()]));
  const [idx,           setIdx]           = useState(0);
  const [phase,         setPhase]         = useState('pick'); // 'pick' | 'result' | 'final'
  const [userPick,      setUserPick]      = useState(null);
  const [humanW,        setHumanW]        = useState(0);
  const [played,        setPlayed]        = useState(0);
  const [streak,        setStreak]        = useState(0);
  const [visitedIds,    setVisitedIds]    = useState([]);
  const [treeAnimating, setTreeAnimating] = useState(false);
  const [showTree,      setShowTree]      = useState(true);
  const animRef = useRef(null);

  const patient = CASES[caseOrder[idx]];

  // Reset tree state on new case
  useEffect(() => {
    setVisitedIds([]);
    setTreeAnimating(false);
    if (animRef.current) clearInterval(animRef.current);
  }, [idx]);

  const animatePath = useCallback((path) => {
    setTreeAnimating(true);
    setVisitedIds([]);
    let step = 0;
    animRef.current = setInterval(() => {
      step++;
      setVisitedIds(path.slice(0, step));
      if (step >= path.length) {
        clearInterval(animRef.current);
        setTreeAnimating(false);
      }
    }, 480);
  }, []);

  const handlePick = (pick) => {
    const correct   = pick === patient.risk;
    const newHuman  = humanW + (correct ? 1 : 0);
    const newPlayed = played + 1;
    const newStreak = correct ? streak + 1 : 0;
    setUserPick(pick);
    setHumanW(newHuman);
    setPlayed(newPlayed);
    setStreak(newStreak);
    setPhase(idx >= CASES.length - 1 ? 'final' : 'result');
    const path = walkTree(FULL_TREE, patient);
    setTimeout(() => animatePath(path), 200);
  };

  const handleNext = () => {
    if (animRef.current) clearInterval(animRef.current);
    setIdx(i => i + 1);
    setUserPick(null);
    setPhase('pick');
    setVisitedIds([]);
  };

  const handleRestart = () => {
    if (animRef.current) clearInterval(animRef.current);
    setCaseOrder(shuffle([...Array(CASES.length).keys()]));
    setIdx(0);
    setUserPick(null);
    setPhase('pick');
    setHumanW(0);
    setPlayed(0);
    setStreak(0);
    setVisitedIds([]);
  };

  const correct  = userPick === patient.risk;
  const finalPct = played ? Math.round(humanW / played * 100) : 0;

  return (
    <div style={{
      maxWidth: 600, margin: '0 auto', padding: '1.5rem 1rem 3rem',
      fontFamily: "'DM Mono', monospace",
      background: '#06060f', minHeight: '100vh', color: '#e5e7eb',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(.85);opacity:0}70%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
        @keyframes treePulse{0%,100%{opacity:.6}50%{opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .slide-up{animation:slideUp .35s ease both}
        .pop{animation:pop .42s cubic-bezier(.34,1.56,.64,1) both}
        .fade-in{animation:fadeIn .4s ease both}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.2em', color: '#2a2a45', textTransform: 'uppercase', marginBottom: 4 }}>
            Medical AI Challenge
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.2rem,4vw,1.55rem)', fontWeight: 800, color: '#f9fafb', lineHeight: 1.1 }}>
            AI vs Human
          </h1>
          <p style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
            Predict the risk before the AI decision tree reveals its answer
          </p>
        </div>
        <button
          onClick={() => setShowTree(t => !t)}
          style={{
            background: showTree ? '#7c3aed20' : '#ffffff08',
            border: `0.5px solid ${showTree ? '#7c3aed50' : '#ffffff15'}`,
            color: showTree ? '#a78bfa' : '#4b5563',
            borderRadius: 99, padding: '5px 14px', fontSize: 11,
            cursor: 'pointer', fontFamily: "'DM Mono', monospace",
            whiteSpace: 'nowrap', transition: 'all .2s',
          }}
        >
          {showTree ? '🌲 Tree on' : '🌲 Tree off'}
        </button>
      </div>

      <Scoreboard humanW={humanW} played={played} streak={streak} />
      <PatientCard patient={patient} caseIdx={idx} total={CASES.length} />

      {/* ── PICK PHASE ──────────────────────────────────────────────────────── */}
      {phase === 'pick' && (
        <div className="slide-up">
          <div style={{ fontSize: 10, letterSpacing: '.1em', color: '#4b5563', textTransform: 'uppercase', marginBottom: '.5rem' }}>
            Your prediction
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem', marginBottom: '1rem' }}>
            {[
              { label: 'Low Risk',  value: 'low',    color: RC.low    },
              { label: 'Med Risk',  value: 'medium', color: RC.medium },
              { label: 'High Risk', value: 'high',   color: RC.high   },
            ].map(({ label, value, color }) => (
              <button
                key={value}
                onClick={() => handlePick(value)}
                style={{
                  padding: '.8rem .5rem', borderRadius: 10,
                  border: `1.5px solid ${color}`,
                  background: 'transparent', color,
                  fontFamily: "'DM Mono', monospace", fontSize: 13,
                  cursor: 'pointer', transition: 'all .18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = color + '18'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; }}
              >
                {label}
              </button>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#2a2a45' }}>
            Values <span style={{ color: RC.high }}>in red</span> exceed clinical thresholds
          </p>
        </div>
      )}

      {/* ── RESULT / FINAL PHASE ────────────────────────────────────────────── */}
      {(phase === 'result' || phase === 'final') && (
        <div className="fade-in">
          {/* Verdict */}
          <div className="pop" style={{
            background: correct ? '#10b98110' : '#ef444410',
            border: `0.5px solid ${correct ? '#10b98140' : '#ef444440'}`,
            borderTop: `3px solid ${correct ? RC.low : RC.high}`,
            borderRadius: 12, padding: '1rem', textAlign: 'center', marginBottom: '1rem',
          }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, color: correct ? RC.low : RC.high }}>
              {correct ? 'Correct!' : 'Wrong'}
            </div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
              {streak >= 3 ? `🔥 ${streak} in a row!` : streak >= 2 ? 'On a roll!' : correct ? 'Nice call.' : `AI said: ${patient.risk} risk`}
            </div>
          </div>

          {/* Your pick vs AI answer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '1rem' }}>
            {[
              { label: 'Your Pick', value: userPick,     ok: correct },
              { label: 'AI Answer', value: patient.risk, ok: true    },
            ].map(({ label, value, ok }) => (
              <div key={label} style={{
                background: RC_BG[value], border: `0.5px solid ${RC[value]}40`,
                borderRadius: 10, padding: '.85rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: '#4b5563', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: RC[value], textTransform: 'capitalize' }}>{value} Risk</div>
                <div style={{ fontSize: 20, marginTop: 4, color: ok ? RC.low : RC.high }}>{ok ? '✓' : '✗'}</div>
              </div>
            ))}
          </div>

          {/* Animated decision path */}
          <div style={{
            background: '#0b0b1a', border: '0.5px solid #ffffff0a',
            borderRadius: 12, padding: '1rem', marginBottom: '1rem',
          }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', color: '#4b5563', textTransform: 'uppercase', marginBottom: '.75rem' }}>
              AI Decision Path
            </div>
            {patient.path.map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: '.6rem', alignItems: 'flex-start',
                marginBottom: i < patient.path.length - 1 ? '.6rem' : 0,
                animation: `slideUp .3s ${i * 0.18}s ease both`,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: step.pred ? RC_BG[patient.risk] : '#7c3aed20',
                  border: `1.5px solid ${step.pred ? RC[patient.risk] : '#7c3aed'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: step.pred ? RC[patient.risk] : '#a78bfa',
                }}>
                  {i + 1}
                </div>
                <div style={{ paddingTop: 3, flex: 1 }}>
                  {step.pred ? (
                    <div style={{ fontSize: 13, color: RC[patient.risk], fontWeight: 500 }}>→ {step.pred}</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: '#c4c4d4' }}>{step.c}</div>
                      <div style={{ fontSize: 11, color: step.r ? RC.high : RC.low, marginTop: 2 }}>
                        {step.v} → {step.r ? 'YES ✓' : 'NO ✗'}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Final score */}
          {phase === 'final' && (
            <div className="pop" style={{
              background: '#0b0b1a', border: '0.5px solid #ffffff0a',
              borderTop: '3px solid #a78bfa',
              borderRadius: 12, padding: '1.25rem', textAlign: 'center', marginBottom: '1rem',
            }}>
              <div style={{ fontSize: 10, letterSpacing: '.12em', color: '#4b5563', textTransform: 'uppercase', marginBottom: 8 }}>Final Score</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800, color: '#a78bfa' }}>{finalPct}%</div>
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>{humanW} of {played} correct · AI: 100%</div>
              <div style={{ marginTop: 12, fontSize: 13, color: '#c4c4d4' }}>
                {humanW === played ? '🏆 Perfect score! Incredible.' : humanW >= 6 ? '💪 Strong performance.' : humanW >= 4 ? '🤔 Keep practicing.' : '🤖 The AI wins this round.'}
              </div>
            </div>
          )}

          <button
            onClick={phase === 'final' ? handleRestart : handleNext}
            style={{
              width: '100%', padding: '.9rem',
              fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '.05em',
              background: '#f9fafb', color: '#06060f',
              border: 'none', borderRadius: 10, cursor: 'pointer', transition: 'opacity .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.82'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {phase === 'final' ? 'PLAY AGAIN →' : `NEXT CASE → (${idx + 1}/${CASES.length})`}
          </button>
        </div>
      )}

      {/* ── LIVE DECISION TREE SIMULATION ───────────────────────────────────── */}
      {showTree && (
        <div style={{
          marginTop: '1.5rem',
          background: '#0b0b1a', border: '0.5px solid #ffffff0a',
          borderRadius: 12, padding: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <div style={{ fontSize: 10, letterSpacing: '.12em', color: '#4b5563', textTransform: 'uppercase' }}>
              Live Decision Tree
            </div>
            <div style={{
              fontSize: 10, fontFamily: "'DM Mono', monospace",
              color: treeAnimating ? '#a78bfa' : visitedIds.length > 0 ? '#10b981' : '#4b5563',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {treeAnimating && (
                <span style={{
                  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                  background: '#a78bfa', animation: 'treePulse .8s ease infinite',
                }} />
              )}
              {treeAnimating ? 'traversing...' : visitedIds.length > 0 ? 'path complete' : 'awaiting pick'}
            </div>
          </div>

          <LiveTree patient={patient} treeAnimating={treeAnimating} visitedIds={visitedIds} />

          <div style={{ marginTop: '.6rem', display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { color: RC.high,   label: 'YES branch'  },
              { color: RC.low,    label: 'NO branch'   },
              { color: '#a78bfa', label: 'Active node' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#4b5563' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                {label}
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 10, color: '#1c1c30', marginTop: '.4rem' }}>
            ← scroll to explore full tree →
          </p>
        </div>
      )}
    </div>
  );
}