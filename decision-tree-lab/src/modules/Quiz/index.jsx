import { useState } from 'react';
import { quizQuestions } from '../../utils/decisionTree';
import { useNavigate } from 'react-router-dom';

export default function Quiz() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const q = quizQuestions[current];
  const isCorrect = selected === q.answer;

  const confirm = () => {
    if (selected === null) return;
    setConfirmed(true);
    if (selected === q.answer) setScore(s => s + 1);
  };

  const next = () => {
    if (current + 1 >= quizQuestions.length) {
      setDone(true);
      return;
    }
    setCurrent(c => c + 1);
    setSelected(null);
    setConfirmed(false);
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setScore(0);
    setDone(false);
  };

  const pct = Math.round((score / quizQuestions.length) * 100);

  const grade =
    pct >= 80
      ? { label: 'Excellent! 🎉', color: '#00f5a0' }
      : pct >= 60
      ? { label: 'Good job! 👍', color: '#f59e0b' }
      : { label: 'Keep learning 📚', color: '#ef4444' };

  if (done)
    return (
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '1.4rem 0.9rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.7rem' }}>
          {pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '📚'}
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            color: grade.color,
            fontSize: '1.2rem',
            marginBottom: '0.3rem',
          }}
        >
          {grade.label}
        </h1>

        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '1.3rem' }}>
          You scored {score} out of {quizQuestions.length}
        </p>

        <div className="card" style={{ marginBottom: '1.4rem', borderColor: grade.color + '50' }}>
          <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto' }}>
            <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#ffffff10" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={grade.color}
                strokeWidth="8"
                strokeDasharray={`${pct * 3.14} 314`}
                strokeLinecap="round"
              />
            </svg>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '1.3rem', color: grade.color }}>{pct}%</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>score</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn btn-outline" onClick={restart} style={{ flex: 1 }}>
            RETRY
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ flex: 1 }}>
            HOME
          </button>
        </div>
      </div>
    );

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '1.4rem 0.9rem' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--accent)',
          fontSize: '1.1rem',
          marginBottom: '0.3rem',
        }}
      >
        Knowledge Quiz
      </h1>

      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '1rem' }}>
        Test what you've learned across the modules.
      </p>

      {/* Progress */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem' }}>
        {quizQuestions.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background:
                i < current
                  ? 'var(--accent)'
                  : i === current
                  ? '#7c3aed'
                  : '#ffffff15',
            }}
          />
        ))}
      </div>

      {/* Question */}
      <div className="card" style={{ marginBottom: '1rem', borderColor: '#7c3aed40' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.6rem',
            color: '#7c3aed',
            marginBottom: '0.5rem',
          }}
        >
          QUESTION {current + 1} / {quizQuestions.length}
        </p>

        <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{q.q}</p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1rem' }}>
        {q.options.map((opt, i) => {
          let border = '#ffffff15';
          let bg = 'var(--surface)';
          let color = 'var(--text)';

          if (selected === i && !confirmed) {
            border = '#7c3aed';
            bg = '#7c3aed15';
            color = '#7c3aed';
          }

          if (confirmed && i === q.answer) {
            border = '#00f5a0';
            bg = '#00f5a015';
            color = '#00f5a0';
          }

          if (confirmed && selected === i && i !== q.answer) {
            border = '#ef4444';
            bg = '#ef444415';
            color = '#ef4444';
          }

          return (
            <button
              key={i}
              onClick={() => !confirmed && setSelected(i)}
              style={{
                background: bg,
                border: `1.3px solid ${border}`,
                color,
                borderRadius: 8,
                padding: '0.6rem 0.7rem',
                textAlign: 'left',
                fontSize: '0.78rem',
                cursor: confirmed ? 'default' : 'pointer',
              }}
            >
              <span style={{ opacity: 0.5, marginRight: '0.5rem', fontSize: '0.6rem' }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
              {confirmed && i === q.answer && ' ✓'}
              {confirmed && selected === i && i !== q.answer && ' ✗'}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {confirmed && (
        <div
          className="card"
          style={{
            marginBottom: '1rem',
            borderColor: isCorrect ? '#00f5a040' : '#ef444440',
            background: isCorrect ? '#00f5a010' : '#ef444410',
          }}
        >
          <p style={{ fontSize: '0.7rem', color: isCorrect ? '#00f5a0' : '#ef4444' }}>
            {isCorrect ? '✓ Correct!' : '✗ Not quite'}
          </p>

          <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            {isCorrect
              ? 'Great understanding!'
              : `Correct answer: "${q.options[q.answer]}"`}
          </p>
        </div>
      )}

      {/* Action */}
      {!confirmed ? (
        <button
          className="btn btn-primary"
          onClick={confirm}
          disabled={selected === null}
          style={{
            width: '100%',
            padding: '0.65rem',
            fontSize: '0.75rem',
            opacity: selected === null ? 0.5 : 1,
          }}
        >
          CONFIRM
        </button>
      ) : (
        <button
          className="btn btn-primary"
          onClick={next}
          style={{ width: '100%', padding: '0.65rem', fontSize: '0.75rem' }}
        >
          {current + 1 >= quizQuestions.length
            ? 'SEE RESULTS →'
            : 'NEXT →'}
        </button>
      )}
    </div>
  );
}