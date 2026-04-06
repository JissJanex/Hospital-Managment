import { useMemo, useState } from 'react'

const weekDaysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const weekDayTokenMap = {
  mon: 'Mon',
  monday: 'Mon',
  tue: 'Tue',
  tues: 'Tue',
  tuesday: 'Tue',
  wed: 'Wed',
  wednesday: 'Wed',
  thu: 'Thu',
  thur: 'Thu',
  thurs: 'Thu',
  thursday: 'Thu',
  fri: 'Fri',
  friday: 'Fri',
  sat: 'Sat',
  saturday: 'Sat',
  sun: 'Sun',
  sunday: 'Sun',
}

function parseAvailableDays(rawValue) {
  const unique = new Set(
    String(rawValue ?? '')
      .split(',')
      .map((part) => weekDayTokenMap[part.trim().toLowerCase()])
      .filter(Boolean),
  )

  return weekDaysOrder.filter((day) => unique.has(day))
}

function getWeekdayShortFromIsoDate(isoDate) {
  const [year, month, day] = String(isoDate ?? '')
    .split('-')
    .map((part) => Number(part))

  if (!year || !month || !day) {
    return ''
  }

  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
}

function AddEntityModal({ config, onClose, onSubmit, isSubmitting, submitError }) {
  const fields = useMemo(() => config?.fields ?? [], [config])

  const initialValues = useMemo(
    () =>
      Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ''])),
    [fields],
  )

  const [formValues, setFormValues] = useState(initialValues)
  const [formError, setFormError] = useState('')

  if (!config) {
    return null
  }

  const isDoctorModal = config.title.toLowerCase().includes('doctor')
  const isAppointmentModal = config.title.toLowerCase().includes('appointment')

  const selectedDays = new Set(parseAvailableDays(formValues.available_days))

  const doctorField = fields.find((field) => field.name === 'doctor_id')
  const selectedDoctorOption = (doctorField?.options ?? []).find(
    (option) => String(option.value) === String(formValues.doctor_id),
  )
  const selectedDoctorWorkingDays = parseAvailableDays(selectedDoctorOption?.availableDays)

  const handleChange = (fieldName, value) => {
    if (formError) {
      setFormError('')
    }

    setFormValues((prev) => ({ ...prev, [fieldName]: value }))
  }

  const toggleWeekday = (day) => {
    if (formError) {
      setFormError('')
    }

    setFormValues((prev) => {
      const next = new Set(parseAvailableDays(prev.available_days))

      if (next.has(day)) {
        next.delete(day)
      } else {
        next.add(day)
      }

      const ordered = weekDaysOrder.filter((d) => next.has(d))

      return { ...prev, available_days: ordered.join(', ') }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const missingRequired = fields.find(
      (field) => field.required && !String(formValues[field.name]).trim(),
    )

    if (missingRequired) {
      window.alert(`Please fill required field: ${missingRequired.label}`)
      return
    }

    if (isAppointmentModal) {
      const appointmentDay = getWeekdayShortFromIsoDate(formValues.appointment_date)

      if (appointmentDay && selectedDoctorWorkingDays.length > 0) {
        if (!selectedDoctorWorkingDays.includes(appointmentDay)) {
          const validationMessage = `The selected doctor is available only on ${selectedDoctorWorkingDays.join(', ')}. Please choose a ${appointmentDay} appointment with another doctor or pick a different date.`
          setFormError(validationMessage)
          window.alert(validationMessage)
          return
        }
      }
    }

    await onSubmit(formValues)
  }

  return (
    <div key={JSON.stringify(initialValues)} className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
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

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            <div className="field-grid">
            {fields.map((field) => {
              // Special UI for doctor's available_days: show weekday checkboxes
              if (field.name === 'available_days' && isDoctorModal) {
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                return (
                  <label key={field.name} className="field-control">
                    <span>
                      {field.label}
                      {field.required ? <span className="required-tag">Required</span> : null}
                    </span>

                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {days.map((d) => (
                          <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="checkbox"
                              checked={selectedDays.has(d)}
                              onChange={() => toggleWeekday(d)}
                              disabled={isSubmitting}
                            />
                            <span>{d}</span>
                          </label>
                        ))}
                      </div>

                      <input
                        type="text"
                        readOnly
                        value={formValues[field.name]}
                        placeholder="Selected days will appear here (e.g. Mon, Tue, Wed)"
                      />
                    </div>

                    {field.helpText ? <small className="field-help">{field.helpText}</small> : null}
                  </label>
                )
              }

              return (
                <label key={field.name} className="field-control">
                  <span>
                    {field.label}
                    {field.required ? <span className="required-tag">Required</span> : null}
                  </span>
                  {field.control === 'select' ? (
                    <select
                      required={field.required}
                      disabled={isSubmitting || field.disabled}
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
                      disabled={isSubmitting || field.disabled}
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
                      disabled={isSubmitting || field.disabled}
                      value={formValues[field.name]}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                      placeholder={field.label}
                    />
                  )}
                  {isAppointmentModal && field.name === 'doctor_id' ? (
                    <small className="field-help">
                      {selectedDoctorOption
                        ? selectedDoctorWorkingDays.length > 0
                          ? `Doctor working days: ${selectedDoctorWorkingDays.join(', ')}`
                          : 'Doctor working days are not configured.'
                        : 'Select a doctor to view working days.'}
                    </small>
                  ) : null}
                  {field.helpText ? <small className="field-help">{field.helpText}</small> : null}
                </label>
              )
            })}
            </div>

            {formError ? <p className="form-message error-text">{formError}</p> : null}
            {submitError ? <p className="form-message error-text">{submitError}</p> : null}
          </div>

          <footer className="modal-footer">
            <button type="button" className="action-btn ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="action-btn primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Confirm'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default AddEntityModal
