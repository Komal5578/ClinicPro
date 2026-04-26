import Sidebar from '../../components/common/Sidebar';

const FollowUp = () => (
  <div className="layout">
    <Sidebar />
    <div className="main-content">
      <div className="page-header">
        <h2> Follow-ups</h2>
        <p>Patients due for follow-up visits</p>
      </div>
      <div className="card">
        <div className="empty-state">
          <div style={{ fontSize: 40, marginBottom: 12 }}></div>
          <p>Follow-up reminders are sent automatically when you set a follow-up date during consultation.</p>
          <p style={{ marginTop: 8, fontSize: 13 }}>Check the Reminder table in your database for scheduled reminders.</p>
        </div>
      </div>
    </div>
  </div>
);

export default FollowUp;