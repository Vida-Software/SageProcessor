// Endpoint para reparar los servicios VNC en un servidor DuckDB

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed, use POST' });
  }

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing server ID' });
  }

  try {
    console.log(`Iniciando reparación VNC para servidor ${id}...`);
    
    // Configurar un timeout más largo (5 minutos = 300000 ms)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    
    // Llamar al API de DuckDB Swarm para reparar VNC con timeout extendido
    const response = await fetch(`http://localhost:5001/api/servers/${id}/vnc/repair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId); // Limpiar el timeout si la respuesta llegó a tiempo
    
    console.log(`Respuesta del API: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la respuesta de la API: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      message: 'Reparación VNC iniciada correctamente',
      vnc_active: data.vnc_active,
      novnc_active: data.novnc_active,
      details: data.details,
      repair_output: data.repair_output
    });
  } catch (error) {
    console.error(`Error al reparar VNC para el servidor ${id}:`, error);
    
    // Mensaje específico para timeout
    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: 'La reparación VNC está tomando demasiado tiempo. El proceso continúa en segundo plano, pero la conexión ha expirado. Intente revisar el estado más tarde.'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: `Error al reparar VNC: ${error.message || 'Error desconocido'}`
    });
  }
}