import { dbmc } from './connection.js';
import { readFileSync } from 'fs';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const employeeData = JSON.parse(readFileSync(`${__dirname}/db.json`)).users;

await dbmc.connect();

const sql =
  'INSERT INTO employee (first_name, last_name, job_title) VALUES ($1, $2, $3) RETURNING *';

for (const employee of employeeData) {
  const query = {
    text: sql,
    values: [employee.firstName, employee.lastName, employee.company.title],
  };
  try {
    let res = await dbmc.query(query);
    console.log(res.rows[0]);
  } catch (err) {
    console.log(err.stack);
  }
}

await dbmc.end();
