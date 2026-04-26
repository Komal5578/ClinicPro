// AppointmentCard for patient portal
const AppointmentCard = ({ appointment }) => (
  <div style={{
    background: 'white',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    borderLeft: '4px solid #0f6fff'
  }}>
    <div style={{ fontSize: 12, color: '#718096', marginBottom: 6 }}>
      {new Date(appointment.booked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
    </div>
    <div style={{ fontWeight: 700, fontSize: 15 }}>
       {appointment.slot_start_time?.slice(0, 5)} appointment
    </div>
    <div style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>
      Status: <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{appointment.status?.toLowerCase()}</span>
    </div>
  </div>
);

export default AppointmentCard;