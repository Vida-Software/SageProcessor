# SAGE System - Dependencies Guide

Esta guía proporciona un árbol completo de dependencias para la instalación del sistema SAGE en un nuevo servidor.

## Requisitos del Sistema

### Sistema Operativo
- **Linux** (Ubuntu 20.04+ recomendado) o CentOS 7+
- **Mínimo**: 4GB RAM, 2 CPUs, 20GB almacenamiento
- **Recomendado**: 8GB RAM, 4 CPUs, 50GB+ almacenamiento

### Servicios Base Requeridos
- **PostgreSQL 14+** (base de datos principal)
- **Node.js 18+** (runtime de JavaScript)
- **Python 3.11+** (runtime de Python)
- **Nginx** (proxy inverso, opcional pero recomendado)

## Dependencias de Node.js (Frontend)

### Runtime
```bash
# Node.js y npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Dependencias Principales (package.json)
```json
{
  "dependencies": {
    "@headlessui/react": "^1.7.19",
    "@heroicons/react": "^2.2.0",
    "@hookform/resolvers": "^4.1.3",
    "@tremor/react": "^3.18.7",
    "next": "^15.2.4",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "tailwindcss": "^3.3.3",
    "typescript": "^5.7.3"
  }
}
```

### Librerías de UI y Formularios
- **@headlessui/react** - Componentes UI accesibles
- **@heroicons/react** - Iconos SVG de Heroicons
- **@tremor/react** - Componentes de dashboards y gráficos
- **react-hook-form** - Gestión de formularios
- **framer-motion** - Animaciones

### Integraciones Externas
- **@stripe/react-stripe-js** - Pagos (si se requiere)
- **@tanstack/react-query** - Gestión de estado y cache
- **react-toastify** - Notificaciones

### Utilidades
- **uuid** - Generación de identificadores únicos
- **yaml** - Parser de archivos YAML
- **xlsx** - Procesamiento de archivos Excel
- **csv-parse** - Parser de archivos CSV
- **zod** - Validación de esquemas

## Dependencias de Python (Backend)

### Runtime
```bash
# Python 3.11 y pip
sudo apt update
sudo apt install -y python3.11 python3.11-pip python3.11-venv
```

### Dependencias Core (pyproject.toml)
```toml
dependencies = [
    "flask>=3.1.0",
    "flask-cors>=5.0.1",
    "pandas>=2.2.3",
    "psycopg2-binary>=2.9.10",
    "pyyaml>=6.0.2",
    "requests>=2.32.3"
]
```

### Base de Datos y Conectividad
- **psycopg2-binary** - Conector PostgreSQL
- **sqlalchemy>=2.0.40** - ORM para bases de datos
- **pg>=0.1** - Utilidades PostgreSQL adicionales
- **pymssql>=2.3.4** - Conector SQL Server
- **pymysql>=1.1.1** - Conector MySQL
- **pyodbc>=5.2.0** - Conector ODBC universal

### Procesamiento de Datos
- **pandas>=2.2.3** - Manipulación de datos
- **numpy>=2.2.3** - Operaciones numéricas
- **openpyxl>=3.1.5** - Archivos Excel
- **pyarrow>=19.0.1** - Formato Apache Arrow/Parquet

### Almacenamiento en la Nube
- **boto3>=1.37.34** - Amazon AWS SDK
- **azure-storage-blob>=12.25.1** - Azure Blob Storage
- **google-cloud-storage>=3.1.0** - Google Cloud Storage
- **minio>=7.2.15** - MinIO S3-compatible

### Data Lake y Analytics
- **duckdb>=1.2.2** - Base de datos analítica
- **duckdb-engine>=0.17.0** - Conector SQLAlchemy para DuckDB
- **pyiceberg>=0.9.0** - Apache Iceberg

### Comunicaciones
- **paramiko>=3.5.1** - Cliente SSH/SFTP
- **sendgrid>=6.11.0** - Servicio de email
- **dnspython>=2.7.0** - Resolución DNS

### IA y Machine Learning
- **openai>=1.66.3** - API de OpenAI
- **trafilatura>=2.0.0** - Extracción de contenido web

### Utilidades
- **rich>=13.9.4** - Terminal con colores y formato
- **tabulate>=0.9.0** - Formateo de tablas
- **yato-lib>=0.0.17** - Utilidades adicionales

### Testing
- **pytest>=8.3.5** - Framework de testing
- **pytest-mock>=3.14.0** - Mocking para tests

## Dependencias de Sistemas

### Base de Datos PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Inicialización automática usando script SQL
sudo -u postgres psql -f sql/init_sage_database.sql

# Verificación de instalación
psql -h localhost -U sage -d sage -c "SELECT version();"
```

#### Script de Inicialización Completo
El archivo **`sql/init_sage_database.sql`** incluye:
- Creación de usuario `sage` con password `sage_password_2025`
- Creación de base de datos `sage`
- Todas las tablas necesarias del sistema:
  - `configuraciones_email` - Configuraciones de casillas de correo
  - `ejecuciones_yaml` - Registro de procesamiento de archivos
  - `system_secrets` - Gestión centralizada de credenciales
  - `suscripciones` - Gestión de suscriptores
  - `actividad_sistema` - Logs de actividad
  - `cloud_storage_connections` - Configuraciones de almacenamiento
  - `backups_automaticos` - Control de respaldos
- Índices optimizados para consultas frecuentes
- Triggers y funciones para automatización
- Datos de ejemplo y configuraciones iniciales
- Vistas para estadísticas y reportes

#### Credenciales por Defecto
```bash
Usuario: sage
Password: sage_password_2025
Base de datos: sage
Host: localhost
Puerto: 5432
Cadena de conexión: postgresql://sage:sage_password_2025@localhost:5432/sage
```

### Nginx (Proxy Reverso)
```bash
# Instalación
sudo apt install -y nginx

# Configuración básica en /etc/nginx/sites-available/sage
server {
    listen 80;
    server_name tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Supervisor (Gestión de Procesos)
```bash
sudo apt install -y supervisor

# Configuración en /etc/supervisor/conf.d/sage.conf
[program:sage-frontend]
command=npm run dev
directory=/path/to/sage
user=sage
autostart=true
autorestart=true

[program:sage-daemon]
command=python3 run_sage_daemon2.py
directory=/path/to/sage
user=sage
autostart=true
autorestart=true
```

## Archivos de Configuración

### Variables de Entorno (.env)

El sistema incluye un archivo **`.env.example`** completo con todas las configuraciones necesarias.

#### Configuración Básica Requerida
```bash
# Base de datos (usar credenciales del script SQL)
DATABASE_URL=postgresql://sage:sage_password_2025@localhost:5432/sage
PGHOST=localhost
PGPORT=5432
PGDATABASE=sage
PGUSER=sage
PGPASSWORD=sage_password_2025

# Configuración de aplicación
NODE_ENV=production
PORT=5000
```

#### Configuración Completa Disponible en .env.example
- **APIs de IA**: OpenRouter, OpenAI
- **Servicios de Email**: SendGrid, SMTP
- **Cloud Storage**: AWS S3, Azure Blob, Google Cloud, MinIO
- **Seguridad**: JWT, Session, Encryption keys
- **Webhooks**: Configuración de endpoints
- **Monitoreo**: Logs y debugging
- **Casillas de Email**: Configuraciones IMAP/SMTP

#### Gestión de Secrets via Interfaz Web
Ubicación: **`/admin/system-secrets`**
- Formularios dinámicos por tipo de credencial
- Validación y prueba de conexiones
- Almacenamiento seguro con cifrado
- Categorización por servicios

### Next.js (next.config.js)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: false
  }
}

module.exports = nextConfig
```

### TailwindCSS (tailwind.config.js)
```javascript
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/ui/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
```

## Servicios Adicionales

### Evidence.dev (Opcional)
Si se requiere integración con Evidence.dev para reportes:
```bash
npm install -g @evidence-dev/cli
```

### Docker (Alternativa de Despliegue)
```bash
# Instalación Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Instalación Paso a Paso

### 1. Preparación del Sistema
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias base
sudo apt install -y curl wget git build-essential

# Crear usuario para SAGE
sudo useradd -m -s /bin/bash sage
sudo usermod -aG sudo sage
```

### 2. Instalación de Node.js
```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

### 3. Instalación de Python
```bash
# Instalar Python 3.11
sudo apt install -y python3.11 python3.11-pip python3.11-venv

# Crear enlace simbólico
sudo ln -sf /usr/bin/python3.11 /usr/bin/python3
sudo ln -sf /usr/bin/pip3 /usr/bin/pip
```

### 4. Instalación de PostgreSQL
```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Ejecutar script de inicialización completo
sudo -u postgres psql -f sql/init_sage_database.sql

# Verificar instalación
psql -h localhost -U sage -d sage -c "\dt"
```

### 5. Clonación y Configuración del Proyecto
```bash
# Cambiar al usuario sage
sudo su - sage

# Clonar repositorio
git clone <tu-repositorio-sage>
cd sage

# Instalar dependencias Node.js
npm install

# Crear entorno virtual Python
python3 -m venv venv
source venv/bin/activate
pip install -e .

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

### 6. Construcción y Despliegue
```bash
# Construir aplicación Next.js
npm run build

# Iniciar servicios con supervisor
sudo systemctl enable supervisor
sudo systemctl start supervisor
```

## Verificación de la Instalación

### Comandos de Verificación
```bash
# Verificar Node.js y dependencias
node --version
npm list --depth=0

# Verificar Python y dependencias
python3 --version
pip list

# Verificar PostgreSQL
sudo -u postgres psql -c "SELECT version();"

# Verificar servicios
sudo systemctl status nginx
sudo systemctl status postgresql
sudo supervisorctl status
```

### Pruebas de Conectividad
```bash
# Probar conexión a base de datos
psql -h localhost -U sage -d sage -c "SELECT 1;"

# Probar aplicación web
curl http://localhost:5000

# Verificar logs
tail -f /var/log/supervisor/sage-frontend-stdout.log
tail -f /var/log/supervisor/sage-daemon-stdout.log
```

## Solución de Problemas Comunes

### Error de Conexión a Base de Datos
```bash
# Verificar PostgreSQL está corriendo
sudo systemctl status postgresql

# Verificar configuración pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Asegurar que existe: local all sage md5
```

### Error de Dependencias Node.js
```bash
# Limpiar cache npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Error de Dependencias Python
```bash
# Reinstalar en entorno virtual limpio
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -e .
```

## Consideraciones de Seguridad

1. **Firewall**: Configurar UFW para permitir solo puertos necesarios
2. **SSL/TLS**: Configurar certificados SSL para producción
3. **Backup**: Configurar backups automáticos de PostgreSQL
4. **Monitoring**: Implementar monitoreo con herramientas como Prometheus
5. **Logs**: Configurar rotación de logs con logrotate

## Mantenimiento

### Actualizaciones Regulares
```bash
# Actualizar sistema operativo
sudo apt update && sudo apt upgrade

# Actualizar dependencias Node.js
npm update

# Actualizar dependencias Python
pip install --upgrade -r requirements.txt
```

### Backup de Base de Datos
```bash
# Crear backup
pg_dump -h localhost -U sage sage > sage_backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -h localhost -U sage -d sage < sage_backup_YYYYMMDD.sql
```

Este documento debe ser actualizado cuando se agreguen nuevas dependencias al proyecto.