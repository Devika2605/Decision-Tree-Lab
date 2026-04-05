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
    if (current + 1 >= quizQuestions.length) { setDone(true); return; }
    setCurrent(c => c + 1);
    setSelected(null);
    setConfirmed(false);
  };

  const restart = () => { setCurrent(0); setSelected(null); setConfirmed(false); setScore(0); setDone(false); };

  const pct = Math.round((score / quizQuestions.length) * 100);
  const grade = pct >= 80 ? { label: 'Excellent! 🎉', color: '#00f5a0' }
              : pct >= 60 ? { label: 'Good job! 👍',  color: '#f59e0b' }
              :              { label: 'Keep learning 📚', color: '#ef4444' };

  if (done) return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
        {pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '📚'}
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', color: grade.color, fontSize: '1.4rem', marginBottom: '0.5rem' }}>
        {grade.label}
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>You scored {score} out of {quizQuestions.length}</p>

      <div className="card" style={{ marginBottom: '2rem', borderColor: grade.color + '50' }}>
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
          <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#ffffff10" strokeWidth="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke={grade.color} strokeWidth="10"
              strokeDasharray={`${pct * 3.14} 314`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: grade.color }}>{pct}%</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>score</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-outline" onClick={restart} style={{ flex: 1 }}>RETRY</button>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ flex: 1 }}>HOME</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
        Knowledge Quiz
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Test what you've learned across all modules.
      </p>

      {/* Progress */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
        {quizQuestions.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < current ? 'var(--accent)' : i === current ? '#7c3aed' : '#ffffff15',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* Question */}
      <div className="card" style={{ marginBottom: '1.5rem', borderColor: '#7c3aed40' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: '#7c3aed', marginBottom: '0.75rem' }}>
          QUESTION {current + 1} / {quizQuestions.length}
        </p>
        <p style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.6 }}>{q.q}</p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {q.options.map((opt, i) => {
          let border = '#ffffff15', bg = 'var(--surface)', color = 'var(--text)';
          if (selected === i && !confirmed) { border = '#7c3aed'; bg = '#7c3aed15'; color = '#7c3aed'; }
          if (confirmed && i === q.answer)  { border = '#00f5a0'; bg = '#00f5a015'; color = '#00f5a0'; }
          if (confirmed && selected === i && i !== q.answer) { border = '#ef4444'; bg = '#ef444415'; color = '#ef4444'; }

          return (
            <button key={i} onClick={() => !confirmed && setSelected(i)} style={{
              background: bg, border: `1.5px solid ${border}`, color,
              borderRadius: 10, padding: '0.9rem 1rem', textAlign: 'left',
              fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: confirmed ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', marginRight: '0.75rem', opacity: 0.5 }}>
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
        <div className="card" style={{
          marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease',
          borderColor: isCorrect ? '#00f5a040' : '#ef444440',
          background: isCorrect ? '#00f5a010' : '#ef444410',
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: isCorrect ? '#00f5a0' : '#ef4444' }}>
            {isCorrect ? '✓ Correct!' : '✗ Not quite'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
            {isCorrect ? 'Great understanding!' : `The correct answer is: "${q.options[q.answer]}"`}
          </p>
        </div>
      )}

      {/* Action button */}
      {!confirmed ? (
        <button className="btn btn-primary" onClick={confirm}
          style={{ width: '100%', padding: '0.9rem', opacity: selected === null ? 0.4 : 1 }}
          disabled={selected === null}>
          CONFIRM ANSWER
        </button>
      ) : (
        <button className="btn btn-primary" onClick={next} style={{ width: '100%', padding: '0.9rem' }}>
          {current + 1 >= quizQuestions.length ? 'SEE RESULTS →' : 'NEXT QUESTION →'}
        </button>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}