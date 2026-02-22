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
  const [answeredMap, setAnsweredMap] = useState({});

  useSocket({
    answer_result: ({ correct, correctAnswer }) => {
      setAnsweredMap((prev) => ({
        ...prev,
        [currentIndex]: { correct, correctAnswer },
      }));
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
  const answerInfo      = answeredMap[currentIndex];
  const allAnswered     = Object.keys(answeredMap).length >= questions.length;

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 max-w-2xl mx-auto w-full gap-4">

      {/* Header */}
      <div className="text-center">
        <h2 className="text-base text-yellow-400 pixel-shadow">
          CODEBATTLE
        </h2>
      </div>

      {/* Score */}
      <ScorePanel
        username={username}
        myScore={myScore}
        opponentName={opponent?.username}
        opponentScore={opponentScore}
      />

      {/* Timer */}
      <Timer timeLeft={timeLeft} total={30} />

      {/* Question progress dots */}
      <div className="flex justify-between items-center">
        <span className="text-[7px] text-gray-500 pixel-shadow">
          Q {Math.min(currentIndex + 1, questions.length)}/{questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 ${
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
      <div className="pixel-panel p-5 flex-1">
        {allAnswered ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
            <p className="text-[10px] text-yellow-400 pixel-shadow">ALL ANSWERED!</p>
            <p className="text-[8px] text-gray-400 pixel-shadow leading-7">
              WAITING FOR TIMER...
            </p>
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

      {/* Manual next button */}
      {!allAnswered && answerInfo !== undefined && currentIndex < questions.length - 1 && (
        <button
          onClick={() => setCurrentIndex((i) => i + 1)}
          className="pixel-btn bg-gray-800 text-yellow-400 text-[8px] px-4 py-2 pixel-shadow self-center"
        >
          NEXT
        </button>
      )}
    </div>
  );
}
