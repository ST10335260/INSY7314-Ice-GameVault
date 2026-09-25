import { Link } from 'react-router-dom';
import GameCover from './GameCover.jsx';
import Stars from './Stars.jsx';

export default function GameCard({ game, children }) {
  return (
    <article className="game-card">
      <Link to={`/games/${game._id}`} className="game-card-link">
        <GameCover game={game} />
        <h3>{game.title}</h3>
      </Link>
      <p className="meta">{game.genre}, {game.releaseYear}</p>
      <Stars value={game.averageRating} count={game.reviewCount} />
      {children && <div className="game-card-actions">{children}</div>}
    </article>
  );
}
