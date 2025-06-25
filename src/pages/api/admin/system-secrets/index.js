import { pool } from '../../../../utils/db';

/**
 * API para gestionar secretos y credenciales del sistema
 * 
 * GET: Obtiene todos los secretos del sistema
 * POST: Crea o actualiza secretos del sistema
 */
export default async function handler(req, res) {
  const db = pool;
  
  try {
    if (req.method === 'GET') {
      const secrets = await getSystemSecrets(db);
      res.status(200).json(secrets);
    } 
    else if (req.method === 'POST') {
      const { category, key, value, description, masked, config } = req.body;
      
      if (!category || !key) {
        return res.status(400).json({ 
          error: 'Categoría y clave son requeridas' 
        });
      }
      
      const savedSecret = await saveSystemSecret(db, {
        category,
        key,
        value,
        description,
        masked: masked || false,
        config: config || null
      });
      
      res.status(200).json({ 
        success: true, 
        message: 'Secreto guardado con éxito', 
        secret: savedSecret 
      });
    } 
    else {
      res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (error) {
    console.error('Error en API system-secrets:', error);
    res.status(500).json({ 
      error: 'Error al procesar la solicitud', 
      message: error.message 
    });
  }
}

async function getSystemSecrets(db) {
  const client = await db.connect();
  
  try {
    // Crear tabla si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_secrets (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        key VARCHAR(100) NOT NULL UNIQUE,
        value TEXT,
        description TEXT,
        masked BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Agregar columna config si no existe
    await client.query(`
      ALTER TABLE system_secrets 
      ADD COLUMN IF NOT EXISTS config JSONB
    `);
    
    const result = await client.query(`
      SELECT 
        id,
        category,
        key,
        CASE 
          WHEN masked = true THEN CASE 
            WHEN value IS NULL OR value = '' THEN ''
            ELSE REPEAT('*', GREATEST(8, LENGTH(value) - 4)) || RIGHT(value, 4)
          END
          ELSE value 
        END as display_value,
        value IS NOT NULL AND value != '' as has_value,
        description,
        masked,
        config,
        active,
        created_at,
        updated_at
      FROM system_secrets 
      WHERE active = true
      ORDER BY category, key
    `);
    
    return result.rows;
  } finally {
    client.release();
  }
}

async function saveSystemSecret(db, secretData) {
  const client = await db.connect();
  
  try {
    const { category, key, value, description, masked, config } = secretData;
    
    const result = await client.query(`
      INSERT INTO system_secrets (category, key, value, description, masked, config, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (key) 
      DO UPDATE SET 
        category = EXCLUDED.category,
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        masked = EXCLUDED.masked,
        config = EXCLUDED.config,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, category, key, description, masked, config, active, created_at, updated_at
    `, [category, key, value, description, masked, JSON.stringify(config)]);
    
    return result.rows[0];
  } finally {
    client.release();
  }
}