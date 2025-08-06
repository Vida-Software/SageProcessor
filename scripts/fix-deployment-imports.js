#!/usr/bin/env node
/**
 * Script para corregir imports absolutos en caso de problemas de despliegue
 * Este script convierte imports de @/lib/db a rutas relativas
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Corrigiendo imports para despliegue...\n');

// Encontrar todos los archivos JS/TS en src/pages/api
const apiFiles = glob.sync('src/pages/api/**/*.{js,ts,jsx,tsx}');
// Encontrar archivos de páginas admin
const adminFiles = glob.sync('src/pages/admin/**/*.{js,ts,jsx,tsx}');

let filesFixed = 0;

// 1. Corregir imports de base de datos en archivos API
console.log('📁 Corrigiendo imports de base de datos...');
apiFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Calcular la ruta relativa desde el archivo actual hasta src/lib/db
    const fileDir = path.dirname(filePath);
    const relativePath = path.relative(fileDir, 'src/lib/db.js');
    const normalizedPath = relativePath.replace(/\\/g, '/');
    
    // Reemplazar import de @/lib/db con ruta relativa
    content = content.replace(
      /from\s+['"]@\/lib\/db['"];?/g,
      `from '${normalizedPath.startsWith('.') ? normalizedPath : './' + normalizedPath}';`
    );
    
    content = content.replace(
      /import\s+(['"]@\/lib\/db['"])/g,
      `import '${normalizedPath.startsWith('.') ? normalizedPath : './' + normalizedPath}'`
    );
    
    // Solo escribir si hubo cambios
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corregido: ${filePath}`);
      console.log(`   @/lib/db → ${normalizedPath.startsWith('.') ? normalizedPath : './' + normalizedPath}`);
      filesFixed++;
    }
  } catch (error) {
    console.log(`❌ Error procesando ${filePath}:`, error.message);
  }
});

// 2. Corregir imports de Breadcrumbs en archivos admin
console.log('\n🍞 Corrigiendo imports de Breadcrumbs...');
const allFiles = [...apiFiles, ...adminFiles];

allFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Corregir import de Breadcrumbs
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
    
    // Agregar función query a utils/db si es necesario
    if (content.includes('import { query }') && filePath.includes('src/pages/api/')) {
      content = content.replace(
        /import\s*{\s*query\s*}\s*from\s*['"]@\/utils\/db['"];?/g,
        "import { pool } from '@/utils/db';"
      );
      
      // Cambiar await query( por await pool.query(
      content = content.replace(
        /await\s+query\s*\(/g,
        'await pool.query('
      );
      
      // Cambiar = query( por = pool.query(
      content = content.replace(
        /=\s*query\s*\(/g,
        '= pool.query('
      );
      
      // Agregar .rows donde sea necesario (más común en PostgreSQL)
      content = content.replace(
        /(const\s+\w+\s*=\s*await\s+pool\.query\([^)]+\);)/g,
        '$1\n        const result = $1.rows || $1;'
      );
    }
    
    // Solo escribir si hubo cambios
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corregido: ${filePath}`);
      filesFixed++;
    }
  } catch (error) {
    console.log(`❌ Error procesando ${filePath}:`, error.message);
  }
});

console.log(`\n📊 Resumen: ${filesFixed} archivos corregidos`);

if (filesFixed > 0) {
  console.log('\n⚠️  IMPORTANTE:');
  console.log('- Los imports se convirtieron a rutas relativas');
  console.log('- Esto es solo para resolver problemas de despliegue');
  console.log('- El código funcionará igual pero sin dependencias de alias');
  console.log('- Puedes revertir estos cambios cuando el alias funcione correctamente');
} else {
  console.log('\n✅ No se encontraron imports que corregir');
}