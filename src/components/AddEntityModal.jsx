import { useEffect, useMemo, useState } from 'react'

function AddEntityModal({ config, onClose }) {
  const fields = useMemo(() => config?.fields ?? [], [config])

  const initialValues = useMemo(() => Object.fromEntries(fields.map((field) => [field.name, ''])), [fields])

  const [formValues, setFormValues] = useState(initialValues)

  useEffect(() => {
    setFormValues(initialValues)
  }, [initialValues])

  if (!config) {
    return null
  }

  const handleChange = (fieldName, value) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const missingRequired = fields.find(
      (field) => field.required && !String(formValues[field.name]).trim(),
    )

    if (missingRequired) {
      window.alert(`Please fill required field: ${missingRequired.label}`)
      return
    }

    onClose()
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <section className="modal-card surface">
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">Create New Entry</p>
            <h2 id="modal-title">{config.title}</h2>
            <p>{config.description}</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            x
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="field-grid">
            {fields.map((field) => (
              <label key={field.name} className="field-control">
                <span>
                  {field.label}
                  {field.required ? <span className="required-tag">Required</span> : null}
                </span>
                <input
                  type={field.type}
                  required={field.required}
                  step={field.step}
                  value={formValues[field.name]}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  placeholder={field.label}
                />
              </label>
            ))}
          </div>

          <footer className="modal-footer">
            <button type="button" className="action-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-btn primary">
              Save Draft
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default AddEntityModal
