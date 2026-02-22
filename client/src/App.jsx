import { useState, useCallback } from 'react';
import { useSocket, getSocket } from './hooks/useSocket';
import LandingPage from './components/LandingPage';
import Matchmaking from './components/Matchmaking';
import Countdown from './components/Countdown';
import GameRoom from './components/GameRoom';
import Results from './components/Results';

export default function App() {
  const [phase, setPhase]             = useState('landing');
  const [username, setUsername]       = useState('');
  const [opponent, setOpponent]       = useState(null);
  const [countdownValue, setCountdown]= useState(5);
  const [questions, setQuestions]     = useState([]);
  const [timeLeft, setTimeLeft]       = useState(30);
  const [myScore, setMyScore]         = useState(0);
  const [opponentScore, setOppScore]  = useState(0);
  const [gameResult, setGameResult]   = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [winStreak, setWinStreak]     = useState(0);  // consecutive wins
  const [multiplier, setMultiplier]   = useState(1);  // active game multiplier

  const upsertEntry = (list, name, won, draw) => {
    const next = [...list];
    const idx  = next.findIndex((e) => e.username === name);
    if (idx === -1) {
      next.push({ username: name, wins: won ? 1 : 0, losses: !won && !draw ? 1 : 0, draws: draw ? 1 : 0 });
    } else {
      next[idx] = {
        ...next[idx],
        wins:   next[idx].wins   + (won           ? 1 : 0),
        losses: next[idx].losses + (!won && !draw ? 1 : 0),
        draws:  next[idx].draws  + (draw          ? 1 : 0),
      };
    }
    return next;
  };

  const updateLeaderboard = useCallback((result, myName, oppName) => {
    setLeaderboard((prev) => {
      const draw   = result.winner === null;
      const myWon  = result.winner === myName;
      const oppWon = result.winner === oppName;
      let next = upsertEntry(prev, myName, myWon, draw);
      if (oppName) next = upsertEntry(next, oppName, oppWon, draw);
      return next;
    });
  }, []);

  useSocket({
    match_found: ({ opponent: opp, multiplier: mult }) => {
      setOpponent(opp);
      setCountdown(5);
      setMultiplier(mult ?? 1);
      setPhase('countdown');
    },
    countdown:         ({ value })        => setCountdown(value),
    game_start:        ({ questions: qs }) => {
      setQuestions(qs);
      setMyScore(0);
      setOppScore(0);
      setTimeLeft(30);
      setPhase('game');
    },
    timer_tick:        ({ timeLeft: tl }) => setTimeLeft(tl),
    answer_result:     ({ yourScore })    => setMyScore(yourScore),
    opponent_progress: ({ score })        => setOppScore(score),
    game_over: (result) => {
      setGameResult(result);
      updateLeaderboard(result, username, opponent?.username);
      const won = result.winner === username;
      setWinStreak((prev) => (won ? prev + 1 : 0));
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
    getSocket().emit('join_queue', { username: name, streak: 0 });
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
    setOppScore(0);
    setPhase('queue');
    // winStreak is already updated by game_over handler before Play Again is clicked
    getSocket().emit('join_queue', { username, streak: winStreak });
  }, [username, winStreak]);

  return (
    <div className="scanlines min-h-screen bg-black text-gray-300 flex flex-col">
      {phase === 'landing'   && <LandingPage  onEnterQueue={handleEnterQueue} leaderboard={leaderboard} />}
      {phase === 'queue'     && <Matchmaking  username={username} onCancel={handleLeaveQueue} winStreak={winStreak} />}
      {phase === 'countdown' && <Countdown    value={countdownValue} opponent={opponent} multiplier={multiplier} />}
      {phase === 'game'      && (
        <GameRoom
          questions={questions}
          timeLeft={timeLeft}
          myScore={myScore}
          opponentScore={opponentScore}
          username={username}
          opponent={opponent}
          multiplier={multiplier}
          winStreak={winStreak}
        />
      )}
      {phase === 'results' && gameResult && (
        <Results
          result={gameResult}
          username={username}
          opponent={opponent}
          onPlayAgain={handlePlayAgain}
          leaderboard={leaderboard}
          winStreak={winStreak}
        />
      )}
    </div>
  );
}
