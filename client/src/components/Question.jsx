import { useState } from 'react';

const TYPE_LABEL = {
  mcq: 'MULTI CHOICE',
  boolean: 'TRUE / FALSE',
  fill: 'FILL IN BLANK',
};

export default function Question({ question, questionIndex, onSubmit, answered, correctAnswer }) {
  const [selected, setSelected] = useState(null);
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

  const getOptionClass = (option) => {
    const base = 'w-full text-left px-4 py-3 text-[8px] pixel-shadow pixel-btn uppercase leading-6';

    if (!answered) {
      return `${base} bg-gray-800 text-gray-200 hover:bg-gray-700 cursor-pointer`;
    }

    const isCorrect  = option === correctAnswer;
    const isSelected = option === selected;

    if (isCorrect)             return `${base} bg-green-900 text-green-300 cursor-default`;
    if (isSelected && !isCorrect) return `${base} bg-red-900 text-red-300 cursor-default`;
    return `${base} bg-gray-900 text-gray-600 cursor-default`;
  };

  const isCorrectFill =
    question.type === 'fill' &&
    fillValue.trim().toLowerCase() === correctAnswer?.toLowerCase();

  return (
    <div className="flex flex-col gap-5">
      {/* Type badge */}
      <span className="text-[7px] text-yellow-400/70 pixel-shadow">
        {TYPE_LABEL[question.type]}
      </span>

      {/* Question text */}
      <p className="text-white text-[9px] pixel-shadow leading-7">{question.question}</p>

      {/* MCQ / Boolean options */}
      {question.type !== 'fill' && (
        <div className="flex flex-col gap-2">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionClick(option)}
              className={getOptionClass(option)}
              disabled={answered}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Fill in the Blank */}
      {question.type === 'fill' && (
        <form onSubmit={handleFillSubmit} className="flex gap-2">
          <input
            type="text"
            value={fillValue}
            onChange={(e) => setFillValue(e.target.value)}
            disabled={answered}
            placeholder="TYPE ANSWER..."
            className="flex-1 bg-black text-yellow-400 border-2 border-gray-600 px-3 py-3 text-[9px] focus:outline-none focus:border-yellow-400 placeholder-gray-600 disabled:opacity-50"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
            autoFocus
          />
          <button
            type="submit"
            disabled={answered || !fillValue.trim()}
            className="pixel-btn bg-yellow-400 text-gray-950 text-[8px] px-4 pixel-shadow disabled:opacity-40 disabled:cursor-not-allowed"
          >
            OK
          </button>
        </form>
      )}

      {/* Feedback */}
      {answered && (
        <div className="text-[8px] pixel-shadow leading-6">
          {selected === correctAnswer || isCorrectFill ? (
            <p className="text-green-400">+ CORRECT  +10 PTS</p>
          ) : (
            <p className="text-red-400">
              WRONG  ANS: <span className="text-white">{correctAnswer}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
