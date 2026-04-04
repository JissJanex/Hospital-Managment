import { useEffect, useMemo, useState } from 'react'
import './App.css'
import DataTable from './components/DataTable'
import AddEntityModal from './components/AddEntityModal'
import OverviewPanel from './components/OverviewPanel'
import Sidebar from './components/Sidebar'
import StatsGrid from './components/StatsGrid'
import Topbar from './components/Topbar'
import { addEntityConfig } from './config/addEntityConfig'
import { navigation } from './config/navigation'
import { isSupabaseConfigured, supabaseConfigError } from './lib/supabase'
import {
  emptyHospitalData,
  fetchHospitalData,
  getTablePrimaryKey,
  insertHospitalRecord,
} from './services/hospitalData'
import { dateOnly, dateTime, money } from './utils/formatters'

const relationCopy = {
  department: { singular: 'department', plural: 'departments' },
  doctor: { singular: 'doctor', plural: 'doctors' },
  patient: { singular: 'patient', plural: 'patients' },
}

function App() {
  const [hospitalData, setHospitalData] = useState(emptyHospitalData)
  const [activeSection, setActiveSection] = useState('overview')
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [modalSection, setModalSection] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const departmentData = hospitalData.department
  const doctorData = hospitalData.doctor
  const patientData = hospitalData.patient
  const appointmentData = hospitalData.appointment
  const medicalRecordData = hospitalData.medical_record
  const labTestData = hospitalData.lab_test
  const prescriptionData = hospitalData.prescription
  const billData = hospitalData.bill

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (!isSupabaseConfigured) {
        setLoadError(supabaseConfigError)
        setIsLoading(false)
        return
      }

      try {
        const liveData = await fetchHospitalData()

        if (!isMounted) {
          return
        }

        setHospitalData(liveData)
        setLoadError('')
      } catch (error) {
        if (!isMounted) {
          return
        }

        setLoadError(error instanceof Error ? error.message : 'Unable to load live hospital data.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!statusMessage) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setStatusMessage('')
    }, 3000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [statusMessage])

  const deptLookup = useMemo(
    () => Object.fromEntries(departmentData.map((dept) => [dept.dept_id, dept.dept_name])),
    [departmentData],
  )
  const patientLookup = useMemo(
    () => Object.fromEntries(patientData.map((patient) => [patient.patient_id, patient.name])),
    [patientData],
  )
  const doctorLookup = useMemo(
    () => Object.fromEntries(doctorData.map((doctor) => [doctor.doctor_id, doctor.name])),
    [doctorData],
  )

  const modalOptionSets = useMemo(
    () => ({
      department: departmentData.map((department) => ({
        value: String(department.dept_id),
        label: `${department.dept_name}${department.location ? ` - ${department.location}` : ''}`,
      })),
      doctor: doctorData.map((doctor) => ({
        value: String(doctor.doctor_id),
        label: `${doctor.name}${doctor.specialization ? ` - ${doctor.specialization}` : ''}`,
      })),
      patient: patientData.map((patient) => ({
        value: String(patient.patient_id),
        label: `${patient.name}${patient.phone ? ` - ${patient.phone}` : ''}`,
      })),
    }),
    [departmentData, doctorData, patientData],
  )

  const modalConfig = useMemo(() => {
    if (!modalSection) {
      return null
    }

    const baseConfig = addEntityConfig[modalSection]

    if (!baseConfig) {
      return null
    }

    return {
      ...baseConfig,
      fields: baseConfig.fields.map((field) => ({
        ...field,
        options: field.optionsKey ? modalOptionSets[field.optionsKey] ?? [] : field.options,
        disabled:
          field.optionsKey &&
          (isLoading || (modalOptionSets[field.optionsKey] ?? []).length === 0),
        placeholder: field.optionsKey
          ? isLoading
            ? `Loading ${relationCopy[field.optionsKey]?.plural ?? field.optionsKey}...`
            : (modalOptionSets[field.optionsKey] ?? []).length === 0
              ? `No ${relationCopy[field.optionsKey]?.plural ?? field.optionsKey} available`
              : field.placeholder
          : field.placeholder,
        helpText: field.optionsKey
          ? isLoading
            ? `Loading available ${relationCopy[field.optionsKey]?.plural ?? field.optionsKey} from Supabase.`
            : (modalOptionSets[field.optionsKey] ?? []).length === 0
              ? `No ${relationCopy[field.optionsKey]?.plural ?? field.optionsKey} found. Add one first.`
              : `Choose from ${(modalOptionSets[field.optionsKey] ?? []).length} available ${relationCopy[field.optionsKey]?.plural ?? field.optionsKey}.`
          : field.helpText,
      })),
    }
  }, [isLoading, modalOptionSets, modalSection])

  const outstanding = billData.reduce((sum, bill) => sum + Number(bill.balance ?? 0), 0)
  const todayRevenue = billData.reduce((sum, bill) => sum + Number(bill.paid_amount ?? 0), 0)
  const pendingAppointments = appointmentData.filter(
    (item) => String(item.status ?? '').toLowerCase() !== 'completed',
  ).length

  const renderBadge = (value) => {
    const label = value ?? 'Unknown'

    return (
      <span className={`status-chip status-${String(label).toLowerCase().replace(/\s+/g, '-')}`}>
        {label}
      </span>
    )
  }

  const formatCurrency = (value) => money.format(Number(value ?? 0))
  const formatDateOnly = (value) => (value ? dateOnly.format(new Date(value)) : 'N/A')
  const formatDateTime = (value) => (value ? dateTime.format(new Date(value)) : 'N/A')
  const formatTime = (value) => (value ? String(value).slice(0, 5) : 'N/A')

  const modules = {
    department: {
      title: 'Department Registry',
      subtitle: 'department(dept_id, dept_name, location, phone)',
      columns: [
        { key: 'dept_id', label: 'Dept ID' },
        { key: 'dept_name', label: 'Department Name' },
        { key: 'location', label: 'Location' },
        { key: 'phone', label: 'Phone' },
      ],
      rows: departmentData,
    },
    doctor: {
      title: 'Doctor Directory',
      subtitle: 'doctor(doctor_id, name, specialization, qualification, dept_id, ...)',
      columns: [
        { key: 'doctor_id', label: 'Doctor ID' },
        { key: 'name', label: 'Name' },
        { key: 'specialization', label: 'Specialization' },
        { key: 'qualification', label: 'Qualification' },
        { key: 'dept_id', label: 'Department', render: (value) => deptLookup[value] ?? value },
        { key: 'consultation_fee', label: 'Fee', render: formatCurrency },
        { key: 'status', label: 'Status', render: renderBadge },
        { key: 'available_days', label: 'Available Days' },
      ],
      rows: doctorData,
    },
    patient: {
      title: 'Patient Registry',
      subtitle: 'patient(patient_id, name, dob, gender, phone, email, ...)',
      columns: [
        { key: 'patient_id', label: 'Patient ID' },
        { key: 'name', label: 'Name' },
        { key: 'dob', label: 'DOB', render: formatDateOnly },
        { key: 'gender', label: 'Gender' },
        { key: 'phone', label: 'Phone' },
        { key: 'blood_group', label: 'Blood Group' },
        { key: 'allergies', label: 'Allergies' },
        { key: 'registered_date', label: 'Registered Date', render: formatDateTime },
      ],
      rows: patientData,
    },
    appointment: {
      title: 'Appointment Scheduling',
      subtitle: 'appointment(doctor_id + appointment_date + time_slot unique)',
      columns: [
        { key: 'appointment_id', label: 'Appointment ID' },
        { key: 'patient_id', label: 'Patient', render: (value) => patientLookup[value] ?? value },
        { key: 'doctor_id', label: 'Doctor', render: (value) => doctorLookup[value] ?? value },
        { key: 'appointment_date', label: 'Appointment Date', render: formatDateOnly },
        { key: 'time_slot', label: 'Time Slot', render: formatTime },
        { key: 'status', label: 'Status', render: renderBadge },
        { key: 'type', label: 'Type' },
        { key: 'created_at', label: 'Created At', render: formatDateTime },
      ],
      rows: appointmentData,
    },
    medical_record: {
      title: 'Medical Records',
      subtitle: 'medical_record(record_id, patient_id, doctor_id, diagnosis, treatment, ...)',
      columns: [
        { key: 'record_id', label: 'Record ID' },
        { key: 'patient_id', label: 'Patient', render: (value) => patientLookup[value] ?? value },
        { key: 'doctor_id', label: 'Doctor', render: (value) => doctorLookup[value] ?? value },
        { key: 'visit_date', label: 'Visit Date', render: formatDateTime },
        { key: 'diagnosis', label: 'Diagnosis' },
        { key: 'treatment', label: 'Treatment' },
        { key: 'record_type', label: 'Type' },
      ],
      rows: medicalRecordData,
    },
    lab_test: {
      title: 'Lab Tests',
      subtitle: 'lab_test(test_id, test_name, status, result_value, normal_range, price)',
      columns: [
        { key: 'test_id', label: 'Test ID' },
        { key: 'patient_id', label: 'Patient', render: (value) => patientLookup[value] ?? value },
        { key: 'doctor_id', label: 'Doctor', render: (value) => doctorLookup[value] ?? value },
        { key: 'test_name', label: 'Test Name' },
        { key: 'order_date', label: 'Order Date', render: formatDateTime },
        { key: 'status', label: 'Status', render: renderBadge },
        { key: 'price', label: 'Price', render: formatCurrency },
      ],
      rows: labTestData,
    },
    prescription: {
      title: 'Prescription Ledger',
      subtitle: 'prescription(medicine_name, dosage, frequency, duration, quantity)',
      columns: [
        { key: 'prescription_id', label: 'Prescription ID' },
        { key: 'patient_id', label: 'Patient', render: (value) => patientLookup[value] ?? value },
        { key: 'doctor_id', label: 'Doctor', render: (value) => doctorLookup[value] ?? value },
        { key: 'medicine_name', label: 'Medicine' },
        { key: 'dosage', label: 'Dosage' },
        { key: 'frequency', label: 'Frequency' },
        { key: 'duration', label: 'Duration' },
        { key: 'quantity', label: 'Quantity' },
      ],
      rows: prescriptionData,
    },
    bill: {
      title: 'Billing & Invoices',
      subtitle: 'bill(total_amount, paid_amount, balance, status, payment_method)',
      columns: [
        { key: 'bill_id', label: 'Bill ID' },
        { key: 'patient_id', label: 'Patient', render: (value) => patientLookup[value] ?? value },
        { key: 'bill_date', label: 'Bill Date', render: formatDateTime },
        { key: 'description', label: 'Description' },
        { key: 'total_amount', label: 'Total', render: formatCurrency },
        { key: 'paid_amount', label: 'Paid', render: formatCurrency },
        { key: 'balance', label: 'Balance', render: formatCurrency },
        { key: 'status', label: 'Status', render: renderBadge },
        { key: 'payment_method', label: 'Payment Method' },
      ],
      rows: billData,
    },
  }

  const filterRows = (rows) => {
    if (!appliedSearch.trim()) {
      return rows
    }

    const query = appliedSearch.trim().toLowerCase()
    return rows.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(query)),
    )
  }

  const filteredModules = Object.fromEntries(
    Object.entries(modules).map(([key, module]) => [
      key,
      {
        ...module,
        rows: filterRows(module.rows),
      },
    ]),
  )

  const filteredOverviewModules = Object.fromEntries(
    Object.entries(filteredModules).filter(([, module]) => {
      if (!appliedSearch.trim()) {
        return true
      }

      const query = appliedSearch.trim().toLowerCase()
      return (
        module.title.toLowerCase().includes(query) ||
        module.subtitle.toLowerCase().includes(query) ||
        module.rows.length > 0
      )
    }),
  )

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    setAppliedSearch(searchInput)
  }

  const handleOpenAddModal = (section) => {
    setSubmitError('')
    setStatusMessage('')
    setModalSection(section)
  }

  const handleCloseAddModal = () => {
    if (isSubmitting) {
      return
    }

    setSubmitError('')
    setModalSection(null)
  }

  const handleCreateEntity = async (formValues) => {
    if (!modalSection) {
      return
    }

    const config = modalConfig

    if (!config) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setStatusMessage('')

    try {
      const createdRecord = await insertHospitalRecord(modalSection, config.fields, formValues)
      const primaryKey = getTablePrimaryKey(modalSection)

      setHospitalData((currentData) => ({
        ...currentData,
        [modalSection]: primaryKey
          ? [
              createdRecord,
              ...currentData[modalSection].filter(
                (record) => record[primaryKey] !== createdRecord[primaryKey],
              ),
            ]
          : [createdRecord, ...currentData[modalSection]],
      }))

      try {
        const refreshedData = await fetchHospitalData()
        setHospitalData(refreshedData)
        setLoadError('')
      } catch (refreshError) {
        const refreshMessage =
          refreshError instanceof Error
            ? refreshError.message
            : 'The record was created, but the latest data could not be refreshed.'

        setLoadError(refreshMessage)
      }

      setStatusMessage(`${config.title.replace(/^Add\s+/, '')} saved to Supabase.`)
      setModalSection(null)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create record.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="hms-shell">
      <Sidebar
        navigation={navigation}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOpenAddModal={handleOpenAddModal}
      />

      <main className="main-content">
        <Topbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
        />

        {isLoading ? (
          <section className="surface sync-banner">
            Loading live hospital data from Supabase...
          </section>
        ) : null}

        {loadError ? <section className="surface sync-banner error-banner">{loadError}</section> : null}

        <StatsGrid
          patientCount={patientData.length}
          doctorCount={doctorData.length}
          pendingAppointments={pendingAppointments}
          outstandingTotal={formatCurrency(outstanding)}
          revenueTotal={formatCurrency(todayRevenue)}
        />

        {activeSection === 'overview' ? (
          <OverviewPanel modules={filteredOverviewModules} onOpenModule={setActiveSection} />
        ) : (
          <DataTable
            title={filteredModules[activeSection].title}
            subtitle={filteredModules[activeSection].subtitle}
            columns={filteredModules[activeSection].columns}
            rows={filteredModules[activeSection].rows}
            rowKey={getTablePrimaryKey(activeSection)}
            emptyMessage={
              isLoading
                ? 'Loading records from Supabase...'
                : 'No records match your current search.'
            }
          />
        )}
      </main>

      <AddEntityModal
        config={modalConfig}
        onClose={handleCloseAddModal}
        onSubmit={handleCreateEntity}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />

      {statusMessage ? (
        <div className="toast-stack" aria-live="polite" aria-atomic="true">
          <div className="toast toast-success">
            <span>{statusMessage}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => setStatusMessage('')}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
