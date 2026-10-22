import type { GameResult } from '../history/historyStorage';
import { formatFinishedAt } from '../history/formatDate';
import './HistoryCard.css';

// One finished game in the About list (DESIGN §1.2, §2.3 History Cards)
export default function HistoryCard({ result }: { result: GameResult }) {
  const won = result.outcome === 'win';
  return (
    <li className="history-card">
      <div className="history-card__main">
        <span className="history-card__rounds">
          שלבים שהושלמו: <bdi>{result.completedRounds}</bdi>
        </span>
        <span className={`history-card__outcome history-card__outcome--${result.outcome}`}>
          תוצאה: {won ? 'ניצחון' : 'הפסד'}
        </span>
      </div>
      <time className="history-card__time" dateTime={result.finishedAt}>
        <bdi>{formatFinishedAt(result.finishedAt)}</bdi>
      </time>
    </li>
  );
}
