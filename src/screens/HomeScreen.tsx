import SimonBoard from '../components/SimonBoard';
import PrimaryButton from '../components/PrimaryButton';
import ResultDialog from '../components/ResultDialog';
import { TOTAL_ROUNDS } from '../game/config';
import type { GameController } from '../game/useGame';
import './Screen.css';
import './HomeScreen.css';

interface HomeScreenProps {
  game: GameController;
  /** Saving the finished game to history failed */
  saveError?: boolean;
}

export default function HomeScreen({ game, saveError = false }: HomeScreenProps) {
  const { state, shownRound, litColor, resultVisible, audioError } = game;
  const { status } = state;

  const showError = Boolean(audioError) && (status === 'idle' || status === 'paused');
  let statusText = '';
  let hint = '';
  if (status === 'paused') statusText = 'המשחק מושהה';
  if (showError && audioError) statusText = audioError;
  if (status === 'presenting') statusText = 'המשחק מציג את הרצף';
  if (status === 'awaitingInput') {
    statusText = 'התור שלך';
    hint = 'הקש על הצבעים לפי הסדר';
  }

  return (
    <main className="screen home-screen">
      <h1 className="screen__title">סיימון</h1>
      <h2 className="home-screen__level">
        שלב <bdi>{shownRound}</bdi> מתוך <bdi>{TOTAL_ROUNDS}</bdi>
      </h2>
      <p
        className={`home-screen__status${showError ? ' home-screen__status--error' : ''}`}
        aria-live="polite"
        role={showError ? 'alert' : undefined}
      >
        {statusText}
      </p>
      <SimonBoard
        disabled={status !== 'awaitingInput'}
        dimmed={status === 'presenting' || status === 'paused'}
        litColor={litColor}
        onPadDown={game.pressDown}
        onPadUp={game.pressUp}
      />
      <div className="home-screen__action">
        {status === 'idle' && <PrimaryButton onClick={() => void game.startGame()}>התחל משחק</PrimaryButton>}
        {status === 'paused' && <PrimaryButton onClick={() => void game.resumeGame()}>המשך משחק</PrimaryButton>}
        {hint && <p className="home-screen__hint">{hint}</p>}
      </div>
      {resultVisible && (status === 'won' || status === 'lost') && (
        <ResultDialog
          outcome={status}
          completedRounds={state.completedRounds}
          saveError={saveError}
          onConfirm={game.dismiss}
        />
      )}
    </main>
  );
}
