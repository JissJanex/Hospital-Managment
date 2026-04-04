function StatsGrid({ patientCount, doctorCount, pendingAppointments, outstandingTotal, revenueTotal }) {
  return (
    <section className="stats-grid">
      <article className="surface stat-card">
        <p>Total Patients</p>
        <h3>{patientCount.toLocaleString()}</h3>
      </article>
      <article className="surface stat-card">
        <p>Total Doctors</p>
        <h3>{doctorCount.toLocaleString()}</h3>
      </article>
      <article className="surface stat-card">
        <p>Pending Appointments</p>
        <h3>{pendingAppointments.toLocaleString()}</h3>
      </article>
      <article className="surface stat-card">
        <p>Total Outstanding</p>
        <h3>{outstandingTotal}</h3>
      </article>
      <article className="surface stat-card emphasis">
        <p>Collected Revenue</p>
        <h3>{revenueTotal}</h3>
      </article>
    </section>
  )
}

export default StatsGrid
