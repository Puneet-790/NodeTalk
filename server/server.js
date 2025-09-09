require('dotenv').config();

const app = require('./src/app');
const dbConnection = require('./src/db/dbConnection');


app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
  dbConnection();
});