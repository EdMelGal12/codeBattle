import { useState, useCallback } from 'react';
import { useSocket, getSocket } from './hooks/useSocket';
import LandingPage from './components/LandingPage';
import Matchmaking from './components/Matchmaking';
import Countdown from './components/Countdown';
import GameRoom from './components/GameRoom';
import Results from './components/Results';

// App state machine: 'landing' | 'queue' | 'countdown' | 'game' | 'results'

export default function App() {
  const [phase, setPhase] = useState('landing');
  const [username, setUsername] = useState('');
  const [opponent, setOpponent] = useState(null);
  const [countdownValue, setCountdownValue] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [gameResult, setGameResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const updateLeaderboard = useCallback((result, myName) => {
    setLeaderboard((prev) => {
      const next = [...prev];
      const idx = next.findIndex((e) => e.username === myName);
      const won = result.winner === myName;
      const draw = result.winner === null;

      if (idx === -1) {
        next.push({
          username: myName,
          wins: won ? 1 : 0,
          losses: !won && !draw ? 1 : 0,
          draws: draw ? 1 : 0,
        });
      } else {
        next[idx] = {
          ...next[idx],
          wins: next[idx].wins + (won ? 1 : 0),
          losses: next[idx].losses + (!won && !draw ? 1 : 0),
          draws: (next[idx].draws || 0) + (draw ? 1 : 0),
        };
      }
      return next;
    });
  }, []);

  useSocket({
    match_found: ({ opponent: opp }) => {
      setOpponent(opp);
      setCountdownValue(5);
      setPhase('countdown');
    },
    countdown: ({ value }) => {
      setCountdownValue(value);
    },
    game_start: ({ questions: qs }) => {
      setQuestions(qs);
      setMyScore(0);
      setOpponentScore(0);
      setTimeLeft(30);
      setPhase('game');
    },
    timer_tick: ({ timeLeft: tl }) => {
      setTimeLeft(tl);
    },
    answer_result: ({ yourScore }) => {
      setMyScore(yourScore);
    },
    opponent_progress: ({ score }) => {
      setOpponentScore(score);
    },
    game_over: (result) => {
      setGameResult(result);
      updateLeaderboard(result, username);
      setPhase('results');
    },
    error: ({ message }) => {
      alert(message);
      setPhase('landing');
    },
  });

  const handleEnterQueue = useCallback((name) => {
    setUsername(name);
    setPhase('queue');
    getSocket().emit('join_queue', { username: name });
  }, []);

  const handleLeaveQueue = useCallback(() => {
    setPhase('landing');
    getSocket().emit('leave_queue');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setGameResult(null);
    setOpponent(null);
    setQuestions([]);
    setMyScore(0);
    setOpponentScore(0);
    setPhase('landing');
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {phase === 'landing' && (
        <LandingPage
          onEnterQueue={handleEnterQueue}
          leaderboard={leaderboard}
        />
      )}
      {phase === 'queue' && (
        <Matchmaking username={username} onCancel={handleLeaveQueue} />
      )}
      {phase === 'countdown' && (
        <Countdown value={countdownValue} opponent={opponent} />
      )}
      {phase === 'game' && (
        <GameRoom
          questions={questions}
          timeLeft={timeLeft}
          myScore={myScore}
          opponentScore={opponentScore}
          username={username}
          opponent={opponent}
        />
      )}
      {phase === 'results' && gameResult && (
        <Results
          result={gameResult}
          username={username}
          opponent={opponent}
          onPlayAgain={handlePlayAgain}
          leaderboard={leaderboard}
        />
      )}
    </div>
  );
}
