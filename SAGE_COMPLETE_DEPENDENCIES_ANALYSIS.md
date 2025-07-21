# SAGE System - Análisis Completo de Dependencias

## Resumen Ejecutivo

Este documento contiene el análisis exhaustivo de todas las librerías, frameworks y dependencias necesarias para ejecutar el sistema SAGE, incluyendo versiones específicas y orden de instalación recomendado.

## Arquitectura del Sistema

SAGE es un sistema híbrido que consta de:
- **Frontend**: Next.js (React) con TypeScript
- **Backend**: Python 3.11+ con múltiples servicios
- **Base de datos**: PostgreSQL 16+
- **Servicios adicionales**: DuckDB, SMTP/IMAP, Cloud Storage

## Dependencias Python (Backend)

### Versiones de Python Requeridas
- **Python mínimo**: 3.11
- **Python recomendado**: 3.11.x (última versión estable)

### Librerías Core del Sistema

#### 1. Procesamiento de Datos
```
pandas>=2.2.3          # Manipulación de dataframes
numpy>=2.2.3           # Operaciones numéricas
openpyxl>=3.1.5        # Lectura/escritura de Excel
pyarrow>=19.0.1        # Formato Apache Arrow
tabulate>=0.9.0        # Formato de tablas
```

#### 2. Base de Datos
```
psycopg2-binary>=2.9.10    # PostgreSQL driver
pg>=0.1                    # PostgreSQL utilities
duckdb>=1.2.2              # DuckDB engine
duckdb-engine>=0.17.0      # DuckDB SQLAlchemy support
sqlalchemy>=2.0.40         # ORM y abstracciones SQL
pymysql>=1.1.1             # MySQL support
pymssql>=2.3.4             # SQL Server support
pyodbc>=5.2.0              # ODBC support
```

#### 3. Cloud Storage
```
boto3>=1.37.34                    # AWS S3
botocore>=1.37.34                 # AWS Core
azure-storage-blob>=12.25.1       # Azure Blob Storage
google-cloud-storage>=3.1.0       # Google Cloud Storage
minio>=7.2.15                     # MinIO/S3-compatible storage
```

#### 4. Web y APIs
```
flask>=3.1.0              # Web framework para APIs
flask-cors>=5.0.1         # CORS support para Flask
requests>=2.32.3          # HTTP client
openai>=1.66.3            # OpenAI API client
sendgrid>=6.11.0          # SendGrid email service
```

#### 5. Email y Comunicaciones
```
(Integradas en Python estándar)
- smtplib                 # SMTP client
- imaplib                 # IMAP client
- email                   # Email parsing
- poplib                  # POP3 client
```

#### 6. SSH y SFTP
```
paramiko>=3.5.1           # SSH2 client y SFTP
```

#### 7. Formato y Serialización
```
pyyaml>=6.0.2             # YAML parsing
```

#### 8. Desarrollo y Testing
```
pytest>=8.3.5             # Testing framework
pytest-mock>=3.14.0       # Mocking para tests
hatchling>=1.27.0         # Build backend
```

#### 9. Utilidades
```
rich>=13.9.4              # Terminal formatting
dnspython>=2.7.0          # DNS operations
trafilatura>=2.0.0        # Web scraping
yato-lib>=0.0.17          # Utilities
```

#### 10. Data Lake y Big Data
```
pyiceberg>=0.9.0          # Apache Iceberg support
```

### Orden de Instalación Python

1. **Sistema base y compiladores**:
   ```bash
   sudo apt update
   sudo apt install -y python3.11 python3.11-dev python3-pip build-essential
   ```

2. **Herramientas de empaquetado**:
   ```bash
   pip install --upgrade pip setuptools wheel
   pip install hatchling>=1.27.0
   ```

3. **Drivers de base de datos**:
   ```bash
   pip install psycopg2-binary>=2.9.10
   pip install duckdb>=1.2.2 duckdb-engine>=0.17.0
   pip install sqlalchemy>=2.0.40
   ```

4. **Librerías de procesamiento**:
   ```bash
   pip install numpy>=2.2.3
   pip install pandas>=2.2.3
   pip install openpyxl>=3.1.5
   pip install pyarrow>=19.0.1
   ```

5. **Cloud y almacenamiento**:
   ```bash
   pip install boto3>=1.37.34 botocore>=1.37.34
   pip install azure-storage-blob>=12.25.1
   pip install google-cloud-storage>=3.1.0
   pip install minio>=7.2.15
   ```

6. **Web y APIs**:
   ```bash
   pip install flask>=3.1.0 flask-cors>=5.0.1
   pip install requests>=2.32.3
   pip install pyyaml>=6.0.2
   ```

7. **Servicios externos**:
   ```bash
   pip install openai>=1.66.3
   pip install sendgrid>=6.11.0
   pip install paramiko>=3.5.1
   ```

8. **Utilidades y formato**:
   ```bash
   pip install rich>=13.9.4
   pip install tabulate>=0.9.0
   pip install dnspython>=2.7.0
   ```

## Dependencias Node.js (Frontend)

### Versiones de Node.js Requeridas
- **Node.js mínimo**: 18.x
- **Node.js recomendado**: 20.x LTS
- **npm**: 9.x o superior

### Librerías Core del Frontend

#### 1. Framework Principal
```json
"next": "^15.2.4"          // Framework React
"react": "^19.1.0"         // Librería UI
"react-dom": "^19.1.0"     // React DOM
"typescript": "5.8.2"      // TypeScript
```

#### 2. UI y Componentes
```json
"@headlessui/react": "^1.7.19"      // Componentes UI accesibles
"@heroicons/react": "^2.2.0"        // Iconos
"@tremor/react": "^3.18.7"          // Dashboard components
"framer-motion": "^12.6.2"          // Animaciones
"styled-components": "^6.1.16"      // CSS-in-JS
```

#### 3. Estilos
```json
"tailwindcss": "^3.3.3"             // CSS framework
"autoprefixer": "^10.4.16"          // PostCSS plugin
"postcss": "^8.4.31"                // CSS processor
"next-themes": "^0.4.6"             // Theme management
```

#### 4. Manejo de Estado y Datos
```json
"@tanstack/react-query": "^5.71.1"          // Data fetching
"@tanstack/react-query-devtools": "^5.71.1" // Dev tools
"react-query": "^3.39.3"                    // Legacy query
```

#### 5. Formularios
```json
"react-hook-form": "^7.55.0"        // Form management
"@hookform/resolvers": "^4.1.3"    // Validation resolvers
"zod": "^3.24.2"                    // Schema validation
```

#### 6. Pagos
```json
"@stripe/react-stripe-js": "^3.4.0"  // Stripe React
"@stripe/stripe-js": "^6.0.0"        // Stripe JS
"stripe": "^17.7.0"                  // Stripe SDK
```

#### 7. Base de Datos y Backend
```json
"pg": "^8.13.3"                      // PostgreSQL client
"nodemailer": "^6.10.0"              // Email sending
```

#### 8. Utilidades
```json
"uuid": "^11.1.0"                    // UUID generation
"dotenv": "^16.4.7"                  // Environment variables
"formidable": "^3.5.2"               // Form parsing
"react-toastify": "^11.0.5"          // Notifications
```

#### 9. Procesamiento de Archivos
```json
"xlsx": "^0.18.5"                    // Excel processing
"yaml": "^2.7.0"                     // YAML parsing
"csv-parse": "^5.6.0"                // CSV parsing
"yauzl": "^3.2.0"                    // ZIP extraction
"yazl": "^3.3.1"                     // ZIP creation
```

#### 10. Sintaxis y Código
```json
"prismjs": "^1.30.0"                 // Syntax highlighting
```

#### 11. Tipos TypeScript
```json
"@types/node": "22.13.10"
"@types/react": "19.0.10"
"@types/nodemailer": "^6.4.17"
"@types/pg": "^8.11.11"
"@types/prismjs": "^1.26.5"
"@types/uuid": "^10.0.0"
```

### Orden de Instalación Node.js

1. **Instalar Node.js y npm**:
   ```bash
   # Usando NodeSource
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Verificar versiones**:
   ```bash
   node --version  # Debe ser >= 20.x
   npm --version   # Debe ser >= 9.x
   ```

3. **Instalar todas las dependencias**:
   ```bash
   # En el directorio del proyecto
   npm install
   ```

## Servicios del Sistema Operativo

### PostgreSQL 16
```bash
# Instalar PostgreSQL
sudo apt install -y postgresql-16 postgresql-contrib-16

# Configurar con el script SQL
sudo -u postgres psql -f sql/init_sage_database.sql
```

### Nginx (Producción)
```bash
sudo apt install -y nginx
```

### Supervisor (Gestión de procesos)
```bash
sudo apt install -y supervisor
```

### OpenSSH (Acceso remoto)
```bash
# Ya instalado via Nix en Replit
# Para otros sistemas:
sudo apt install -y openssh-server openssh-client
```

## Conflictos Comunes y Soluciones

### 1. Conflicto de versiones Python
**Problema**: Incompatibilidad entre pandas y numpy
**Solución**: Instalar en orden específico
```bash
pip install numpy==2.2.3
pip install pandas==2.2.3
```

### 2. Conflicto psycopg2
**Problema**: Error al compilar psycopg2
**Solución**: Usar psycopg2-binary
```bash
pip install psycopg2-binary>=2.9.10
```

### 3. Conflicto Next.js/React
**Problema**: Versiones incompatibles
**Solución**: Usar versiones exactas
```bash
npm install next@15.2.4 react@19.1.0 react-dom@19.1.0
```

### 4. Conflicto de tipos TypeScript
**Problema**: @types desactualizados
**Solución**: Actualizar tipos después de librerías
```bash
npm install --save-dev @types/node@22.13.10 @types/react@19.0.10
```

## Script de Instalación Completa

```bash
#!/bin/bash
# Script de instalación completa SAGE

set -e

echo "=== Instalando dependencias del sistema ==="
sudo apt update
sudo apt install -y \
    python3.11 python3.11-dev python3-pip \
    nodejs npm \
    postgresql-16 postgresql-contrib-16 \
    build-essential \
    libpq-dev \
    nginx \
    supervisor

echo "=== Configurando Python ==="
python3.11 -m pip install --upgrade pip setuptools wheel

echo "=== Instalando dependencias Python ==="
pip install -r requirements.txt

echo "=== Instalando dependencias Node.js ==="
npm install

echo "=== Configurando PostgreSQL ==="
sudo -u postgres psql -f sql/init_sage_database.sql

echo "=== Configurando variables de entorno ==="
cp .env.example .env
echo "Por favor, edita .env con tus credenciales reales"

echo "=== Instalación completa ==="
```

## Verificación de Instalación

### Verificar Python
```bash
python3.11 -c "import pandas, numpy, psycopg2, flask; print('Python OK')"
```

### Verificar Node.js
```bash
npm list next react react-dom
```

### Verificar PostgreSQL
```bash
psql -h localhost -U sage -d sage -c "SELECT version();"
```

## Notas Importantes

1. **Orden crítico**: Siempre instalar numpy antes que pandas
2. **Versiones exactas**: Usar las versiones especificadas para evitar conflictos
3. **Python 3.11+**: Requerido para características modernas
4. **PostgreSQL 16+**: Necesario para funciones JSON avanzadas
5. **Node.js 20.x**: LTS recomendado para estabilidad

## Mantenimiento

- Actualizar dependencias mensualmente
- Revisar vulnerabilidades con `npm audit` y `pip audit`
- Mantener sincronizados `pyproject.toml` y `package.json`
- Documentar cualquier cambio de versión en `replit.md`