function Topbar({ searchValue, onSearchChange, onSearchSubmit }) {
  return (
    <header className="topbar surface">
      <div>
        <p className="eyebrow">Clinical Zen HMS</p>
        <h2>Hospital Management Interface</h2>
      </div>
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
    </header>
  )
}

export default Topbar
