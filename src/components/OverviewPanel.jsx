function OverviewPanel({ modules, onOpenModule }) {
  return (
    <section className="surface panel overview-panel">
      <h2>Modules</h2>
      <p>
        Select a module from the left or below to view and manage records.
      </p>

      <div className="quick-grid">
        {Object.keys(modules).length === 0 ? (
          <article className="quick-card">
            <h3>No modules found</h3>
            <p>Try a different search keyword to find data modules.</p>
          </article>
        ) : (
          Object.entries(modules).map(([key, module]) => (
            <article key={key} className="quick-card">
              <h3>{module.title}</h3>
              <p>{module.rows.length} record{module.rows.length !== 1 ? 's' : ''}</p>
              <button type="button" className="action-btn ghost" onClick={() => onOpenModule(key)}>
                Open Module
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export default OverviewPanel
