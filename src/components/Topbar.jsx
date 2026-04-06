function Topbar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  currentUser,
  onLogoutRequest,
  isLoggingOut,
}) {
  return (
    <header className="topbar surface">
      <div>
        <p className="eyebrow">Hosptial mangement system</p>
        <h2>Hosptial mangement system</h2>
      </div>

      <div className="topbar-actions">
        <form className="search-form" onSubmit={onSearchSubmit}>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by patient, doctor, bill, or record..."
          />
          <button type="submit" className="action-btn primary search-btn">
            Search
          </button>
        </form>

        <div className="user-badge" title={currentUser}>
          <span className="user-badge-label">Signed in</span>
          <span className="user-badge-value">{currentUser}</span>
        </div>

        <button
          type="button"
          className="action-btn ghost logout-btn"
          onClick={onLogoutRequest}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </header>
  )
}

export default Topbar
