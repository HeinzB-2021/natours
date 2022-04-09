const mongoose = require('mongoose');
const dotenv = require('dotenv');

//eventuelle Programmierfehler im sync Ablauf
process.on('uncaughtException', (err) => {
  console.log(err);
  console.log('UNCAUTH EXEPTION!💥 Fährt runter!!');

  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    // console.log('DB-Verbindung erfolgreich');
  });

//console.log(process.env);
//Start the server
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  // console.log(`App läuft auf Port ${port}...`);
});

//nicht eingelöste async promises
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!💥 Fährt runter!!');
  server.close(() => {
    process.exit(1);
  });
});
