# Guía de Corrección para Despliegue de SAGE

## Descripción del Problema

SAGE funciona perfectamente en el ambiente Replit, pero presenta errores de compilación al desplegarlo en computadoras externas. Esta guía proporciona las soluciones para todos los problemas identificados durante el despliegue.

## Errores Comunes de Despliegue

### 1. Módulos No Encontrados
- `Module not found: Can't resolve '@/lib/db'`
- `Module not found: Can't resolve '../../../../lib/yaml-parser'`
- `Module not found: Can't resolve '../../../../src/utils/cloud/adapters/minio'`

### 2. Conflictos de Identificadores
- `Identifier 'Pool' has already been declared`
- `Identifier 'pool' has already been declared`

### 3. Componentes e Iconos Incompatibles
- `DatabaseIcon is not exported from @heroicons/react`
- `Breadcrumbs is not defined`

### 4. Configuración Next.js
- `Invalid next.config.js options detected: 'api'`

## Soluciones Paso a Paso

### Paso 1: Verificar Archivos en GitHub

Antes de empezar, revisa que estos archivos estén presentes en tu repositorio de GitHub:

```bash
# Archivos críticos que deben estar presentes:
src/lib/db.js
lib/yaml-parser.js
src/utils/cloud/adapters/minio.js
src/utils/cloud/adapters/minio_fixed.js
src/components/nav/BreadcrumbNav.js
```

Si faltan archivos, revisa el `.gitignore` y asegúrate de que no esté excluyendo carpetas importantes.

### Paso 2: Ejecutar Script de Corrección Principal

Descarga y ejecuta el script principal de corrección:

```bash
# Crear el script de corrección
node scripts/fix-compilation-errors.js
```

Este script corrige:
- Conflictos de identificadores `pool`
- Importaciones incorrectas de iconos
- Referencias a componentes inexistentes
- Configuración de Next.js 15.x
- Dependencias faltantes

### Paso 3: Ejecutar Script de Corrección Adicional

Para errores restantes, ejecuta:

```bash
# Corrección de errores adicionales
node scripts/fix-remaining-errors.js
```

Este script resuelve:
- Importaciones duplicadas de `Pool`
- Archivos de adaptadores de nube faltantes
- Biblioteca yaml-parser faltante

### Paso 4: Instalar Dependencias

```bash
npm install
```

Asegúrate de que todas las dependencias de base de datos estén instaladas:
- `mysql2`
- `tedious`
- `sqlite3`
- `better-sqlite3`
- `pg`

### Paso 5: Verificar Compilación

```bash
npm run build
```

Si el build es exitoso, el despliegue debería funcionar correctamente.

## Scripts de Corrección Automática

### Script Principal: `fix-compilation-errors.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Script completo de corrección que maneja:
// - Pool identifier conflicts
// - Icon compatibility (DatabaseIcon → CircleStackIcon)
// - Component imports (Breadcrumbs → BreadcrumbNav)
// - Next.js 15.x configuration
// - Missing dependencies
```

### Script Adicional: `fix-remaining-errors.js`

```javascript
#!/usr/bin/env node

// Script que corrige errores específicos:
// - Duplicate Pool imports
// - Missing cloud adapters
// - Missing yaml-parser library
```

## Archivos Críticos Creados

### 1. `lib/yaml-parser.js`
Biblioteca para parseo de configuraciones YAML de SAGE:

```javascript
import yaml from 'yaml';

export function parseYaml(yamlString) {
  // Parseo seguro de YAML
}

export function validateSageYaml(yamlData) {
  // Validación de estructura SAGE
}
```

### 2. Adaptadores de Nube
- `src/utils/cloud/adapters/minio.js`
- `src/utils/cloud/adapters/minio_fixed.js`

### 3. Correcciones de Configuración

#### `next.config.js` - Compatibilidad Next.js 15.x
```javascript
module.exports = {
  pages: {
    api: {
      bodyParser: {
        sizeLimit: '100mb',
      },
      responseLimit: '100mb',
    },
  },
  // ... resto de configuración
}
```

#### `package.json` - Dependencias Añadidas
```json
{
  "dependencies": {
    "mysql2": "^3.6.0",
    "tedious": "^16.4.0",
    "sqlite3": "^5.1.6",
    "better-sqlite3": "^8.7.0"
  }
}
```

## Mapeo de Componentes e Iconos

### Iconos Corregidos
```javascript
// Antes (no funciona en despliegue):
import { DatabaseIcon } from '@heroicons/react/24/outline';

// Después (compatible):
import { CircleStackIcon as DatabaseIcon } from '@heroicons/react/24/outline';
```

### Componentes Corregidos
```javascript
// Antes (referencia incorrecta):
import Breadcrumbs from '@/components/nav/Breadcrumbs';

// Después (referencia correcta):
import BreadcrumbNav as Breadcrumbs from '@/components/nav/BreadcrumbNav';
```

## Verificación Post-Despliegue

Después de aplicar todas las correcciones, verifica que:

1. ✅ `npm run build` completa sin errores
2. ✅ Todos los módulos se resuelven correctamente
3. ✅ No hay conflictos de identificadores
4. ✅ Los iconos se cargan correctamente
5. ✅ Las conexiones de base de datos funcionan

## Notas Importantes

- **NO modificar el ambiente Replit**: Estas correcciones son solo para despliegue externo
- **Mantener sincronización**: Cuando hagas cambios en Replit, asegúrate de que estén en GitHub
- **Revisar .gitignore**: Evitar que archivos importantes sean excluidos del repositorio
- **Dependencias**: Siempre ejecutar `npm install` después de clonar el repositorio

## Solución de Problemas Comunes

### Error: "Module not found"
1. Verificar que el archivo exista en GitHub
2. Revisar .gitignore por exclusiones incorrectas
3. Ejecutar scripts de corrección
4. Instalar dependencias faltantes

### Error: "Identifier already declared"
1. Ejecutar `fix-remaining-errors.js`
2. Revisar importaciones duplicadas manualmente
3. Verificar que no hay conflictos de nombres

### Error: "Invalid next.config.js"
1. Actualizar configuración para Next.js 15.x
2. Mover configuración API a estructura `pages.api`

## Contacto y Soporte

Si persisten errores después de aplicar estas correcciones:

1. Verificar logs completos de compilación
2. Comprobar versiones de Node.js y npm
3. Limpiar cache: `npm run clean` o eliminar `.next/` y `node_modules/`
4. Reinstalar dependencias: `rm -rf node_modules && npm install`

## 🆕 Errores Adicionales Recientes (Actualización)

### Nuevos Errores Identificados

Si después de aplicar las correcciones anteriores aún encuentras estos errores:

#### Error: Can't resolve yaml-parser
```
./src/pages/api/data-boxes/[id]/update.ts
Module not found: Can't resolve '../../../../lib/yaml-parser'
```

#### Error: Can't resolve ConfirmDialog
```
./src/pages/admin/casillas/[id]/materialization.js
Module not found: Can't resolve '@/components/ConfirmDialog'
```

#### Error: Can't resolve next-auth
```
./src/pages/api/portales/[uuid]/casillas_fix.js
Module not found: Can't resolve 'next-auth/next'
Module not found: Can't resolve '../../auth/[...nextauth]'
```

### Script de Corrección Actualizado

Ejecuta el nuevo script de corrección para estos errores:

```bash
node scripts/fix-latest-compilation-errors.js
```

Este script resuelve:

1. **Ruta yaml-parser**: Crea `src/lib/yaml-parser.js` para compatibilidad de rutas
2. **ConfirmDialog**: Crea componente completo de diálogo de confirmación
3. **NextAuth**: Crea configuración básica de autenticación
4. **Dependencia yaml**: Agrega `yaml: "^2.3.4"` al package.json

### Archivos Creados Automáticamente

- `src/components/ConfirmDialog.js` - Componente de diálogo modal
- `src/pages/api/auth/[...nextauth].js` - Configuración NextAuth
- `src/lib/yaml-parser.js` - Copia del parser YAML en src/lib/

## 🚨 Error Crítico de Pre-renderizado

### Error de Build: "Cannot destructure property 'auth' of 'e' as it is undefined"

**❗ PROBLEMA CRÍTICO IDENTIFICADO:**
- `getServerSession` usado en `casillas_fix.js` sin importar  
- Importación comentada pero función en uso (línea 25)
- Causa error de destructuring durante SSR en página `/admin`

Este error ocurre durante el build de Next.js y impide completar el despliegue:

```
TypeError: Cannot destructure property 'auth' of 'e' as it is undefined.
Error occurred prerendering page "/admin". Read more: https://nextjs.org/docs/messages/prerender-error
Export encountered an error on /admin, exiting the build.
```

**Causa**: Código API intentando destructurar propiedades undefined durante Server-Side Rendering (SSR).

### Secuencia Completa de Corrección

Para un despliegue exitoso, ejecuta todos los scripts en orden:

```bash
# 1. Correcciones principales
node scripts/fix-compilation-errors.js

# 2. Correcciones adicionales  
node scripts/fix-latest-compilation-errors.js

# 3. Correcciones NextAuth y MinIO
node scripts/fix-nextauth-minio-errors.js

# 4. Corrección authOptions
node scripts/fix-auth-options-error.js

# 5. Corrección error crítico de pre-renderizado
node scripts/fix-prerender-error.js

# 6. Corrección específica del error de getServerSession
node scripts/fix-critical-prerender-error.js

# 7. Instalar dependencias
npm install

# 8. Verificar build
npm run build
```

---

**Última actualización**: Agosto 2025  
**Versión SAGE**: Compatible con Next.js 15.x y Node.js 20+