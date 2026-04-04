import { useState } from 'react'

function RecordDetailModal({
  record,
  fields,
  title,
  onClose,
  onUpdate,
  onDelete,
  isSubmitting,
  submitError,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [formValues, setFormValues] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!record) {
    return null
  }

  const handleEdit = () => {
    const values = {}
    for (const field of fields) {
      const value = record[field.name]
      values[field.name] = value != null ? String(value) : ''
    }
    setFormValues(values)
    setIsEditing(true)
  }

  const handleChange = (fieldName, value) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleSave = (event) => {
    event.preventDefault()
    onUpdate(formValues)
  }

  const handleDelete = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    onDelete()
  }

  const renderFieldValue = (field) => {
    const value = record[field.name]
    if (value == null || value === '') return <span style={{ color: 'var(--ink-500)' }}>N/A</span>

    if (field.control === 'select' && field.options) {
      const option = field.options.find((opt) => String(opt.value) === String(value))
      if (option) return option.label
    }

    return String(value)
  }

  const renderFieldInput = (field) => {
    const value = formValues[field.name] ?? ''

    if (field.control === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(field.name, e.target.value)}
          disabled={isSubmitting || field.disabled}
        >
          <option value="">{field.placeholder ?? `Select ${field.label}`}</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )
    }

    if (field.control === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => handleChange(field.name, e.target.value)}
          disabled={isSubmitting}
        />
      )
    }

    return (
      <input
        type={field.type ?? 'text'}
        value={value}
        onChange={(e) => handleChange(field.name, e.target.value)}
        step={field.step}
        disabled={isSubmitting}
      />
    )
  }

  return (
    <div className="modal-overlay" onClick={isSubmitting ? undefined : onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Record Details</p>
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            x
          </button>
        </div>

        {isEditing ? (
          <form className="modal-form" onSubmit={handleSave}>
            <div className="modal-body">
              <div className="field-grid">
                {fields.map((field) => (
                  <div key={field.name} className="field-control">
                    <span>
                      {field.label}
                      {field.required ? <span className="required-tag">Required</span> : null}
                    </span>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>

              {submitError ? (
                <div className="form-message">
                  <p className="error-text">{submitError}</p>
                </div>
              ) : null}
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="action-btn ghost"
                onClick={() => {
                  setIsEditing(false)
                  setShowDeleteConfirm(false)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button type="submit" className="action-btn primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </footer>
          </form>
        ) : (
          <>
            <div className="modal-body">
              <div className="detail-grid">
                {fields.map((field) => (
                  <div key={field.name} className="detail-field">
                    <span className="detail-label">{field.label}</span>
                    <span className="detail-value">{renderFieldValue(field)}</span>
                  </div>
                ))}
              </div>

              {submitError ? (
                <div className="form-message">
                  <p className="error-text">{submitError}</p>
                </div>
              ) : null}
            </div>

            <footer className="modal-footer">
              {showDeleteConfirm ? (
                <>
                  <span className="delete-confirm-text">Are you sure?</span>
                  <button
                    type="button"
                    className="action-btn ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSubmitting}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className="action-btn danger"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="action-btn danger-ghost"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="action-btn primary"
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                </>
              )}
            </footer>
          </>
        )}
      </div>
    </div>
  )
}

export default RecordDetailModal
