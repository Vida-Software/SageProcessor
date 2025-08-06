#!/bin/bash
set -e

echo "=== CONFIGURANDO ACCESO SSH PARA SAGE ==="

# Variables de configuración
SSH_PORT=2222
HOST_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
REPLIT_HOST=$(echo $REPLIT_DOMAINS | cut -d',' -f1 2>/dev/null || echo "sage-processor-victorchigne.replit.app")

echo "Información del servidor:"
echo "- Host IP interno: $HOST_IP"
echo "- Dominio público: $REPLIT_HOST"
echo "- Usuario actual: $(whoami)"
echo "- Directorio: $(pwd)"

# Crear directorio SSH
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Verificar si SSH está disponible
echo "=== Verificando SSH ==="
if command -v ssh >/dev/null 2>&1; then
    echo "✓ Cliente SSH disponible"
else
    echo "✗ Cliente SSH no encontrado"
fi

if command -v sshd >/dev/null 2>&1; then
    echo "✓ Servidor SSH disponible"
else
    echo "✗ Servidor SSH no encontrado - usando alternativa"
fi

# Generar claves SSH para el usuario si no existen
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "=== Generando claves SSH del usuario ==="
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N '' -q
    echo "✓ Claves SSH generadas"
fi

# Configurar authorized_keys para permitir acceso
cp ~/.ssh/id_rsa.pub ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Crear script de túnel SSH usando ngrok (método recomendado)
cat > ~/.ssh/create_ssh_tunnel.sh << 'TUNNEL_EOF'
#!/bin/bash

echo "=== CREANDO TÚNEL SSH CON NGROK ==="

# Verificar si ngrok está disponible
if ! command -v ngrok >/dev/null 2>&1; then
    echo "Instalando ngrok..."
    # Descargar ngrok
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /tmp/ngrok.asc >/dev/null
    curl -o /tmp/ngrok.zip -L https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.zip
    unzip -o /tmp/ngrok.zip -d /tmp/
    mv /tmp/ngrok /usr/local/bin/ 2>/dev/null || sudo mv /tmp/ngrok /usr/local/bin/ 2>/dev/null || cp /tmp/ngrok ~/.ssh/ngrok
    chmod +x ~/.ssh/ngrok 2>/dev/null || chmod +x /usr/local/bin/ngrok
fi

# Iniciar túnel SSH (requiere autenticación de ngrok)
echo "Para usar ngrok, necesitas:"
echo "1. Registrarte en https://ngrok.com"
echo "2. Obtener tu authtoken"
echo "3. Ejecutar: ngrok config add-authtoken TU_TOKEN"
echo "4. Luego ejecutar: ngrok tcp 22"

TUNNEL_EOF

chmod +x ~/.ssh/create_ssh_tunnel.sh

# Crear información completa de conexión
cat > ~/.ssh/connection_info.txt << 'INFO_EOF'
=== GUÍA COMPLETA DE ACCESO SSH A SAGE ===

🌐 Aplicación Web (YA DISPONIBLE):
https://sage-processor-victorchigne.replit.app/

📡 MÉTODO 1: Acceso directo via Replit Shell (ACTUAL)
- Ya estás conectado al servidor
- Usuario: runner
- Directorio: /home/runner/workspace
- Todos los servicios están disponibles internamente

🔧 MÉTODO 2: SSH desde máquina externa (REQUIERE SETUP)

Para acceder desde tu computadora local necesitas crear un túnel:

A) OPCIÓN NGROK (Recomendada):
   1. Instalar ngrok: https://ngrok.com/download
   2. Registrarse y obtener authtoken
   3. En Replit shell ejecutar:
      ngrok config add-authtoken TU_TOKEN
      ngrok tcp 22
   4. Conectar desde tu PC:
      ssh -p PUERTO_NGROK runner@HOSTNAME_NGROK.ngrok.io

B) OPCIÓN CLOUDFLARE TUNNEL:
   1. Instalar cloudflared
   2. Configurar túnel TCP
   3. Conectar via túnel

🔌 SERVICIOS DISPONIBLES:

Internos (desde Replit):
- Aplicación SAGE: http://localhost:5000
- API DuckDB: http://localhost:5001  
- PostgreSQL: localhost:5432

Públicos (desde internet):
- Web App: https://sage-processor-victorchigne.replit.app/

🗄️ BASE DE DATOS:
- Host: localhost (interno)
- Puerto: 5432
- Base de datos: sage
- Usuario: sage
- Password: sage_password_2025

🎛️ GESTIÓN DE SECRETOS:
Interfaz web: https://sage-processor-victorchigne.replit.app/admin/system-secrets

📋 COMANDOS ÚTILES EN REPLIT SHELL:

# Ver servicios corriendo
ps aux | grep -E "(node|python|postgres)"

# Ver puertos abiertos
netstat -tlnp 2>/dev/null || ss -tlnp

# Conectar a PostgreSQL
psql -h localhost -U sage -d sage

# Ver logs de aplicación
tail -f logs/*.log

# Reiniciar servicios
# (usar los controles de workflow en Replit)

⚠️ NOTAS IMPORTANTES:
- Replit no expone puertos SSH directamente al internet
- El acceso web ya está configurado y funcionando
- Para desarrollo directo, usar Replit Shell (método actual)
- Para acceso externo SSH, usar túneles (ngrok/cloudflare)

✅ ESTADO ACTUAL:
- ✅ Aplicación web funcionando públicamente
- ✅ PostgreSQL configurado con datos de ejemplo
- ✅ API DuckDB disponible internamente
- ✅ Sistema de secrets configurado
- ⚠️ SSH externo requiere configuración de túnel

INFO_EOF

echo ""
echo "✅ Configuración SSH documentada"
echo "📖 Lee el archivo ~/.ssh/connection_info.txt para instrucciones completas"
echo ""
echo "🎯 ACCESO INMEDIATO DISPONIBLE:"
echo "   Web: https://sage-processor-victorchigne.replit.app/"
echo "   Shell: Ya estás conectado (método actual)"
echo ""
echo "🔧 Para SSH externo, necesitas configurar túnel con ngrok o similar"