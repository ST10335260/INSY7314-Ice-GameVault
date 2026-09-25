export default function Stars({ value = 0, count }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" aria-label={`Rated ${value} out of 5`}>
      <span aria-hidden="true">
        {'★'.repeat(rounded)}
        <span className="stars-off">{'★'.repeat(5 - rounded)}</span>
      </span>
      {count !== undefined && <span className="stars-count">{count ? `${value} (${count})` : 'No reviews yet'}</span>}
    </span>
  );
}
