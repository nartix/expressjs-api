import pgpool from './connection.js';

import { readFileSync } from 'fs';

const schema = readFileSync('./schema.sql').toString();

// console.log(schema);
// process.exit();

pgpool.query('SELECT * FROM people', (err, res) => {
  console.log(err, res);
});

// not needed in production website or scripts
// as it will timeout or end after script finishes or crushes
//pgpool.end();
