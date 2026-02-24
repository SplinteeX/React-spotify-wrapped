// src/components/Header.jsx
function Header({ profile, isDemoMode, playerError, onLogout }) {
  return (
    <div className="header">
      <div className="header-left">
        <h1>
          🎵 Spotify Wrappy
          {isDemoMode && <span className="demo-tag">DEMO MODE</span>}
        </h1>
        <div className="user-info">
          {profile?.images?.[0] && (
            <img
              src={profile.images[0].url}
              alt={profile.display_name}
              className="user-avatar"
            />
          )}
          <div>
            <p className="user-name">
              {profile?.display_name}
              {isDemoMode && " (Demo User)"}
            </p>
            <p className="user-details">
              {profile?.followers?.total?.toLocaleString()} followers •{" "}
              {profile?.product} • {profile?.following_count || 0} following
              {isDemoMode && " • Demo Data"}
            </p>
          </div>
        </div>
      </div>
      <div className="header-right">
        {playerError && <div className="player-error">⚠️ {playerError}</div>}
        <button className="logout-button" onClick={onLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M17 16L21 12M21 12L17 8M21 12H7M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isDemoMode ? "Exit & Log In" : "Log out"}
        </button>
      </div>
    </div>
  );
}

export default Header;
