import { useState } from 'react';

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
    const base =
      'w-full text-left px-5 py-3 rounded-xl border font-semibold transition-all text-sm';

    if (!answered) {
      return `${base} border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-yellow-400 text-white cursor-pointer`;
    }

    const isCorrect = option === correctAnswer;
    const isSelected = option === selected;

    if (isCorrect) return `${base} border-green-500 bg-green-500/20 text-green-300 cursor-default`;
    if (isSelected && !isCorrect) return `${base} border-red-500 bg-red-500/20 text-red-300 cursor-default`;
    return `${base} border-gray-700 bg-gray-800/50 text-gray-500 cursor-default`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Question type badge */}
      <span className="text-xs font-bold uppercase tracking-widest text-yellow-400/70">
        {question.type === 'mcq' ? 'Multiple Choice' : question.type === 'boolean' ? 'True / False' : 'Fill in the Blank'}
      </span>

      {/* Question text */}
      <p className="text-white text-lg font-semibold leading-snug">{question.question}</p>

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
            placeholder="Type your answer…"
            className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-500 disabled:opacity-50"
            autoFocus
          />
          <button
            type="submit"
            disabled={answered || !fillValue.trim()}
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-bold px-5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </form>
      )}

      {/* Feedback after answering */}
      {answered && (
        <div className="mt-1 text-sm">
          {selected === correctAnswer || (question.type === 'fill' && fillValue.trim().toLowerCase() === correctAnswer?.toLowerCase()) ? (
            <p className="text-green-400 font-semibold">Correct! +10 points</p>
          ) : (
            <p className="text-red-400 font-semibold">
              Incorrect. Answer: <span className="text-white">{correctAnswer}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
