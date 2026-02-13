// src/components/views/ArtistsView.jsx
function ArtistsView({ wrappedData }) {
  return (
    <div className="wrapped-section">
      <div className="section-header">
        <h2>All Top Artists</h2>
        <span className="section-count">
          {wrappedData.artists.length} artists
        </span>
      </div>
      <div className="artists-grid full">
        {wrappedData.artists.map((artist, idx) => (
          <div key={artist.id} className="artist-card">
            <div className="artist-rank">{idx + 1}</div>
            <div className="artist-image-container">
              <img
                src={
                  artist.images?.[0]?.url || "https://via.placeholder.com/80"
                }
                alt={artist.name}
                className="artist-image"
              />
              <div className="artist-overlay">
                <span className="artist-followers">
                  {artist.followers?.total?.toLocaleString()} followers
                </span>
              </div>
            </div>
            <div className="artist-info">
              <h3 className="artist-name">{artist.name}</h3>
              <p className="artist-genres">
                {artist.genres.slice(0, 3).join(", ")}
              </p>
              <div className="artist-popularity">
                <div className="popularity-bar">
                  <div
                    className="popularity-fill"
                    style={{ width: `${artist.popularity}%` }}
                  ></div>
                </div>
                <span className="popularity-score">
                  {artist.popularity}/100
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArtistsView;
