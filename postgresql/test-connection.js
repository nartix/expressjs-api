import pool, { dbmc } from './connection.js';

await pool.query('SELECT NOW()', (err, res) => {
  if (!err) console.log('Postgresql master pool connected successfully!');
  else console.log(err.stack);
  pool.end();
});

await dbmc.connect();
await dbmc.query('SELECT NOW()', (err, res) => {
  if (!err) console.log('Postgresql master client connected successfully!');
  else console.log(err.stack);
  dbmc.end();
});
