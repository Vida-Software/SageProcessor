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
    const { dias, fechaInicio, fechaFin, intervalType = 'day' } = req.query;
    
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

    console.log(`Consulta de tendencia: fechaInicio=${startDate}, fechaFin=${endDate}`);
    let dateFormat = "'DD/MM/YYYY'";
    let intervalSql = "day";
    
    // Ajustar el formato e intervalo según el tipo solicitado
    if (intervalType === 'week') {
      dateFormat = "'WW/YYYY'";
      intervalSql = "week";
    } else if (intervalType === 'month') {
      dateFormat = "'MM/YYYY'";
      intervalSql = "month";
    }

    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('day', fecha_ejecucion), 'DD/MM') as fecha,
        COUNT(*) as procesados,
        COUNT(CASE WHEN estado = 'Éxito' THEN 1 END) as exitosos,
        COUNT(CASE WHEN estado = 'Parcial' THEN 1 END) as parciales,
        COUNT(CASE WHEN estado = 'Fallido' THEN 1 END) as fallidos
      FROM 
        ejecuciones_yaml
      WHERE fecha_ejecucion >= $1::date AND fecha_ejecucion <= $2::date
      GROUP BY 
        DATE_TRUNC('day', fecha_ejecucion)
      ORDER BY 
        DATE_TRUNC('day', fecha_ejecucion)
    `;

    console.log('Consulta de tendencia: \n', query);
    const result = await pool.query(query, [startDate, endDate]);

    // Devolver los datos de tendencia
    res.status(200).json({
      tendencia: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo tendencia de ejecuciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}