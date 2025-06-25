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
    const { dias, fechaInicio, fechaFin } = req.query;
    
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

    console.log(`Consulta de últimas ejecuciones: fechaInicio=${startDate}, fechaFin=${endDate}`);
    
    const query = `
      SELECT 
        e.id,
        e.uuid,
        e.fecha_ejecucion as fecha,
        e.nombre_yaml as "nombreYaml",
        e.archivo_datos as "archivoDatos", 
        e.estado,
        e.errores_detectados as errores,
        e.warnings_detectados as warnings,
        json_build_object('id', c.id, 'nombre', c.nombre_yaml) as casilla,
        json_build_object('id', em.id, 'nombre', em.nombre) as emisor
      FROM 
        ejecuciones_yaml e
        LEFT JOIN casillas c ON e.casilla_id = c.id
        LEFT JOIN emisores em ON e.emisor_id = em.id
      WHERE e.fecha_ejecucion >= $1::date AND e.fecha_ejecucion <= $2::date
      ORDER BY 
        e.fecha_ejecucion DESC
      LIMIT 20
    `;

    console.log('Consulta de últimas ejecuciones: \n', query);
    const result = await pool.query(query, [startDate, endDate]);

    // Devolver las últimas ejecuciones 
    res.status(200).json({
      ejecuciones: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo últimas ejecuciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}