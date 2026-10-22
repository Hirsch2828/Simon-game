import SimonBoard from '../components/SimonBoard';
import PrimaryButton from '../components/PrimaryButton';
import './Screen.css';
import './HomeScreen.css';

export default function HomeScreen() {
  return (
    <main className="screen home-screen">
      <h1 className="screen__title">סיימון</h1>
      <h2 className="home-screen__level">
        שלב <bdi>1</bdi> מתוך <bdi>10</bdi>
      </h2>
      {/* Reserved status line; game states fill it in later milestones */}
      <p className="home-screen__status" aria-live="polite" />
      <SimonBoard disabled />
      <div className="home-screen__action">
        {/* No game logic yet in Milestone 1 */}
        <PrimaryButton>התחל משחק</PrimaryButton>
      </div>
    </main>
  );
}
