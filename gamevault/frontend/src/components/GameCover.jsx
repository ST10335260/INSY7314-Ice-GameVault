/**
 * Every game gets a generated "cartridge label" cover so the catalogue looks complete
 * without depending on external images. A real https cover image is used if set.
 */
function hueFor(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 100003;
  return Math.round(hash * 137.508) % 360; // golden-angle spread gives well-separated colours
}

export default function GameCover({ game, size = 'md' }) {
  if (game.coverImage) {
    return <img className={`cover cover-${size}`} src={game.coverImage} alt={`${game.title} cover`} />;
  }
  const hue = hueFor(game.title);
  const style = {
    background: `linear-gradient(160deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 60% 22%))`,
  };
  return (
    <div className={`cover cover-${size}`} style={style} role="img" aria-label={`${game.title} cover`}>
      <span className="cover-genre">{game.genre}</span>
      <span className="cover-title">{game.title}</span>
    </div>
  );
}
