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

let filesFixed = 0;

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