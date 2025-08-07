// Configuración básica de NextAuth para despliegue
export default function handler(req, res) {
  // Esta es una implementación simplificada para evitar errores de despliegue
  // En ambiente de producción, reemplazar con configuración completa
  
  if (req.method === 'POST') {
    // Simulación básica de login
    const { username, password } = req.body || {};
    
    if (username === 'admin' && password === 'admin') {
      res.status(200).json({ 
        user: { id: 1, name: 'Admin', email: 'admin@local' },
        token: 'basic-auth-token'
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}