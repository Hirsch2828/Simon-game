import { useEffect, useRef, useState } from 'react';
import BottomNav, { type Screen } from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';
import { useGame } from './game/useGame';
import { useHistory } from './history/useHistory';

// App shell: owns the active screen in memory (no router, no URL change),
// the game controller and the history, so switching screens does not unmount them.
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const game = useGame();
  const history = useHistory();
  const { status, gameId, completedRounds } = game.state;
  const { record, dismissSaveError } = history;

  // Record a finished game exactly once, right when it ends (ARCHITECTURE §2.3 rule 8, ADR-4).
  // The ref is set before writing, so Strict Mode's double effects cannot add a second record.
  const recordedGameRef = useRef<number | null>(null);
  useEffect(() => {
    if (status !== 'won' && status !== 'lost') return;
    if (recordedGameRef.current === gameId) return;
    recordedGameRef.current = gameId;
    record(completedRounds, status === 'won' ? 'win' : 'loss');
  }, [status, gameId, completedRounds, record]);

  // A save failure message belongs to the game that just ended only
  useEffect(() => {
    if (status === 'idle') dismissSaveError();
  }, [status, dismissSaveError]);

  const navigate = (next: Screen) => {
    // Leaving to About pauses an active game; coming back never resumes it by itself
    if (next === 'about') game.pause();
    setScreen(next);
  };

  return (
    <>
      {screen === 'home' ? (
        <HomeScreen game={game} saveError={history.saveError} />
      ) : (
        <AboutScreen history={history} />
      )}
      <BottomNav active={screen} onNavigate={navigate} />
    </>
  );
}
