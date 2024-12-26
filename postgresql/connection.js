import pg from 'pg';
import {
  pg_master_host,
  pg_master_port,
  pg_master_user,
  pg_master_password,
  pg_master_database,
} from './master-host.js';

const { Pool, Client } = pg;

export default new Pool({
  user: pg_master_user,
  host: pg_master_host,
  database: pg_master_database,
  password: pg_master_password,
  port: pg_master_port,
});

export const dbmc = new Client({
  user: pg_master_user,
  host: pg_master_host,
  database: pg_master_database,
  password: pg_master_password,
  port: pg_master_port,
});
