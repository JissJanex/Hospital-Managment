import { useMemo, useState } from 'react'
import './App.css'
import DataTable from './components/DataTable'
import AddEntityModal from './components/AddEntityModal'
import OverviewPanel from './components/OverviewPanel'
import Sidebar from './components/Sidebar'
import StatsGrid from './components/StatsGrid'
import Topbar from './components/Topbar'
import {
  appointmentData,
  billData,
  departmentData,
  doctorData,
  labTestData,
  medicalRecordData,
  navigation,
  patientData,
  prescriptionData,
} from './data/hmsData'
import { addEntityConfig } from './config/addEntityConfig'
import { dateOnly, dateTime, money } from './utils/formatters'

function App() {
  const [activeSection, setActiveSection] = useState('overview')
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [modalSection, setModalSection] = useState(null)

  const deptLookup = useMemo(
    () => Object.fromEntries(departmentData.map((dept) => [dept.dept_id, dept.dept_name])),
    [],
  )
  const patientLookup = useMemo(
    () => Object.fromEntries(patientData.map((patient) => [patient.patient_id, patient.name])),
    [],
  )
  const doctorLookup = useMemo(
    () => Object.fromEntries(doctorData.map((doctor) => [doctor.doctor_id, doctor.name])),
    [],
  )

  const outstanding = billData.reduce((sum, bill) => sum + bill.balance, 0)
  const todayRevenue = billData.reduce((sum, bill) => sum + bill.paid_amount, 0)
  const pendingAppointments = appointmentData.filter((item) => item.status !== 'Completed').length

  const renderBadge = (value) => (
    <span className={`status-chip status-${String(value).toLowerCase().replace(/\s+/g, '-')}`}>
      {value}
    </span>
  )

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
        { key: 'consultation_fee', label: 'Fee', render: (value) => money.format(value) },
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
        { key: 'dob', label: 'DOB', render: (value) => dateOnly.format(new Date(value)) },
        { key: 'gender', label: 'Gender' },
        { key: 'phone', label: 'Phone' },
        { key: 'blood_group', label: 'Blood Group' },
        { key: 'allergies', label: 'Allergies' },
        {
          key: 'registered_date',
          label: 'Registered Date',
          render: (value) => dateTime.format(new Date(value)),
        },
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
        {
          key: 'appointment_date',
          label: 'Appointment Date',
          render: (value) => dateOnly.format(new Date(value)),
        },
        { key: 'time_slot', label: 'Time Slot', render: (value) => value.slice(0, 5) },
        { key: 'status', label: 'Status', render: renderBadge },
        { key: 'type', label: 'Type' },
        {
          key: 'created_at',
          label: 'Created At',
          render: (value) => dateTime.format(new Date(value)),
        },
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
        { key: 'visit_date', label: 'Visit Date', render: (value) => dateTime.format(new Date(value)) },
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
        { key: 'order_date', label: 'Order Date', render: (value) => dateTime.format(new Date(value)) },
        { key: 'status', label: 'Status', render: renderBadge },
        { key: 'price', label: 'Price', render: (value) => money.format(value) },
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
        { key: 'bill_date', label: 'Bill Date', render: (value) => dateTime.format(new Date(value)) },
        { key: 'description', label: 'Description' },
        { key: 'total_amount', label: 'Total', render: (value) => money.format(value) },
        { key: 'paid_amount', label: 'Paid', render: (value) => money.format(value) },
        { key: 'balance', label: 'Balance', render: (value) => money.format(value) },
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

  return (
    <div className="hms-shell">
      <Sidebar
        navigation={navigation}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOpenAddModal={setModalSection}
      />

      <main className="main-content">
        <Topbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
        />

        <StatsGrid
          patientCount={patientData.length}
          doctorCount={doctorData.length}
          pendingAppointments={pendingAppointments}
          outstandingTotal={money.format(outstanding)}
          revenueTotal={money.format(todayRevenue)}
        />

        {activeSection === 'overview' ? (
          <OverviewPanel modules={filteredOverviewModules} onOpenModule={setActiveSection} />
        ) : (
          <DataTable
            title={filteredModules[activeSection].title}
            subtitle={filteredModules[activeSection].subtitle}
            columns={filteredModules[activeSection].columns}
            rows={filteredModules[activeSection].rows}
          />
        )}
      </main>

      <AddEntityModal config={addEntityConfig[modalSection] ?? null} onClose={() => setModalSection(null)} />
    </div>
  )
}

export default App
