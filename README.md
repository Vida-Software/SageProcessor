# SAGE System - Updated

Sistema avanzado para la gestión de configuraciones organizacionales, procesamiento de archivos y validación de reglas basadas en YAML con asistencia de IA.

## Características Principales

- Gestión de configuraciones mediante YAML con asistencia de IA
- Procesamiento multi-canal de archivos (Email, SFTP, API, Sistema de archivos)
- Dashboard para monitoreo y métricas
- Sistema de respuestas automatizadas
- Gestión de suscripciones y permisos
- Validación y procesamiento inteligente de archivos
- Soporte para BOM (Byte Order Mark) en archivos CSV
- YAML Studio con posibilidad de descargar prompts para usar en otras plataformas

## Estructura del Sistema

```
├── API REST - Endpoints para gestión y configuración
├── YAML Studio - Editor inteligente de configuraciones
├── Procesador Multi-canal - Manejo de diferentes fuentes de datos
├── Motor de Validación - Verificación de reglas y estructura
└── Sistema de Notificaciones - Respuestas y alertas automáticas
```

## Documentación

- [Arquitectura y Funcionamiento](docs/architecture.md) - Explicación detallada del sistema
- [Guía de Uso](docs/how-to.md) - Tutorial paso a paso
- [Preguntas Frecuentes](docs/faq.md) - Respuestas a dudas comunes
- [TODO List](docs/TODO.md) - Lista de funcionalidades pendientes
- [Usar OpenRouter](docs/usar_open_router.md) - Guía para configurar OpenRouter con o3-mini
- [Usar Prompts Externos](docs/usar_prompt_externo.md) - Cómo usar los prompts de YAML Studio en otras plataformas
- [Soporte BOM en YAML Studio](README_YAML_STUDIO_BOM.md) - Documentación sobre el soporte para BOM en CSV

## Nuevas Funcionalidades

- **Descargar Prompt**: Ahora puedes descargar el prompt generado por YAML Studio para usarlo en otras interfaces de chat cuando OpenRouter no esté disponible.
- **Soporte BOM Mejorado**: Detección y procesamiento automático de BOM (Byte Order Mark) en archivos CSV.
- **Validación de Columnas**: Mejorada la detección de columnas y tipos de datos para archivos sin encabezados.

## Requisitos del Sistema

### Mínimos
- **Sistema Operativo**: Ubuntu 20.04+ / CentOS 7+
- **Hardware**: 4GB RAM, 2 CPUs, 20GB almacenamiento
- **Node.js**: 18.x o superior
- **Python**: 3.11+
- **PostgreSQL**: 14+

### Recomendados
- **Hardware**: 8GB RAM, 4 CPUs, 50GB+ almacenamiento
- **Nginx**: Para proxy inverso y SSL
- **Supervisor**: Para gestión de procesos

## Dependencias Principales

### Frontend (Node.js)
```json
{
  "dependencies": {
    "next": "^15.2.4",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@tremor/react": "^3.18.7",
    "@headlessui/react": "^1.7.19",
    "@heroicons/react": "^2.2.0",
    "tailwindcss": "^3.3.3",
    "react-hook-form": "^7.55.0",
    "@tanstack/react-query": "^5.71.1",
    "uuid": "^11.1.0",
    "yaml": "^2.7.0",
    "xlsx": "^0.18.5",
    "csv-parse": "^5.6.0"
  }
}
```

### Backend (Python)
```toml
dependencies = [
    "flask>=3.1.0",
    "flask-cors>=5.0.1",
    "pandas>=2.2.3",
    "psycopg2-binary>=2.9.10",
    "pyyaml>=6.0.2",
    "requests>=2.32.3",
    "duckdb>=1.2.2",
    "boto3>=1.37.34",
    "azure-storage-blob>=12.25.1",
    "google-cloud-storage>=3.1.0",
    "minio>=7.2.15",
    "paramiko>=3.5.1",
    "sendgrid>=6.11.0",
    "openai>=1.66.3",
    "numpy>=2.2.3",
    "openpyxl>=3.1.5",
    "pyarrow>=19.0.1"
]
```

## Instalación Paso a Paso

### 1. Preparación del Sistema
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias base
sudo apt install -y curl wget git build-essential

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Python 3.11
sudo apt install -y python3.11 python3.11-pip python3.11-venv
```

### 2. Instalación de PostgreSQL
```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Configurar base de datos
sudo -u postgres psql << EOF
CREATE USER sage WITH PASSWORD 'tu_password';
CREATE DATABASE sage OWNER sage;
GRANT ALL PRIVILEGES ON DATABASE sage TO sage;
\q
EOF
```

### 3. Configuración del Proyecto
```bash
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

### 4. Variables de Entorno Requeridas
```bash
# Base de datos
DATABASE_URL=postgresql://sage:password@localhost:5432/sage
PGHOST=localhost
PGPORT=5432
PGDATABASE=sage
PGUSER=sage
PGPASSWORD=password

# APIs externas (opcionales)
OPENROUTER_API_KEY=tu_clave_openrouter
OPENAI_API_KEY=tu_clave_openai
SENDGRID_API_KEY=tu_clave_sendgrid

# Configuración de aplicación
NODE_ENV=production
PORT=5000
```

### 5. Construcción y Despliegue
```bash
# Construir aplicación Next.js
npm run build

# Iniciar en desarrollo
npm run dev

# O iniciar en producción
npm start
```

## Servicios Adicionales (Opcionales)

### Nginx (Proxy Reverso)
```bash
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
autostart=true
autorestart=true

[program:sage-daemon]
command=python3 run_sage_daemon2.py
directory=/path/to/sage
autostart=true
autorestart=true
```

## Verificación de Instalación

```bash
# Verificar servicios
node --version
python3 --version
sudo systemctl status postgresql

# Probar conexión a base de datos
psql -h localhost -U sage -d sage -c "SELECT 1;"

# Probar aplicación web
curl http://localhost:5000
```

## Documentación Detallada

Para información completa sobre dependencias y configuración, consultar:
- **[DEPENDENCIES.md](DEPENDENCIES.md)** - Guía completa de dependencias e instalación

## Licencia

Este proyecto está bajo la licencia MIT.