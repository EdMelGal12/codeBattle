import { useState, useCallback } from 'react';
import { getSocket, useSocket } from '../hooks/useSocket';
import Timer from './Timer';
import ScorePanel from './ScorePanel';
import Question from './Question';

export default function GameRoom({
  questions,
  timeLeft,
  myScore,
  opponentScore,
  username,
  opponent,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState({}); // questionIndex → { correct, correctAnswer }

  useSocket({
    answer_result: ({ correct, correctAnswer, yourScore }) => {
      setAnsweredMap((prev) => ({
        ...prev,
        [currentIndex]: { correct, correctAnswer },
      }));
      // Auto-advance to next question after short delay
      setTimeout(() => {
        setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
      }, 1200);
    },
  });

  const handleSubmit = useCallback(
    (questionIndex, answer) => {
      if (answeredMap[questionIndex] !== undefined) return;
      getSocket().emit('submit_answer', { questionIndex, answer });
    },
    [answeredMap]
  );

  const currentQuestion = questions[currentIndex];
  const answerInfo = answeredMap[currentIndex];
  const allAnswered = Object.keys(answeredMap).length >= questions.length;

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 max-w-2xl mx-auto w-full gap-5">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-black text-white">
          Code<span className="text-yellow-400">Battle</span>
        </h2>
      </div>

      {/* Score Panel */}
      <ScorePanel
        username={username}
        myScore={myScore}
        opponentName={opponent?.username}
        opponentScore={opponentScore}
      />

      {/* Timer */}
      <Timer timeLeft={timeLeft} total={30} />

      {/* Question progress */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          Question{' '}
          <span className="text-white font-bold">{Math.min(currentIndex + 1, questions.length)}</span>
          /{questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-5 h-2 rounded-full ${
                answeredMap[i] !== undefined
                  ? answeredMap[i].correct
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : i === currentIndex
                  ? 'bg-yellow-400'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 flex-1 shadow-lg">
        {allAnswered ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
            <p className="text-2xl font-bold text-yellow-400">All answered!</p>
            <p className="text-gray-400">Waiting for the timer to end…</p>
          </div>
        ) : currentQuestion ? (
          <Question
            key={currentIndex}
            question={currentQuestion}
            questionIndex={currentIndex}
            onSubmit={handleSubmit}
            answered={answerInfo !== undefined}
            correctAnswer={answerInfo?.correctAnswer}
          />
        ) : null}
      </div>

      {/* Navigation (manual advance if auto-advance hasn't fired) */}
      {!allAnswered && answerInfo !== undefined && currentIndex < questions.length - 1 && (
        <button
          onClick={() => setCurrentIndex((i) => i + 1)}
          className="text-yellow-400 hover:text-yellow-300 text-sm font-semibold underline self-center transition-colors"
        >
          Next question →
        </button>
      )}
    </div>
  );
}
