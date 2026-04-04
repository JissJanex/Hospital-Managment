import { useEffect, useMemo, useState } from 'react'

function AddEntityModal({ config, onClose, onSubmit, isSubmitting, submitError }) {
  const fields = useMemo(() => config?.fields ?? [], [config])

  const initialValues = useMemo(
    () =>
      Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ''])),
    [fields],
  )

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

  const handleSubmit = async (event) => {
    event.preventDefault()

    const missingRequired = fields.find(
      (field) => field.required && !String(formValues[field.name]).trim(),
    )

    if (missingRequired) {
      window.alert(`Please fill required field: ${missingRequired.label}`)
      return
    }

    await onSubmit(formValues)
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
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
            disabled={isSubmitting}
          >
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
                {field.control === 'select' ? (
                  <select
                    required={field.required}
                    disabled={isSubmitting}
                    value={formValues[field.name]}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                  >
                    <option value="">{field.placeholder ?? `Select ${field.label}`}</option>
                    {(field.options ?? []).map((option) => (
                      <option key={`${field.name}-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.control === 'textarea' ? (
                  <textarea
                    required={field.required}
                    disabled={isSubmitting}
                    value={formValues[field.name]}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    placeholder={field.label}
                    rows={4}
                  />
                ) : (
                  <input
                    type={field.type}
                    required={field.required}
                    step={field.step}
                    disabled={isSubmitting}
                    value={formValues[field.name]}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    placeholder={field.label}
                  />
                )}
              </label>
            ))}
          </div>

          {submitError ? <p className="form-message error-text">{submitError}</p> : null}

          <footer className="modal-footer">
            <button type="button" className="action-btn ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="action-btn primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save to Supabase'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default AddEntityModal
