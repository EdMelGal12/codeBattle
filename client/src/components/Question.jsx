import { useState } from 'react';

const TYPE_LABEL = {
  mcq:     'MULTI-CHOICE',
  boolean: 'TRUE / FALSE',
  fill:    'FILL IN BLANK',
};

export default function Question({ question, questionIndex, onSubmit, answered, correct, fuzzy, correctAnswer, pointsGained, multiplier }) {
  const [selected,  setSelected]  = useState(null);
  const [fillValue, setFillValue] = useState('');

  if (!question) return null;

  const handleOptionClick = (option) => {
    if (answered) return;
    setSelected(option);
    onSubmit(questionIndex, option);
  };

  const handleFillSubmit = (e) => {
    e.preventDefault();
    if (answered || !fillValue.trim()) return;
    onSubmit(questionIndex, fillValue.trim());
  };

  const optionStyle = (option) => {
    if (!answered) return { background: '#111111', border: '1px solid #2a2a2a', color: '#aaaaaa', cursor: 'pointer' };
    const isCorrect  = option === correctAnswer;
    const isSelected = option === selected;
    if (isCorrect)               return { background: '#0a1a0a', border: '1px solid #226622', color: '#44cc44' };
    if (isSelected && !isCorrect)return { background: '#1a0a0a', border: '1px solid #662222', color: '#cc4444' };
    return { background: '#0d0d0d', border: '1px solid #1a1a1a', color: '#333333' };
  };

  // Use server-authoritative result; fall back to client-side check for MCQ/boolean
  const wasCorrect = answered ? (correct ?? selected === correctAnswer) : false;

  const resultPrefix = fuzzy ? '> CLOSE ENOUGH' : '> CORRECT';
  const multSuffix   = multiplier && multiplier > 1 ? `  [${multiplier}x]` : '';
  const ptsLabel     = wasCorrect
    ? `${resultPrefix}  +${pointsGained ?? 10} PTS${multSuffix}`
    : `> WRONG  ANS: ${correctAnswer}`;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[7px] text-gray-700 pixel-shadow">&gt; {TYPE_LABEL[question.type]}</p>
      <hr className="term-divider" />
      <p className="text-[9px] text-gray-300 pixel-shadow leading-7">{question.question}</p>

      {/* MCQ / Boolean */}
      {question.type !== 'fill' && (
        <div className="flex flex-col gap-2">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionClick(option)}
              disabled={answered}
              className="w-full text-left px-4 py-3 text-[8px] uppercase leading-6 pixel-btn"
              style={optionStyle(option)}
            >
              &gt; {option}
            </button>
          ))}
        </div>
      )}

      {/* Fill in blank */}
      {question.type === 'fill' && (
        <form onSubmit={handleFillSubmit} className="flex gap-2">
          <input
            type="text"
            value={fillValue}
            onChange={(e) => setFillValue(e.target.value)}
            disabled={answered}
            placeholder="> TYPE ANSWER..."
            className="flex-1 term-input px-3 py-3 text-[9px] text-red-400 pixel-shadow disabled:opacity-40"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
            autoFocus
          />
          <button
            type="submit"
            disabled={answered || !fillValue.trim()}
            className="pixel-btn text-[8px] px-4 py-3 border border-gray-700"
            style={{ color: answered ? '#333' : '#aaaaaa' }}
          >
            OK
          </button>
        </form>
      )}

      {/* Feedback */}
      {answered && (
        <p className={`text-[8px] pixel-shadow leading-6 ${
          wasCorrect
            ? fuzzy ? 'text-yellow-500' : 'text-green-500'
            : 'text-red-700'
        }`}>
          {ptsLabel}
        </p>
      )}
    </div>
  );
}
