# Guía de Instalación para Despliegue

## Dependencias Requeridas

Después de clonar el repositorio, ejecuta:

```bash
npm install next-auth@^4.24.15 yaml@^2.3.4
```

## Verificación de Archivos

Asegúrate de que estos archivos existen:
- src/utils/cloud/adapters/minio.js
- src/utils/cloud/adapters/minio_fixed.js
- src/components/ConfirmDialog.js
- lib/yaml-parser.js
- src/lib/yaml-parser.js

## Build de Verificación

```bash
npm run build
```

Si hay errores, ejecuta los scripts de corrección en orden:
1. node scripts/fix-compilation-errors.js
2. node scripts/fix-latest-compilation-errors.js  
3. node scripts/fix-nextauth-minio-errors.js
