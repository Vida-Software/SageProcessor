#!/usr/bin/env node
/**
 * Script para corregir errores de compilación de Next.js 15.x
 * Maneja: conflictos de pool, imports incorrectos, dependencias faltantes, y configuración
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Corrigiendo errores de compilación de Next.js 15.x...\n');

let filesFixed = 0;
let errors = [];

// 1. Corregir conflictos de pool y imports en archivos API
console.log('📁 Corrigiendo conflictos de pool e imports en archivos API...');

const apiFiles = glob.sync('src/pages/api/**/*.{js,ts,jsx,tsx}');

apiFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let changes = [];

    // Detectar si tiene import de query y declaración local de pool
    const hasQueryImport = content.includes("import { query }") && content.includes("@/lib/db");
    const hasLocalPool = /const\s+pool\s*=\s*new\s+Pool/.test(content);
    const hasPoolImport = /import.*pool.*from/.test(content);

    if (hasQueryImport || hasLocalPool || hasPoolImport) {
      // Remover import incorrecto de query de @/lib/db
      if (hasQueryImport) {
        content = content.replace(
          /import\s*{\s*query\s*}\s*from\s*['"]@\/lib\/db['"];?\s*\n?/g,
          ''
        );
        changes.push('Removido import de query de @/lib/db');
      }

      // Remover import de pool si existe
      if (hasPoolImport) {
        content = content.replace(
          /import\s*{\s*pool[^}]*}\s*from\s*['"]@\/utils\/db['"];?\s*\n?/g,
          ''
        );
        changes.push('Removido import de pool');
      }

      // Si hay declaración local de pool, asegurarnos que esté bien
      if (hasLocalPool) {
        // Verificar que tenga el import de Pool
        if (!content.includes("import { Pool }")) {
          // Buscar una línea de import existente para agregar después
          const importMatch = content.match(/^import.*from.*['"];?\s*$/m);
          if (importMatch) {
            content = content.replace(
              importMatch[0],
              importMatch[0] + '\nimport { Pool } from \'pg\';'
            );
          } else {
            // Agregar al inicio del archivo
            content = "import { Pool } from 'pg';\n" + content;
          }
          changes.push('Agregado import de Pool');
        }

        // Crear función query local si no existe
        if (!content.includes('const query =') && !content.includes('async function query')) {
          // Agregar función query después de la declaración del pool
          const poolDeclarationMatch = content.match(/const\s+pool\s*=\s*new\s+Pool\s*\({[^}]*}\s*\);/);
          if (poolDeclarationMatch) {
            const queryFunction = `\n\n// Función helper para queries
const query = async (text, params) => {
  const result = await pool.query(text, params);
  return result.rows;
};`;
            
            content = content.replace(
              poolDeclarationMatch[0],
              poolDeclarationMatch[0] + queryFunction
            );
            changes.push('Agregada función query local');
          }
        }
      }
    }

    // Solo escribir si hubo cambios
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath}`);
      console.log(`   Cambios: ${changes.join(', ')}`);
      filesFixed++;
    }
  } catch (error) {
    errors.push(`Error procesando ${filePath}: ${error.message}`);
  }
});

// 2. Corregir next.config.js para Next.js 15.x
console.log('\n📁 Corrigiendo next.config.js para Next.js 15.x...');

const nextConfigPath = 'next.config.js';
if (fs.existsSync(nextConfigPath)) {
  try {
    let content = fs.readFileSync(nextConfigPath, 'utf8');
    const originalContent = content;

    // Mover configuración de api a pages
    if (content.includes('api: {')) {
      content = content.replace(
        /api:\s*{[^}]*bodyParser:[^}]*sizeLimit:[^}]*}[^}]*}/g,
        `pages: {
    api: {
      bodyParser: {
        sizeLimit: '100mb',
      },
      responseLimit: '100mb',
    },
  }`
      );
      
      if (content !== originalContent) {
        fs.writeFileSync(nextConfigPath, content);
        console.log(`✅ ${nextConfigPath} - Configuración de API movida a pages`);
        filesFixed++;
      }
    }
  } catch (error) {
    errors.push(`Error corrigiendo next.config.js: ${error.message}`);
  }
}

// 3. Actualizar package.json para agregar dependencias faltantes
console.log('\n📁 Agregando dependencias faltantes a package.json...');

const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let modified = false;

    // Agregar mysql2 si no existe
    if (!packageJson.dependencies['mysql2']) {
      packageJson.dependencies['mysql2'] = '^3.11.3';
      modified = true;
      console.log('✅ Agregada dependencia mysql2');
    }

    // Verificar otras dependencias comunes para materialización
    const missingDeps = {
      'tedious': '^18.0.0',  // Para SQL Server
      'sqlite3': '^5.1.7',   // Para SQLite
      'better-sqlite3': '^11.7.0'  // Para SQLite alternativo
    };

    Object.entries(missingDeps).forEach(([dep, version]) => {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
        packageJson.dependencies[dep] = version;
        modified = true;
        console.log(`✅ Agregada dependencia ${dep}`);
      }
    });

    if (modified) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      filesFixed++;
      console.log('\n💡 Ejecuta: npm install');
    }
  } catch (error) {
    errors.push(`Error actualizando package.json: ${error.message}`);
  }
}

// 4. Crear archivo de utilidades de base de datos si no existe
console.log('\n📁 Verificando utilities de base de datos...');

const dbUtilPaths = ['src/lib/db.js', 'src/utils/db.js'];
let hasValidDbUtil = false;

dbUtilPaths.forEach(dbPath => {
  if (fs.existsSync(dbPath)) {
    const content = fs.readFileSync(dbPath, 'utf8');
    if (content.includes('export') && content.includes('pool')) {
      hasValidDbUtil = true;
    }
  }
});

// Si no existe utilidad válida, crear una
if (!hasValidDbUtil) {
  const libDir = 'src/lib';
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  const dbUtilContent = `/**
 * Utilidades de base de datos para conexiones múltiples
 */
import { Pool } from 'pg';

// Pool principal de PostgreSQL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Función query helper
export const query = async (text, params) => {
  const result = await pool.query(text, params);
  return result.rows;
};

// Función para obtener la conexión
export const getDb = async () => {
  return pool;
};

export default pool;
`;

  fs.writeFileSync('src/lib/db.js', dbUtilContent);
  console.log('✅ Creado src/lib/db.js con utilidades de base de datos');
  filesFixed++;
}

// 5. Corregir imports de componentes y iconos que faltaron
console.log('\n📁 Corrigiendo imports de componentes restantes...');

const componentFiles = glob.sync('src/pages/**/*.{js,ts,jsx,tsx}');

componentFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let changes = [];

    // Corregir Breadcrumbs -> BreadcrumbNav
    if (content.includes('Breadcrumbs') && !content.includes('BreadcrumbNav')) {
      content = content.replace(
        /import\s+Breadcrumbs\s+from\s+['"]@\/components\/Breadcrumbs['"];?/g,
        "import BreadcrumbNav from '@/components/nav/BreadcrumbNav';"
      );
      
      content = content.replace(/<Breadcrumbs/g, '<BreadcrumbNav');
      content = content.replace(/<\/Breadcrumbs>/g, '</BreadcrumbNav>');
      
      changes.push('Breadcrumbs → BreadcrumbNav');
    }

    // Corregir iconos problemáticos
    const iconMappings = {
      'DatabaseIcon': 'CircleStackIcon',
      'SaveIcon': 'ArrowDownTrayIcon',
      'CollectionIcon': 'RectangleStackIcon'
    };

    Object.entries(iconMappings).forEach(([oldIcon, newIcon]) => {
      if (content.includes(oldIcon)) {
        content = content.replace(new RegExp(`\\b${oldIcon}\\b`, 'g'), newIcon);
        changes.push(`${oldIcon} → ${newIcon}`);
      }
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath} - ${changes.join(', ')}`);
      filesFixed++;
    }
  } catch (error) {
    errors.push(`Error procesando componente ${filePath}: ${error.message}`);
  }
});

// 6. Resumen y recomendaciones
console.log(`\n📊 Resumen: ${filesFixed} archivos corregidos`);

if (errors.length > 0) {
  console.log('\n❌ Errores encontrados:');
  errors.forEach(error => console.log(`   ${error}`));
}

if (filesFixed > 0) {
  console.log('\n✅ Correcciones aplicadas:');
  console.log('- Conflictos de pool resueltos en archivos API');
  console.log('- Imports incorrectos de @/lib/db corregidos');
  console.log('- next.config.js actualizado para Next.js 15.x');
  console.log('- Dependencias faltantes agregadas a package.json');
  console.log('- Utilidades de base de datos verificadas/creadas');
  console.log('- Componentes e iconos corregidos');
  
  console.log('\n🚀 Próximos pasos:');
  console.log('1. npm install                    # Instalar nuevas dependencias');
  console.log('2. npm run build                  # Compilar para verificar');
  console.log('3. npm run dev                    # Probar en desarrollo');
  
  console.log('\n💡 Si persisten errores de cloud adapters, ejecuta:');
  console.log('npm install --save-dev @types/mysql2');
} else {
  console.log('\n✅ No se encontraron errores de compilación que corregir');
}