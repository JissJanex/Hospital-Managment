function SidebarAddActions({ items, activeSection, onOpenAddModal }) {
  const activeItem = items.find((item) => item.id === activeSection)

  if (!activeItem) {
    return null
  }

  return (
    <section className="add-actions">
      <p className="add-actions-title">Quick Add</p>
      <div className="add-actions-list">
        <button
          type="button"
          className="action-btn primary add-entity-btn"
          onClick={() => onOpenAddModal(activeItem.id)}
        >
          Add {activeItem.label}
        </button>
      </div>
    </section>
  )
}

export default SidebarAddActions
