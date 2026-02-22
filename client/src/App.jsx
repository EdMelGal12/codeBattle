import { useState, useCallback } from 'react';
import { useSocket, getSocket } from './hooks/useSocket';
import { useWallet } from '@solana/wallet-adapter-react';
import LandingPage    from './components/LandingPage';
import Matchmaking    from './components/Matchmaking';
import Countdown      from './components/Countdown';
import GameRoom       from './components/GameRoom';
import Results        from './components/Results';
import WagerDeposit   from './components/WagerDeposit';
import Settings       from './components/Settings';
import CodeBackground from './components/CodeBackground';

const LS_KEY = 'codebattle_player';

function loadLocalPlayer() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocalPlayer(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

export default function App() {
  const cached = loadLocalPlayer();

  const [phase,         setPhase]       = useState('landing');
  const [username,      setUsername]    = useState('');
  const [opponent,      setOpponent]    = useState(null);
  const [countdownVal,  setCountdown]   = useState(5);
  const [questions,     setQuestions]   = useState([]);
  const [timeLeft,      setTimeLeft]    = useState(60);
  const [myScore,       setMyScore]     = useState(0);
  const [opponentScore, setOppScore]    = useState(0);
  const [gameResult,    setGameResult]  = useState(null);
  const [leaderboard,   setLeaderboard] = useState([]);
  const [winStreak,     setWinStreak]   = useState(0);
  const [multiplier,    setMultiplier]  = useState(1);

  // ELO state
  const [myElo,       setMyElo]      = useState(cached?.elo ?? 1200);
  const [myEloDelta,  setMyEloDelta] = useState(null);
  const [opponentElo, setOppElo]    = useState(null);

  // Wager state
  const [pendingWager,  setPendingWager]  = useState(null);
  const [wagerAmount,   setWagerAmount]   = useState(0);
  const { publicKey: walletPubkey }       = useWallet();

  const upsertEntry = (list, name, won, draw, elo) => {
    const next = [...list];
    const idx  = next.findIndex((e) => e.username === name);
    if (idx === -1) {
      next.push({ username: name, wins: won ? 1 : 0, losses: !won && !draw ? 1 : 0, draws: draw ? 1 : 0, elo: elo ?? 1200 });
    } else {
      next[idx] = {
        ...next[idx],
        wins:   next[idx].wins   + (won           ? 1 : 0),
        losses: next[idx].losses + (!won && !draw ? 1 : 0),
        draws:  next[idx].draws  + (draw          ? 1 : 0),
        elo:    elo ?? next[idx].elo,
      };
    }
    return next;
  };

  const updateLeaderboard = useCallback((result, myName, oppName) => {
    setLeaderboard((prev) => {
      const draw   = result.winner === null;
      const myWon  = result.winner === myName;
      const oppWon = result.winner === oppName;
      const myEloEntry  = result.eloChanges?.[myName]?.newElo;
      const oppEloEntry = result.eloChanges?.[oppName]?.newElo;
      let next = upsertEntry(prev, myName, myWon, draw, myEloEntry);
      if (oppName) next = upsertEntry(next, oppName, oppWon, draw, oppEloEntry);
      return next;
    });
  }, []);

  useSocket({
    match_found: ({ opponent: opp, multiplier: mult, isWager, myElo: serverMyElo, opponentElo: serverOppElo }) => {
      setOpponent(opp);
      setMultiplier(mult ?? 1);
      if (serverMyElo != null)  setMyElo(serverMyElo);
      if (serverOppElo != null) setOppElo(serverOppElo);
      setMyEloDelta(null);
      if (isWager) {
        setPhase('wager_pending');
      } else {
        setCountdown(5);
        setPhase('countdown');
      }
    },
    wager_setup: (setup) => {
      setPendingWager(setup);
      setPhase('wager_deposit');
    },
    wager_confirmed: () => {
      setPendingWager(null);
      setCountdown(5);
      setPhase('countdown');
    },
    wager_cancelled: ({ message }) => {
      setPendingWager(null);
      alert(message || 'WAGER CANCELLED');
      setPhase('landing');
    },
    countdown:         ({ value })        => setCountdown(value),
    game_start:        ({ questions: qs }) => {
      setQuestions(qs);
      setMyScore(0);
      setOppScore(0);
      setTimeLeft(60);
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

      // Update ELO from server result
      if (result.eloChanges?.[username]) {
        const { newElo, delta } = result.eloChanges[username];
        setMyElo(newElo);
        setMyEloDelta(delta);
        saveLocalPlayer({
          username,
          elo:    newElo,
          wins:   (cached?.wins   || 0) + (won ? 1 : 0),
          losses: (cached?.losses || 0) + (!won && result.winner !== null ? 1 : 0),
          draws:  (cached?.draws  || 0) + (result.winner === null ? 1 : 0),
        });
      }

      setPhase('results');
    },
    error: ({ message }) => {
      alert(message);
      setPhase('landing');
    },
  });

  const handleEnterQueue = useCallback(({ name, wager }) => {
    setUsername(name);
    setWagerAmount(wager || 0);
    setPhase('queue');
    getSocket().emit('join_queue', {
      username:     name,
      streak:       0,
      wagerAmount:  wager || 0,
      walletPubkey: walletPubkey?.toBase58() ?? null,
    });
  }, [walletPubkey]);

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
    setMyEloDelta(null);
    setPhase('queue');
    getSocket().emit('join_queue', {
      username:     username,
      streak:       winStreak,
      wagerAmount:  wagerAmount,
      walletPubkey: walletPubkey?.toBase58() ?? null,
    });
  }, [username, winStreak, wagerAmount, walletPubkey]);

  const handleWagerCancelled = useCallback((msg) => {
    setPendingWager(null);
    alert(msg || 'WAGER CANCELLED');
    setPhase('landing');
  }, []);

  const handleChangeUsername = useCallback((newName) => {
    setUsername(newName);
  }, []);

  return (
    <div className="scanlines min-h-screen bg-black text-gray-300 flex flex-col" style={{ position: 'relative' }}>
      <CodeBackground />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {phase === 'landing' && (
          <LandingPage
            onEnterQueue={handleEnterQueue}
            leaderboard={leaderboard}
          />
        )}
        {phase === 'queue' && (
          <Matchmaking
            username={username}
            onCancel={handleLeaveQueue}
            winStreak={winStreak}
            wagerAmount={wagerAmount}
          />
        )}
        {(phase === 'wager_pending') && (
          <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <p className="text-[8px] text-yellow-500 pixel-shadow cursor">SETTING UP WAGER...</p>
          </div>
        )}
        {phase === 'wager_deposit' && pendingWager && (
          <WagerDeposit
            wagerInfo={pendingWager}
            onCancelled={handleWagerCancelled}
          />
        )}
        {phase === 'countdown' && (
          <Countdown value={countdownVal} opponent={opponent} multiplier={multiplier} />
        )}
        {phase === 'game' && (
          <GameRoom
            questions={questions}
            timeLeft={timeLeft}
            myScore={myScore}
            opponentScore={opponentScore}
            username={username}
            opponent={opponent}
            multiplier={multiplier}
            winStreak={winStreak}
            myElo={myElo}
            opponentElo={opponentElo}
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
            wagerAmount={wagerAmount}
            myElo={myElo}
            myEloDelta={myEloDelta}
            opponentElo={opponentElo}
          />
        )}

        {/* Settings always visible */}
        <Settings username={username} onChangeUsername={handleChangeUsername} />
      </div>
    </div>
  );
}
