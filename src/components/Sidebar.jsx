import SidebarAddActions from './SidebarAddActions'

function Sidebar({ navigation, activeSection, onSectionChange, onOpenAddModal }) {
  const entityItems = navigation.filter((item) => item.id !== 'overview')

  return (
    <aside className="sidebar surface">
      <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Hospital icon"
            >
              <rect x="3" y="6" width="18" height="13" rx="2" fill="currentColor" opacity="0.07" />
              <rect x="7.5" y="9.5" width="2" height="2" fill="#fff" rx="0.2" />
              <rect x="14.5" y="9.5" width="2" height="2" fill="#fff" rx="0.2" />
              <path d="M11 16h2v-2h2v-2h-2V10h-2v2H9v2h2z" fill="#fff" />
            </svg>
          </span>
          <div>
            <h1>Hosptial</h1>
            <p>mangement systme</p>
          </div>
      </div>

      <nav>
        {navigation.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <SidebarAddActions
        items={entityItems}
        activeSection={activeSection}
        onOpenAddModal={onOpenAddModal}
      />
    </aside>
  )
}

export default Sidebar
