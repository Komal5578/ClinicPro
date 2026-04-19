const app = require('./app');
const db = require('./src/config/db');
const { PORT } = require('./src/config/env');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});