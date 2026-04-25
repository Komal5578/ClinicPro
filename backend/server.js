const app = require('./app');
const db = require('./src/config/db');
const { PORT } = require('./src/config/env');
const { startReminderJob } = require('./src/jobs/reminder.job');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startReminderJob();
});