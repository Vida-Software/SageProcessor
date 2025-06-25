import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { dias, fechaInicio, fechaFin, organizacion, pais, producto } = req.query;
    
    // Calcular fechas basado en parámetros
    let startDate, endDate;
    if (fechaInicio && fechaFin) {
      startDate = fechaInicio;
      endDate = fechaFin;
    } else {
      const daysBack = parseInt(dias as string) || 30;
      endDate = new Date().toISOString().split('T')[0];
      startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    console.log(`Consulta de estadísticas: fechaInicio=${startDate}, fechaFin=${endDate}`);

    // Construir la cláusula WHERE base
    let whereClause = "WHERE fecha_ejecucion >= $1 AND fecha_ejecucion <= $2";
    const params = [startDate, endDate];
    let paramCount = 2;

    if (organizacion && organizacion !== 'todas') {
      paramCount++;
      whereClause += ` AND organizacion_id = $${paramCount}`;
      params.push(organizacion);
    }

    if (pais && pais !== 'todos') {
      paramCount++;
      whereClause += ` AND pais_id = $${paramCount}`;
      params.push(pais);
    }

    if (producto && producto !== 'todos') {
      paramCount++;
      whereClause += ` AND producto_id = $${paramCount}`;
      params.push(producto);
    }

    // Métricas principales
    const statsQuery = `
      SELECT
        COUNT(*) AS archivos_procesados,
        COUNT(CASE WHEN estado = 'Éxito' THEN 1 END) AS archivos_exitosos,
        COUNT(CASE WHEN estado IN ('pendiente', 'en_proceso') THEN 1 END) AS archivos_pendientes,
        COUNT(CASE WHEN estado = 'Fallido' THEN 1 END) AS archivos_fallidos,
        (SELECT COUNT(*) FROM casillas) as casillas_por_vencer
      FROM 
        ejecuciones_yaml
        ${whereClause}
    `;
    
    console.log('Consulta de estadísticas: \n', statsQuery);

    const client = await pool.connect();
    try {
      const statsResult = await client.query(statsQuery, params);

      const stats = statsResult.rows[0];
      const archivos_procesados = parseInt(stats?.archivos_procesados) || 0;
      const archivos_exitosos = parseInt(stats?.archivos_exitosos) || 0;
      const tasa_exito = archivos_procesados > 0 ? (archivos_exitosos / archivos_procesados * 100).toFixed(1) : 0;

      res.json({
        stats: {
          archivos_procesados,
          tasa_exito: parseFloat(tasa_exito),
          archivos_pendientes: parseInt(stats?.archivos_pendientes) || 0,
          casillas_por_vencer: parseInt(stats?.casillas_por_vencer) || 0
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in dashboard stats:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}