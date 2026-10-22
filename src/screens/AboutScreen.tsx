import { useState } from 'react';
import HistoryCard from '../components/HistoryCard';
import ConfirmDialog from '../components/ConfirmDialog';
import type { HistoryController } from '../history/useHistory';
import './Screen.css';
import './AboutScreen.css';

export const LOAD_ERROR_MESSAGE =
  'לא הצלחנו לקרוא את היסטוריית המשחקים. אפשר להמשיך לשחק, אבל ייתכן שהתוצאות לא יישמרו.';
export const DELETE_ERROR_MESSAGE = 'לא הצלחנו למחוק את ההיסטוריה. נסה שוב.';

interface AboutScreenProps {
  history: HistoryController;
}

export default function AboutScreen({ history }: AboutScreenProps) {
  const [confirming, setConfirming] = useState(false);
  const { results, loadError, deleteError } = history;

  const errorText = deleteError ? DELETE_ERROR_MESSAGE : loadError ? LOAD_ERROR_MESSAGE : '';

  const openConfirm = () => {
    history.dismissDeleteError();
    setConfirming(true);
  };
  const confirmDelete = () => {
    setConfirming(false);
    history.clear();
  };

  return (
    <main className="screen about-screen">
      <h1 className="screen__title">אודות</h1>

      <section className="card about-screen__info" aria-labelledby="about-game-title">
        <h2 id="about-game-title" className="about-screen__card-title">
          על המשחק
        </h2>
        <p>זכרו את רצף הצבעים שמוצג.</p>
        <p>לחצו על הצבעים באותו סדר.</p>
        <p>
          בכל שלב נוסף צבע אחד. נסו להגיע עד שלב <bdi>10</bdi>!
        </p>
      </section>

      <section aria-labelledby="history-title">
        <h2 id="history-title" className="about-screen__history-title">
          <bdi>10</bdi> המשחקים האחרונים
        </h2>
        {errorText && (
          <p className="about-screen__error" role="alert">
            {errorText}
          </p>
        )}
        {results.length === 0 ? (
          <p className="card about-screen__empty">עדיין אין משחקים שמורים.</p>
        ) : (
          <>
            <ol className="about-screen__list" aria-label="תוצאות המשחקים">
              {results.map((r) => (
                <HistoryCard key={r.id} result={r} />
              ))}
            </ol>
            <button type="button" className="about-screen__delete" onClick={openConfirm}>
              מחק היסטוריה
            </button>
          </>
        )}
      </section>

      {confirming && <ConfirmDialog onCancel={() => setConfirming(false)} onConfirm={confirmDelete} />}
    </main>
  );
}
