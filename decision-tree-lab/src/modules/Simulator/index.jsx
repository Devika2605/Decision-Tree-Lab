import { useState } from 'react';
import { predict } from '../../utils/decisionTree';

export default function Simulator() {
  const [inputs, setInputs] = useState({ age: 45, bmi: 28, glucose: 120 });
  const [result, setResult] = useState(null);

  const run = () => setResult(predict(inputs));

  const riskColor = r => ({ high: '#ef4444', medium: '#f59e0b', low: '#00f5a0' }[r] || '#00f5a0');

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
        Prediction Simulator
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Adjust patient data and watch the decision path change.
      </p>

      {/* Sliders */}
      {[
        { key: 'age',     label: 'Age',     min: 20, max: 80, unit: 'yrs', threshold: 45 },
        { key: 'bmi',     label: 'BMI',     min: 15, max: 50, unit: '',    threshold: 30 },
        { key: 'glucose', label: 'Glucose', min: 70, max: 200, unit: 'mg/dL', threshold: 140 },
      ].map(({ key, label, min, max, unit, threshold }) => (
        <div key={key} className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--muted)' }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: inputs[key] > threshold ? '#ef4444' : 'var(--accent)' }}>
              {inputs[key]} {unit}
            </span>
          </div>
          <input type="range" min={min} max={max} value={inputs[key]}
            onChange={e => { setInputs(i => ({ ...i, [key]: +e.target.value })); setResult(null); }}
            style={{ width: '100%', accentColor: inputs[key] > threshold ? '#ef4444' : 'var(--accent)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{min}</span>
            <span style={{ fontSize: '0.65rem', color: '#7c3aed' }}>threshold: {threshold}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{max}</span>
          </div>
        </div>
      ))}

      <button className="btn btn-primary" onClick={run} style={{ width: '100%', padding: '0.9rem', marginBottom: '1.5rem' }}>
        RUN PREDICTION →
      </button>

      {result && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          {/* Result badge */}
          <div className="card" style={{ marginBottom: '1rem', textAlign: 'center', borderColor: riskColor(result.risk) + '60', background: riskColor(result.risk) + '10' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>PREDICTION</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: riskColor(result.risk) }}>
              {result.prediction}
            </p>
          </div>

          {/* Decision path */}
          <div className="card">
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '1rem' }}>
              DECISION PATH
            </p>
            {result.path.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                marginBottom: i < result.path.length - 1 ? '1rem' : 0,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: step.prediction ? riskColor(result.risk) + '20' : '#7c3aed20',
                  border: `1.5px solid ${step.prediction ? riskColor(result.risk) : '#7c3aed'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: '0.65rem',
                  color: step.prediction ? riskColor(result.risk) : '#7c3aed',
                }}>{i + 1}</div>
                <div>
                  {step.prediction ? (
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: riskColor(result.risk) }}>
                      → {step.prediction}
                    </p>
                  ) : (
                    <>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--text)' }}>
                        {step.condition}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: step.result ? '#ef4444' : '#00f5a0', marginTop: '0.2rem' }}>
                        {step.value} → {step.result ? 'YES ✓' : 'NO ✗'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}