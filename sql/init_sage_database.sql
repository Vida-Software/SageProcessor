-- Script de inicialización de base de datos SAGE
-- Ejecutar como usuario postgres: psql -U postgres -f init_sage_database.sql

-- ==========================================
-- CREACIÓN DE USUARIO Y BASE DE DATOS
-- ==========================================

-- Crear usuario sage si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'sage') THEN
        CREATE USER sage WITH PASSWORD 'sage_password_2025';
    END IF;
END
$$;

-- Crear base de datos sage si no existe
SELECT 'CREATE DATABASE sage OWNER sage' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sage')\gexec

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON DATABASE sage TO sage;

-- Conectar a la base de datos sage
\c sage

-- Otorgar privilegios en el esquema público
GRANT ALL ON SCHEMA public TO sage;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sage;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sage;

-- ==========================================
-- TABLA: CONFIGURACIONES DE EMAIL
-- ==========================================

CREATE TABLE IF NOT EXISTS configuraciones_email (
    id SERIAL PRIMARY KEY,
    casilla_id INTEGER NOT NULL,
    servidor_imap VARCHAR(255) NOT NULL,
    puerto_imap INTEGER DEFAULT 993,
    servidor_smtp VARCHAR(255) NOT NULL,
    puerto_smtp INTEGER DEFAULT 587,
    usuario VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    usa_ssl BOOLEAN DEFAULT true,
    usa_starttls BOOLEAN DEFAULT true,
    carpeta_entrada VARCHAR(100) DEFAULT 'INBOX',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: EJECUCIONES YAML
-- ==========================================

CREATE TABLE IF NOT EXISTS ejecuciones_yaml (
    id SERIAL PRIMARY KEY,
    uuid_ejecucion UUID UNIQUE NOT NULL,
    casilla_id INTEGER NOT NULL,
    nombre_archivo VARCHAR(500) NOT NULL,
    ruta_archivo TEXT,
    estado VARCHAR(50) DEFAULT 'pendiente',
    fecha_ejecucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_finalizacion TIMESTAMP,
    logs TEXT,
    yaml_config TEXT,
    resultados JSONB,
    errores TEXT,
    tiempo_procesamiento INTERVAL,
    tamano_archivo BIGINT,
    tipo_archivo VARCHAR(50),
    remitente_email VARCHAR(255),
    procesado_por VARCHAR(100) DEFAULT 'sage_daemon2'
);

-- ==========================================
-- TABLA: SECRETOS DEL SISTEMA
-- ==========================================

CREATE TABLE IF NOT EXISTS system_secrets (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    masked BOOLEAN DEFAULT false,
    config JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: SUSCRIPCIONES
-- ==========================================

CREATE TABLE IF NOT EXISTS suscripciones (
    id SERIAL PRIMARY KEY,
    casilla_id INTEGER NOT NULL,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    fecha_suscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_envio TIMESTAMP,
    configuracion JSONB
);

-- ==========================================
-- TABLA: ACTIVIDAD DEL SISTEMA
-- ==========================================

CREATE TABLE IF NOT EXISTS actividad_sistema (
    id SERIAL PRIMARY KEY,
    casilla_id INTEGER,
    tipo_actividad VARCHAR(100) NOT NULL,
    descripcion TEXT,
    detalles JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario VARCHAR(100),
    ip_address INET
);

-- ==========================================
-- TABLA: CLOUD STORAGE CONNECTIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS cloud_storage_connections (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    proveedor VARCHAR(50) NOT NULL, -- 'aws_s3', 'azure_blob', 'google_cloud', 'minio'
    configuracion JSONB NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_sincronizacion TIMESTAMP
);

-- ==========================================
-- TABLA: BACKUPS AUTOMATICOS
-- ==========================================

CREATE TABLE IF NOT EXISTS backups_automaticos (
    id SERIAL PRIMARY KEY,
    uuid_ejecucion UUID REFERENCES ejecuciones_yaml(uuid_ejecucion),
    ruta_local TEXT,
    ruta_cloud TEXT,
    proveedor_cloud VARCHAR(50),
    estado VARCHAR(50) DEFAULT 'pendiente',
    fecha_backup TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tamano_backup BIGINT,
    checksum VARCHAR(64)
);

-- ==========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ==========================================

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_ejecuciones_casilla_fecha 
ON ejecuciones_yaml(casilla_id, fecha_ejecucion DESC);

CREATE INDEX IF NOT EXISTS idx_ejecuciones_estado 
ON ejecuciones_yaml(estado);

CREATE INDEX IF NOT EXISTS idx_ejecuciones_uuid 
ON ejecuciones_yaml(uuid_ejecucion);

CREATE INDEX IF NOT EXISTS idx_configuraciones_casilla 
ON configuraciones_email(casilla_id);

CREATE INDEX IF NOT EXISTS idx_suscripciones_email 
ON suscripciones(email);

CREATE INDEX IF NOT EXISTS idx_actividad_timestamp 
ON actividad_sistema(timestamp DESC);

-- ==========================================
-- DATOS INICIALES DE EJEMPLO
-- ==========================================

-- Configuración de email de ejemplo (Casilla 1)
INSERT INTO configuraciones_email (
    casilla_id, servidor_imap, puerto_imap, servidor_smtp, puerto_smtp,
    usuario, password, usa_ssl, usa_starttls, carpeta_entrada, activo
) VALUES (
    1, 'mail.dreamhost.com', 993, 'mail.dreamhost.com', 587,
    'casilla1@tudominio.com', 'password_casilla1', true, true, 'INBOX', true
) ON CONFLICT DO NOTHING;

-- Configuración de email de ejemplo (Casilla 45)
INSERT INTO configuraciones_email (
    casilla_id, servidor_imap, puerto_imap, servidor_smtp, puerto_smtp,
    usuario, password, usa_ssl, usa_starttls, carpeta_entrada, activo
) VALUES (
    45, 'mail.dreamhost.com', 993, 'mail.dreamhost.com', 587,
    'casilla45@tudominio.com', 'password_casilla45', true, true, 'INBOX', true
) ON CONFLICT DO NOTHING;

-- Secretos del sistema predefinidos
INSERT INTO system_secrets (category, key, description, masked, config) VALUES
('ai_apis', 'OPENROUTER_API_KEY', 'Clave para acceso a OpenRouter para YAML Studio', true, '{"api_key": ""}'),
('ai_apis', 'OPENAI_API_KEY', 'Clave para servicios de OpenAI', true, '{"api_key": ""}'),
('database', 'DATABASE_MAIN', 'Configuración de conexión a PostgreSQL principal', true, '{"host": "localhost", "port": 5432, "database": "sage", "username": "sage", "password": "", "ssl_mode": "prefer"}'),
('database', 'DATABASE_BACKUP', 'Configuración para base de datos de respaldo', true, '{"host": "", "port": 5432, "database": "", "username": "", "password": ""}'),
('external_services', 'SENDGRID_CONFIG', 'Configuración para servicio de email SendGrid', true, '{"api_key": "", "from_email": "", "from_name": "Sistema SAGE"}'),
('external_services', 'WEBHOOK_CONFIG', 'Configuración para webhooks y notificaciones', true, '{"secret": "", "endpoint": "", "timeout": 30}'),
('security', 'JWT_CONFIG', 'Configuración para tokens JWT', true, '{"secret": "", "expiry": 24, "algorithm": "HS256"}'),
('security', 'SESSION_CONFIG', 'Configuración para gestión de sesiones', true, '{"secret": "", "max_age": 1440}'),
('security', 'ENCRYPTION_CONFIG', 'Configuración de cifrado del sistema', true, '{"key": "", "algorithm": "AES-256-GCM"}')
ON CONFLICT (key) DO NOTHING;

-- Suscripciones de ejemplo
INSERT INTO suscripciones (casilla_id, email, nombre, activo) VALUES
(1, 'admin@tudominio.com', 'Administrador del Sistema', true),
(1, 'soporte@tudominio.com', 'Equipo de Soporte', true),
(45, 'reportes@tudominio.com', 'Sistema de Reportes', true)
ON CONFLICT DO NOTHING;

-- Configuraciones de cloud storage de ejemplo
INSERT INTO cloud_storage_connections (nombre, proveedor, configuracion, activo) VALUES
('AWS S3 Principal', 'aws_s3', '{"bucket": "sage-backups", "region": "us-east-1", "access_key": "", "secret_key": ""}', false),
('Azure Blob Storage', 'azure_blob', '{"account_name": "", "account_key": "", "container": "sage-backups"}', false),
('Google Cloud Storage', 'google_cloud', '{"bucket": "sage-backups", "project_id": "", "credentials_path": ""}', false),
('MinIO Local', 'minio', '{"endpoint": "localhost:9000", "access_key": "", "secret_key": "", "bucket": "sage-backups", "secure": false}', false)
ON CONFLICT DO NOTHING;

-- Actividad inicial del sistema
INSERT INTO actividad_sistema (tipo_actividad, descripcion, detalles) VALUES
('sistema_inicializado', 'Base de datos SAGE inicializada correctamente', '{"version": "1.0.0", "timestamp": "' || CURRENT_TIMESTAMP || '"}');

-- ==========================================
-- FUNCIONES Y TRIGGERS
-- ==========================================

-- Función para actualizar timestamp de modificación
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar system_secrets
DROP TRIGGER IF EXISTS update_system_secrets_updated_at ON system_secrets;
CREATE TRIGGER update_system_secrets_updated_at
    BEFORE UPDATE ON system_secrets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para registrar actividad automáticamente
CREATE OR REPLACE FUNCTION log_system_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO actividad_sistema (tipo_actividad, descripcion, detalles)
        VALUES ('ejecucion_creada', 'Nueva ejecución registrada', 
                json_build_object('uuid', NEW.uuid_ejecucion, 'casilla_id', NEW.casilla_id, 'archivo', NEW.nombre_archivo));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.estado != NEW.estado THEN
        INSERT INTO actividad_sistema (tipo_actividad, descripcion, detalles)
        VALUES ('estado_cambiado', 'Estado de ejecución actualizado', 
                json_build_object('uuid', NEW.uuid_ejecucion, 'estado_anterior', OLD.estado, 'estado_nuevo', NEW.estado));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger para actividad automática
DROP TRIGGER IF EXISTS log_ejecucion_activity ON ejecuciones_yaml;
CREATE TRIGGER log_ejecucion_activity
    AFTER INSERT OR UPDATE ON ejecuciones_yaml
    FOR EACH ROW
    EXECUTE FUNCTION log_system_activity();

-- ==========================================
-- VISTAS ÚTILES
-- ==========================================

-- Vista para estadísticas de ejecuciones
CREATE OR REPLACE VIEW vista_estadisticas_ejecuciones AS
SELECT 
    casilla_id,
    COUNT(*) as total_ejecuciones,
    COUNT(CASE WHEN estado = 'Éxito' THEN 1 END) as exitosas,
    COUNT(CASE WHEN estado = 'Fallido' THEN 1 END) as fallidas,
    COUNT(CASE WHEN estado IN ('pendiente', 'en_proceso') THEN 1 END) as pendientes,
    ROUND(AVG(EXTRACT(EPOCH FROM tiempo_procesamiento)), 2) as tiempo_promedio_segundos,
    MAX(fecha_ejecucion) as ultima_ejecucion
FROM ejecuciones_yaml
GROUP BY casilla_id;

-- Vista para actividad reciente
CREATE OR REPLACE VIEW vista_actividad_reciente AS
SELECT 
    a.id,
    a.casilla_id,
    a.tipo_actividad,
    a.descripcion,
    a.timestamp,
    e.nombre_archivo,
    e.estado as estado_ejecucion
FROM actividad_sistema a
LEFT JOIN ejecuciones_yaml e ON (a.detalles->>'uuid')::uuid = e.uuid_ejecucion
ORDER BY a.timestamp DESC
LIMIT 100;

-- ==========================================
-- PERMISOS FINALES
-- ==========================================

-- Otorgar permisos al usuario sage sobre todas las tablas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sage;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sage;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO sage;

-- Configurar permisos por defecto para futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON TABLES TO sage;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON SEQUENCES TO sage;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT EXECUTE ON FUNCTIONS TO sage;

-- ==========================================
-- INFORMACIÓN FINAL
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Base de datos SAGE inicializada correctamente';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Usuario: sage';
    RAISE NOTICE 'Base de datos: sage';
    RAISE NOTICE 'Tablas creadas: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE 'Configuraciones de email: %', (SELECT COUNT(*) FROM configuraciones_email);
    RAISE NOTICE 'Secretos del sistema: %', (SELECT COUNT(*) FROM system_secrets);
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Para conectar: psql -h localhost -U sage -d sage';
    RAISE NOTICE '===========================================';
END $$;