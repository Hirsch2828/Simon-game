import './Screen.css';
import './AboutScreen.css';

export default function AboutScreen() {
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
        <p className="card about-screen__empty">עדיין אין משחקים שמורים.</p>
      </section>
    </main>
  );
}
