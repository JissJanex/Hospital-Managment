import SidebarAddActions from './SidebarAddActions'

function Sidebar({ navigation, activeSection, onSectionChange, onOpenAddModal }) {
  const entityItems = navigation.filter((item) => item.id !== 'overview')

  return (
    <aside className="sidebar surface">
      <div className="brand">
        <span className="brand-mark">+</span>
        <div>
          <h1>City General</h1>
          <p>Medical Center</p>
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
