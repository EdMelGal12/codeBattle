import { useState, useCallback } from 'react';
import { getSocket, useSocket } from '../hooks/useSocket';
import Timer from './Timer';
import ScorePanel from './ScorePanel';
import Question from './Question';

function multLabel(m) {
  // e.g. 1.5 → "1.5x", 2 → "2x", 3 → "3x"
  return Number.isInteger(m) ? `${m}x` : `${m.toFixed(1)}x`;
}

export default function GameRoom({ questions, timeLeft, myScore, opponentScore, username, opponent, multiplier, winStreak }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredMap,  setAnsweredMap]  = useState({});

  useSocket({
    answer_result: ({ correct, fuzzy, correctAnswer, pointsGained, multiplier: mult }) => {
      setAnsweredMap((prev) => ({
        ...prev,
        [currentIndex]: { correct, fuzzy, correctAnswer, pointsGained, multiplier: mult },
      }));
      setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, questions.length - 1)), 1200);
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

  const showStreak    = winStreak > 0;
  const showMultiplier = multiplier > 1;

  return (
    <div className="flex flex-col min-h-screen px-4 py-5 max-w-2xl mx-auto w-full gap-4">

      {/* Header row */}
      <div className="flex justify-between items-start">
        <span className="text-[9px] text-red-600 pixel-shadow">CODEBATTLE</span>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[7px] text-gray-700 pixel-shadow">
            Q {Math.min(currentIndex + 1, questions.length)}/{questions.length}
          </span>
          {showStreak && (
            <span className="text-[7px] text-red-500 pixel-shadow">
              STREAK {winStreak}{showMultiplier ? `  ${multLabel(multiplier)}` : ''}
            </span>
          )}
        </div>
      </div>

      <hr className="term-divider" />

      {/* Multiplier banner — only when active */}
      {showMultiplier && (
        <div className="pixel-panel px-4 py-2 border border-red-900 flex justify-between items-center">
          <span className="text-[7px] text-gray-600 pixel-shadow">&gt; STREAK MULTIPLIER ACTIVE</span>
          <span className="text-[8px] text-red-500 pixel-shadow" style={{ animation: 'blink 1.5s step-end infinite' }}>
            {multLabel(multiplier)}
          </span>
        </div>
      )}

      <ScorePanel
        username={username}
        myScore={myScore}
        opponentName={opponent?.username}
        opponentScore={opponentScore}
      />
      <Timer timeLeft={timeLeft} total={30} />

      {/* Progress dots */}
      <div className="flex gap-[3px]">
        {questions.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-2"
            style={{
              backgroundColor:
                answeredMap[i] !== undefined
                  ? answeredMap[i].correct ? '#226622' : '#662222'
                  : i === currentIndex ? '#cc2222' : '#1a1a1a',
              border: '1px solid #0d0d0d',
            }}
          />
        ))}
      </div>

      {/* Question card */}
      <div className="pixel-panel p-5 flex-1 border border-gray-800">
        {allAnswered ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-10 text-center">
            <p className="text-[9px] text-green-600 pixel-shadow cursor">ALL DONE</p>
            <p className="text-[7px] text-gray-700 pixel-shadow leading-7">AWAITING TIMER...</p>
          </div>
        ) : currentQuestion ? (
          <Question
            key={currentIndex}
            question={currentQuestion}
            questionIndex={currentIndex}
            onSubmit={handleSubmit}
            answered={answerInfo !== undefined}
            correct={answerInfo?.correct}
            fuzzy={answerInfo?.fuzzy}
            correctAnswer={answerInfo?.correctAnswer}
            pointsGained={answerInfo?.pointsGained}
            multiplier={answerInfo?.multiplier}
          />
        ) : null}
      </div>

      {/* Manual next */}
      {!allAnswered && answerInfo !== undefined && currentIndex < questions.length - 1 && (
        <button
          onClick={() => setCurrentIndex((i) => i + 1)}
          className="pixel-btn text-[8px] text-gray-500 px-4 py-2 self-center border border-gray-800 hover:text-gray-300"
        >
          &gt; NEXT
        </button>
      )}
    </div>
  );
}
