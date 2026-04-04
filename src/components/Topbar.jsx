function Topbar({ searchValue, onSearchChange, onSearchSubmit }) {
  return (
    <header className="topbar surface">
      <div>
        <p className="eyebrow">Hosptial mangement systme</p>
        <h2>Hosptial mangement systme</h2>
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
