import { Pool } from 'pg';

// Usar la variable de entorno DATABASE_URL para la conexión
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

export { pool };