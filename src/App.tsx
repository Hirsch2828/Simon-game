import { useState } from 'react';
import BottomNav, { type Screen } from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';
import { useGame } from './game/useGame';

// App shell: owns the active screen in memory (no router, no URL change)
// and the game controller, so switching screens does not unmount the game.
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const game = useGame();

  const navigate = (next: Screen) => {
    // Temporary for Milestone 2: leaving to About cancels an active game (pause comes in Milestone 3)
    if (next === 'about') game.abandon();
    setScreen(next);
  };

  return (
    <>
      {screen === 'home' ? <HomeScreen game={game} /> : <AboutScreen />}
      <BottomNav active={screen} onNavigate={navigate} />
    </>
  );
}
