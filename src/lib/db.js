import { Pool } from 'pg';

// Crear la conexión de Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export { pool };