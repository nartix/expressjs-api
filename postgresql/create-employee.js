import { dbmc } from './connection.js';
import { readFileSync } from 'fs';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const employeeSchema = readFileSync(`${__dirname}/schema.sql`).toString();

await dbmc.connect();

await dbmc.query(employeeSchema, (err, res) => {
  if (err) {
    console.log(err.stack);
  } else {
    console.log(res);
  }
  // no need to wait as the last statement
  dbmc.end();
});
