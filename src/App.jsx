import { useEffect, useMemo, useState } from 'react'
import './App.css'
import DataTable from './components/DataTable'
import AddEntityModal from './components/AddEntityModal'
import RecordDetailModal from './components/RecordDetailModal'
import OverviewPanel from './components/OverviewPanel'
import Sidebar from './components/Sidebar'
import StatsGrid from './components/StatsGrid'
import Topbar from './components/Topbar'
import SignInPage from './components/SignInPage'
import ConfirmLogoutModal from './components/ConfirmLogoutModal'
import { addEntityConfig } from './config/addEntityConfig'
import { navigation } from './config/navigation'
import {
  getCurrentSession,
  isSupabaseConfigured,
  signInWithEmail,
  signOutUser,
  subscribeToAuthChanges,
  supabaseConfigError,
} from './lib/supabase'
import {
  emptyHospitalData,
  fetchHospitalData,
  getTablePrimaryKey,
  insertHospitalRecord,
  updateHospitalRecord,
  deleteHospitalRecord,
} from './services/hospitalData'
import { dateOnly, dateTime, money } from './utils/formatters'

const relationCopy = {
  department: { singular: 'department', plural: 'departments' },
  doctor: { singular: 'doctor', plural: 'doctors' },
  patient: { singular: 'patient', plural: 'patients' },
}

function App() {
  const [session, setSession] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
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
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [detailError, setDetailError] = useState('')
  const [isDetailSubmitting, setIsDetailSubmitting] = useState(false)

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

    if (!isSupabaseConfigured) {
      setAuthError(supabaseConfigError)
      setIsAuthLoading(false)
      return undefined
    }

    const initializeAuth = async () => {
      try {
        const activeSession = await getCurrentSession()

        if (!isMounted) {
          return
        }

        setSession(activeSession)
        setAuthError('')
      } catch (error) {
        if (!isMounted) {
          return
        }

        setAuthError(
          error instanceof Error
            ? error.message
            : 'Unable to verify your authentication session.',
        )
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    initializeAuth()

    const unsubscribe = subscribeToAuthChanges((nextSession) => {
      if (!isMounted) {
        return
      }

      setSession(nextSession)

      if (nextSession) {
        setAuthError('')
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (isAuthLoading) {
        return
      }

      if (!isSupabaseConfigured) {
        setLoadError(supabaseConfigError)
        setIsLoading(false)
        return
      }

      if (!session) {
        setHospitalData(emptyHospitalData)
        setLoadError('')
        setIsLoading(false)
        return
      }

      setIsLoading(true)

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
  }, [isAuthLoading, session])

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
        availableDays: doctor.available_days ?? '',
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
        module.rows.length > 0
      )
    }),
  )

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    setAppliedSearch(searchInput)
  }

  const handleLogoutRequest = () => {
    setShowLogoutConfirm(true)
  }

  const handleSignIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      setAuthError(supabaseConfigError)
      return
    }

    setIsSigningIn(true)
    setAuthError('')

    try {
      await signInWithEmail(email, password)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    if (!isSupabaseConfigured) {
      setAuthError(supabaseConfigError)
      return
    }

    setIsSigningOut(true)
    setAuthError('')
    setStatusMessage('')

    try {
      await signOutUser()
      setShowLogoutConfirm(false)
      setSelectedRecord(null)
      setModalSection(null)
      setSubmitError('')
      setDetailError('')
      setSearchInput('')
      setAppliedSearch('')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign out.')
    } finally {
      setIsSigningOut(false)
    }
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

      setStatusMessage(`${config.title.replace(/^Add\s+/, '')} saved successfully.`)
      setModalSection(null)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create record.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRowClick = (row) => {
    setDetailError('')
    setSelectedRecord(row)
  }

  const handleCloseDetail = () => {
    if (isDetailSubmitting) return
    setSelectedRecord(null)
    setDetailError('')
  }

  const detailFields = useMemo(() => {
    if (!selectedRecord || activeSection === 'overview') return []

    const config = addEntityConfig[activeSection]
    if (!config) return []

    return config.fields.map((field) => ({
      ...field,
      options: field.optionsKey ? modalOptionSets[field.optionsKey] ?? [] : field.options,
    }))
  }, [selectedRecord, activeSection, modalOptionSets])

  const handleUpdateRecord = async (formValues) => {
    if (!selectedRecord || activeSection === 'overview') return

    const primaryKey = getTablePrimaryKey(activeSection)
    const primaryKeyValue = selectedRecord[primaryKey]
    const config = addEntityConfig[activeSection]
    if (!config) return

    setIsDetailSubmitting(true)
    setDetailError('')

    try {
      await updateHospitalRecord(activeSection, primaryKeyValue, config.fields, formValues)
      const refreshedData = await fetchHospitalData()
      setHospitalData(refreshedData)
      setStatusMessage('Record updated successfully.')
      setSelectedRecord(null)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Unable to update record.')
    } finally {
      setIsDetailSubmitting(false)
    }
  }

  const handleDeleteRecord = async () => {
    if (!selectedRecord || activeSection === 'overview') return

    const primaryKey = getTablePrimaryKey(activeSection)
    const primaryKeyValue = selectedRecord[primaryKey]

    setIsDetailSubmitting(true)
    setDetailError('')

    try {
      await deleteHospitalRecord(activeSection, primaryKeyValue)
      const refreshedData = await fetchHospitalData()
      setHospitalData(refreshedData)
      setStatusMessage('Record deleted successfully.')
      setSelectedRecord(null)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Unable to delete record.')
    } finally {
      setIsDetailSubmitting(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="signin-shell">
        <section className="signin-card surface" aria-live="polite">
          <p className="signin-tag">Hospital Management Platform</p>
          <h1>Checking your secure session...</h1>
          <p className="signin-subtitle">Connecting to Supabase authentication.</p>
        </section>
      </div>
    )
  }

  if (!session) {
    return (
      <SignInPage
        onSignIn={handleSignIn}
        isSubmitting={isSigningIn}
        submitError={authError}
        configError={!isSupabaseConfigured ? supabaseConfigError : ''}
      />
    )
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
          currentUser={session.user?.email ?? 'Authenticated user'}
          onLogoutRequest={handleLogoutRequest}
          isLoggingOut={isSigningOut}
        />

        {isLoading ? (
          <section className="surface sync-banner">
            Loading live hospital data from Supabase...
          </section>
        ) : null}

        {loadError ? <section className="surface sync-banner error-banner">{loadError}</section> : null}

        {authError ? <section className="surface sync-banner error-banner">{authError}</section> : null}

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
            columns={filteredModules[activeSection].columns}
            rows={filteredModules[activeSection].rows}
            rowKey={getTablePrimaryKey(activeSection)}
            onRowClick={handleRowClick}
            emptyMessage={
              isLoading
                ? 'Loading records from Supabase...'
                : 'No records match your current search.'
            }
          />
        )}
      </main>

      <AddEntityModal
        key={modalSection ? `${modalSection}-${Date.now()}` : undefined}
        config={modalConfig}
        onClose={handleCloseAddModal}
        onSubmit={handleCreateEntity}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />

      {selectedRecord ? (
        <RecordDetailModal
          record={selectedRecord}
          fields={detailFields}
          title={filteredModules[activeSection]?.title ?? 'Record'}
          onClose={handleCloseDetail}
          onUpdate={handleUpdateRecord}
          onDelete={handleDeleteRecord}
          isSubmitting={isDetailSubmitting}
          submitError={detailError}
        />
      ) : null}

      {showLogoutConfirm ? (
        <ConfirmLogoutModal
          onConfirm={handleSignOut}
          onCancel={() => setShowLogoutConfirm(false)}
          isProcessing={isSigningOut}
          error={authError}
        />
      ) : null}

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
