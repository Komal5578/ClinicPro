const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const db = require('./src/config/db');
const { PORT } = require('./src/config/env');
const { startReminderJob } = require('./src/jobs/reminder.job');
const { initializeSchema } = require('./src/config/init');

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeSchema();
  startReminderJob();
});