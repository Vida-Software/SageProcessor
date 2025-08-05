#!/usr/bin/env node
/**
 * Script completo para corregir errores de despliegue
 * Maneja: imports de DB, componentes Breadcrumbs, e iconos
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Corrigiendo errores de despliegue completo...\n');

// Encontrar archivos relevantes
const apiFiles = glob.sync('src/pages/api/**/*.{js,ts,jsx,tsx}');
const adminFiles = glob.sync('src/pages/admin/**/*.{js,ts,jsx,tsx}');
const allFiles = [...apiFiles, ...adminFiles];

let filesFixed = 0;

console.log('📁 Corrigiendo errores de imports y componentes...');

allFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let changes = [];

    // 1. Corregir import de función query inexistente
    if (content.includes('import { query }') && filePath.includes('src/pages/api/')) {
      content = content.replace(
        /import\s*{\s*query\s*}\s*from\s*['"]@\/[^'"]*db['"];?/g,
        "import { pool } from '@/utils/db';"
      );
      
      // Cambiar uso de query por pool.query
      content = content.replace(
        /await\s+query\s*\(/g,
        'await pool.query('
      );
      
      content = content.replace(
        /=\s*query\s*\(/g,
        '= pool.query('
      );

      changes.push('query → pool.query');
    }

    // 2. Corregir import de Breadcrumbs por BreadcrumbNav
    if (content.includes('Breadcrumbs') && !content.includes('BreadcrumbNav')) {
      content = content.replace(
        /import\s+Breadcrumbs\s+from\s+['"]@\/components\/Breadcrumbs['"];?/g,
        "import BreadcrumbNav from '@/components/nav/BreadcrumbNav';"
      );
      
      // Corregir uso del componente
      content = content.replace(
        /<Breadcrumbs/g,
        '<BreadcrumbNav'
      );
      
      content = content.replace(
        /<\/Breadcrumbs>/g,
        '</BreadcrumbNav>'
      );

      changes.push('Breadcrumbs → BreadcrumbNav');
    }

    // 3. Corregir iconos de Heroicons problemáticos
    const iconMappings = {
      'DatabaseIcon': 'CircleStackIcon',
      'SaveIcon': 'ArrowDownTrayIcon'
    };

    Object.entries(iconMappings).forEach(([oldIcon, newIcon]) => {
      if (content.includes(oldIcon)) {
        // Corregir import
        content = content.replace(
          new RegExp(`(\\b${oldIcon}\\b)`, 'g'),
          newIcon
        );
        changes.push(`${oldIcon} → ${newIcon}`);
      }
    });

    // Solo escribir si hubo cambios
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath}`);
      console.log(`   Cambios: ${changes.join(', ')}`);
      filesFixed++;
    }
  } catch (error) {
    console.log(`❌ Error procesando ${filePath}:`, error.message);
  }
});

// 4. Verificar que src/utils/db.js tiene función query (crearla si no existe)
const dbUtilsPath = 'src/utils/db.js';
if (fs.existsSync(dbUtilsPath)) {
  try {
    let dbContent = fs.readFileSync(dbUtilsPath, 'utf8');
    
    // Si no tiene función query, agregarla
    if (!dbContent.includes('export const query') && !dbContent.includes('export { query }')) {
      // Agregar función query helper
      const queryFunction = `
// Función helper para queries simples
export const query = async (text, params) => {
  const result = await pool.query(text, params);
  return result.rows;
};`;
      
      dbContent = dbContent.replace(
        /export \{ pool \};/,
        `${queryFunction}\n\nexport { pool };`
      );
      
      fs.writeFileSync(dbUtilsPath, dbContent);
      console.log(`✅ Agregada función query a ${dbUtilsPath}`);
      filesFixed++;
    }
  } catch (error) {
    console.log(`❌ Error modificando ${dbUtilsPath}:`, error.message);
  }
}

console.log(`\n📊 Resumen: ${filesFixed} archivos/componentes corregidos`);

if (filesFixed > 0) {
  console.log('\n✅ Correcciones aplicadas:');
  console.log('- Imports de query corregidos a pool.query');
  console.log('- Componente Breadcrumbs corregido a BreadcrumbNav');
  console.log('- Iconos DatabaseIcon/SaveIcon actualizados');
  console.log('- Función query agregada a src/utils/db.js');
  console.log('\nEjecuta: npm run build');
} else {
  console.log('\n✅ No se encontraron errores que corregir');
}