import { pool } from '../../../../utils/db';

/**
 * API para probar conexiones de secretos del sistema
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { key, config } = req.body;
  
  try {
    let result = { success: false, message: '', details: {} };
    
    switch (key) {
      case 'DATABASE_MAIN':
      case 'DATABASE_BACKUP':
        result = await testDatabaseConnection(config);
        break;
      case 'OPENROUTER_API_KEY':
      case 'OPENAI_API_KEY':
        result = await testAIApiKey(key, config);
        break;
      case 'SENDGRID_CONFIG':
        result = await testEmailService(config);
        break;
      default:
        result = { success: true, message: 'Configuración guardada (prueba no implementada)', details: {} };
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al probar la conexión', 
      error: error.message 
    });
  }
}

async function testDatabaseConnection(config) {
  const { Pool } = require('pg');
  
  const testPool = new Pool({
    host: config.host,
    port: parseInt(config.port),
    database: config.database,
    user: config.username,
    password: config.password,
    ssl: config.ssl_mode === 'require' ? { rejectUnauthorized: false } : config.ssl_mode === 'prefer'
  });

  try {
    const client = await testPool.connect();
    const result = await client.query('SELECT version()');
    client.release();
    await testPool.end();
    
    return {
      success: true,
      message: 'Conexión exitosa a PostgreSQL',
      details: {
        version: result.rows[0].version.substring(0, 50) + '...',
        host: config.host,
        database: config.database
      }
    };
  } catch (error) {
    await testPool.end();
    return {
      success: false,
      message: 'Error de conexión a PostgreSQL',
      details: { error: error.message }
    };
  }
}

async function testAIApiKey(keyType, config) {
  const apiKey = config.api_key;
  if (!apiKey) {
    return { success: false, message: 'API Key requerida', details: {} };
  }

  try {
    let url, headers;
    
    if (keyType === 'OPENROUTER_API_KEY') {
      url = 'https://openrouter.ai/api/v1/models';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
    } else if (keyType === 'OPENAI_API_KEY') {
      url = 'https://api.openai.com/v1/models';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
    }

    const response = await fetch(url, { 
      method: 'GET', 
      headers,
      timeout: 10000 
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `Conexión exitosa a ${keyType.replace('_', ' ')}`,
        details: {
          models_available: data.data ? data.data.length : 'N/A',
          api_endpoint: url
        }
      };
    } else {
      return {
        success: false,
        message: `Error de autenticación en ${keyType}`,
        details: { status: response.status, statusText: response.statusText }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error de conexión a ${keyType}`,
      details: { error: error.message }
    };
  }
}

async function testEmailService(config) {
  if (!config.api_key) {
    return { success: false, message: 'SendGrid API Key requerida', details: {} };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Conexión exitosa a SendGrid',
        details: {
          account_type: data.type || 'N/A',
          from_email: config.from_email
        }
      };
    } else {
      return {
        success: false,
        message: 'Error de autenticación en SendGrid',
        details: { status: response.status }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error de conexión a SendGrid',
      details: { error: error.message }
    };
  }
}