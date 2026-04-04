function DataTable({
  title,
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = 'No records match your current search.',
}) {
  return (
    <section className="surface panel table-panel">
      <header className="panel-header">
        <div>
          <h2>{title}</h2>
        </div>
        <button type="button" className="action-btn ghost">
          Export CSV
        </button>
      </header>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-row">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row[rowKey] ?? Object.values(row)[0]}
                  className={onRowClick ? 'clickable-row' : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <td key={`${row[rowKey] ?? Object.values(row)[0]}-${column.key}`}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default DataTable
