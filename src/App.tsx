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
    // Leaving to About pauses an active game; coming back never resumes it by itself
    if (next === 'about') game.pause();
    setScreen(next);
  };

  return (
    <>
      {screen === 'home' ? <HomeScreen game={game} /> : <AboutScreen />}
      <BottomNav active={screen} onNavigate={navigate} />
    </>
  );
}
