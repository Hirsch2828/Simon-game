import { useState } from 'react';
import BottomNav, { type Screen } from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';

// App shell: owns the active screen in memory (no router, no URL change).
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <>
      {screen === 'home' ? <HomeScreen /> : <AboutScreen />}
      <BottomNav active={screen} onNavigate={setScreen} />
    </>
  );
}
