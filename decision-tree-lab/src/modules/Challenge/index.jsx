import { useState } from 'react';
import { predict } from '../../utils/decisionTree';

const cases = [
  { age: 52, bmi: 34, glucose: 150 },
  { age: 29, bmi: 22, glucose: 95 },
  { age: 61, bmi: 31, glucose: 145 },
  { age: 38, bmi: 27, glucose: 110 },
  { age: 55, bmi: 35, glucose: 160 },
  { age: 24, bmi: 20, glucose: 88 },
];

const riskColor = r => ({ high: '#ef4444', medium: '#f59e0b', low: '#00f5a0' }[r] || '#00f5a0');

export default function Challenge() {
  const [caseIdx, setCaseIdx] = useState(0);
  const [userPick, setUserPick] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [pathStep, setPathStep] = useState(0);
  const [score, setScore] = useState({ human: 0, ai: 0, played: 0 });

  const patient = cases[caseIdx];
  const aiResult = predict(patient);

  const handlePick = (pick) => {
    setUserPick(pick);
    setRevealed(true);
    const correct = aiResult.risk;
    const humanRight = pick === correct;
    setScore(s => ({ human: s.human + (humanRight ? 1 : 0), ai: s.ai + 1, played: s.played + 1 }));
    // animate path
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setPathStep(i);
      if (i >= aiResult.path.length) clearInterval(interval);
    }, 700);
  };

  const next = () => {
    setCaseIdx(i => (i + 1) % cases.length);
    setUserPick(null);
    setRevealed(false);
    setPathStep(0);
  };

  const humanPct = score.played ? Math.round((score.human / score.played) * 100) : 0;
  const aiPct    = score.played ? Math.round((score.ai    / score.played) * 100) : 0;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
        AI vs Human
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Predict the outcome before the AI reveals its answer.
      </p>

      {/* Scoreboard */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        {[
          { label: 'YOU', pct: humanPct, color: '#7c3aed' },
          { label: 'AI',  pct: aiPct,    color: 'var(--accent)' },
        ].map(({ label, pct, color }) => (
          <div key={label} style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>{label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color }}>{pct}%</p>
            <div style={{ height: 4, background: '#ffffff10', borderRadius: 2, marginTop: '0.4rem' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s' }} />
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center', borderLeft: '1px solid #ffffff10', paddingLeft: '1rem' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>GAMES</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text)' }}>{score.played}</p>
        </div>
      </div>

      {/* Patient card */}
      <div className="card" style={{ marginBottom: '1.5rem', borderColor: '#7c3aed40' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
          PATIENT DATA — CASE {caseIdx + 1}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          {[
            { label: 'Age', value: patient.age, unit: 'yrs', threshold: 45 },
            { label: 'BMI', value: patient.bmi, unit: '', threshold: 30 },
            { label: 'Glucose', value: patient.glucose, unit: '', threshold: 140 },
          ].map(({ label, value, unit, threshold }) => (
            <div key={label} style={{ textAlign: 'center', background: 'var(--surface2)', borderRadius: 8, padding: '0.75rem 0.5rem' }}>
              <p style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--font-display)', marginBottom: '0.3rem' }}>{label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: value > threshold ? '#ef4444' : 'var(--accent)' }}>
                {value}<span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Prediction buttons */}
      {!revealed ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Low Risk',  value: 'low',    color: '#00f5a0' },
            { label: 'Med Risk',  value: 'medium', color: '#f59e0b' },
            { label: 'High Risk', value: 'high',   color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <button key={value} onClick={() => handlePick(value)} style={{
              background: 'transparent', border: `1.5px solid ${color}`,
              color, borderRadius: 8, padding: '0.75rem 0.5rem',
              fontFamily: 'var(--font-display)', fontSize: '0.65rem',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.target.style.background = color + '20'}
              onMouseLeave={e => e.target.style.background = 'transparent'}>
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          {/* Result comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'YOUR PICK', value: userPick, isCorrect: userPick === aiResult.risk },
              { label: 'AI RESULT', value: aiResult.risk, isCorrect: true },
            ].map(({ label, value, isCorrect }) => (
              <div key={label} className="card" style={{
                textAlign: 'center', padding: '1rem',
                borderColor: isCorrect ? riskColor(value) + '60' : '#ef444440',
                background: isCorrect ? riskColor(value) + '10' : '#ef444410',
              }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>{label}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: riskColor(value), textTransform: 'uppercase' }}>{value}</p>
                <p style={{ fontSize: '1rem', marginTop: '0.3rem' }}>{isCorrect ? '✓' : '✗'}</p>
              </div>
            ))}
          </div>

          {/* Animated decision path */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '1rem' }}>
              AI DECISION PATH
            </p>
            {aiResult.path.slice(0, pathStep).map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                marginBottom: '0.75rem', animation: 'fadeIn 0.3s ease',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: step.prediction ? riskColor(aiResult.risk) + '20' : '#7c3aed20',
                  border: `1.5px solid ${step.prediction ? riskColor(aiResult.risk) : '#7c3aed'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontFamily: 'var(--font-display)',
                  color: step.prediction ? riskColor(aiResult.risk) : '#7c3aed',
                }}>{i + 1}</div>
                <div>
                  {step.prediction ? (
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: riskColor(aiResult.risk) }}>
                      → {step.prediction}
                    </p>
                  ) : (
                    <>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--text)' }}>{step.condition}</p>
                      <p style={{ fontSize: '0.7rem', color: step.result ? '#ef4444' : '#00f5a0', marginTop: '0.2rem' }}>
                        {step.value} → {step.result ? 'YES ✓' : 'NO ✗'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={next} style={{ width: '100%', padding: '0.9rem' }}>
            NEXT CASE →
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}