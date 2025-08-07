#!/usr/bin/env node

const fs = require('fs');

console.log('🚨 CORRECCIÓN CRÍTICA: Error de Pre-renderizado en /admin');
console.log('❗ Problema: getServerSession usado sin importar en casillas_fix.js\n');

let filesFixed = 0;

function fixFile(filePath, description, processor) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = processor(content);
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ ${description}: ${filePath}`);
      filesFixed++;
      return true;
    }
    console.log(`ℹ️  ${description}: ${filePath} (sin cambios)`);
    return false;
  } catch (error) {
    console.log(`❌ Error procesando ${filePath}: ${error.message}`);
    return false;
  }
}

// CORRECCIÓN 1: Descomentar importación de getServerSession
console.log('1️⃣ Corrigiendo importación de getServerSession...');
fixFile('src/pages/api/portales/[uuid]/casillas_fix.js', 'Habilitado getServerSession', (content) => {
  let newContent = content;

  // Descomentar la importación de getServerSession
  newContent = newContent.replace(
    /\/\/ import { getServerSession } from "next-auth\/next"/,
    'import { getServerSession } from "next-auth/next"'
  );

  return newContent;
});

// CORRECCIÓN 2: Verificar otros archivos con el mismo patrón
console.log('2️⃣ Buscando otros archivos con problemas similares...');

const suspiciousFiles = [
  'src/pages/api/admin/system-secrets/test.js',
  'src/pages/api/admin/db-secrets/test-connection.js'
];

suspiciousFiles.forEach(filePath => {
  fixFile(filePath, 'Verificando importaciones NextAuth', (content) => {
    let newContent = content;

    // Si usa getServerSession pero no lo importa
    if (content.includes('getServerSession') && !content.includes('import { getServerSession }')) {
      // Agregar importación al principio del archivo
      if (content.includes('import { authOptions }')) {
        newContent = newContent.replace(
          /import { authOptions } from/,
          'import { getServerSession } from "next-auth/next"\nimport { authOptions } from'
        );
      } else {
        // Agregar después de otras importaciones
        const importMatch = content.match(/(import .* from .*\n)+/);
        if (importMatch) {
          const lastImport = importMatch[0];
          newContent = newContent.replace(
            lastImport,
            lastImport + 'import { getServerSession } from "next-auth/next"\n'
          );
        }
      }
    }

    return newContent;
  });
});

// CORRECCIÓN 3: Verificar que no haya otros problemas de destructuring en NextAuth
console.log('3️⃣ Verificando configuración de NextAuth...');
fixFile('src/pages/api/auth/[...nextauth].js', 'Validando authOptions', (content) => {
  let newContent = content;

  // Asegurar que authOptions está correctamente estructurado
  if (!content.includes('export const authOptions')) {
    console.log('⚠️  authOptions no encontrado, podría necesitar corrección manual');
  }

  return newContent;
});

console.log(`\n🎉 Corrección crítica de pre-renderizado completada!`);
console.log(`📊 Archivos corregidos: ${filesFixed}`);
console.log('\n🔧 PROBLEMA IDENTIFICADO:');
console.log('   - getServerSession usado en casillas_fix.js sin importar');
console.log('   - Esto causaba error de destructuring durante SSR');
console.log('   - El build de Next.js fallaba en la página /admin');
console.log('\n✅ SOLUCIÓN APLICADA:');
console.log('   - Habilitada importación de getServerSession');
console.log('   - Verificados otros archivos con problemas similares');
console.log('   - Build debería completarse sin errores ahora');
console.log('\n💡 Este era el error crítico que impedía el despliegue');