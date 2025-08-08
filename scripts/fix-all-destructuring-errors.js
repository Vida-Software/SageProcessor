#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚨 CORRECCIÓN EXHAUSTIVA: Destructuring errors durante SSR\n');

let filesFixed = 0;

function findAllJsFiles(dir, allFiles = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findAllJsFiles(fullPath, allFiles);
    } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      allFiles.push(fullPath);
    }
  }
  
  return allFiles;
}

function fixDestructuring(content) {
  let newContent = content;
  let hasChanges = false;

  // PATRÓN 1: Destructuring de req.body sin validación
  const reqBodyDestructureRegex = /const\s*{\s*[^}]*auth[^}]*}\s*=\s*req\.body\s*;/g;
  const matches = content.match(reqBodyDestructureRegex);
  
  if (matches) {
    for (const match of matches) {
      // Si no hay validación previa de req.body
      if (!content.includes('if (!req.body)') || content.indexOf('if (!req.body)') > content.indexOf(match)) {
        const replacement = `
    // Verificar que req.body existe para evitar errores de destructuring durante SSR
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    ${match}`;
        
        newContent = newContent.replace(match, replacement);
        hasChanges = true;
      }
    }
  }

  // PATRÓN 2: Destructuring de objetos que pueden ser undefined
  const unsafeDestructureRegex = /const\s*{\s*[^}]*auth[^}]*}\s*=\s*([^;]+);/g;
  let destructureMatch;
  
  while ((destructureMatch = unsafeDestructureRegex.exec(content)) !== null) {
    const fullMatch = destructureMatch[0];
    const sourceObj = destructureMatch[1].trim();
    
    // Si no es req.body (ya manejado arriba)
    if (!sourceObj.includes('req.body')) {
      // Agregar valores por defecto en el destructuring
      const safeDestructure = fullMatch.replace(
        /{\s*([^}]+)\s*}/,
        (match, props) => {
          const propsArray = props.split(',').map(prop => {
            const trimmedProp = prop.trim();
            if (trimmedProp.includes('auth') && !trimmedProp.includes('=')) {
              return `${trimmedProp} = {}`;
            }
            return trimmedProp;
          });
          return `{ ${propsArray.join(', ')} }`;
        }
      );
      
      if (safeDestructure !== fullMatch) {
        newContent = newContent.replace(fullMatch, safeDestructure);
        hasChanges = true;
      }
    }
  }

  // PATRÓN 3: useMemo con destructuring inseguro
  const useMemoRegex = /useMemo\s*\(\s*\(\)\s*=>\s*{[^}]*{\s*[^}]*auth[^}]*}[^}]*}\s*,/g;
  if (useMemoRegex.test(content)) {
    // Agregar verificación dentro del useMemo
    newContent = newContent.replace(
      useMemoRegex,
      (match) => {
        return match.replace(
          /{([^}]*auth[^}]*)}/,
          (destructMatch, props) => {
            const safeProps = props.split(',').map(prop => {
              const trimmedProp = prop.trim();
              if (trimmedProp.includes('auth') && !trimmedProp.includes('=')) {
                return `${trimmedProp} = {}`;
              }
              return trimmedProp;
            });
            return `{ ${safeProps.join(', ')} }`;
          }
        );
      }
    );
    hasChanges = true;
  }

  return { content: newContent, hasChanges };
}

function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Solo procesar archivos que contengan 'auth' y destructuring
    if (!content.includes('auth') || !content.includes('{')) {
      return false;
    }

    const result = fixDestructuring(content);
    
    if (result.hasChanges) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      console.log(`✅ Corregido: ${filePath.replace(process.cwd(), '.')}`);
      filesFixed++;
      return true;
    }
    return false;
  } catch (error) {
    console.log(`❌ Error procesando ${filePath}: ${error.message}`);
    return false;
  }
}

console.log('1️⃣ Buscando todos los archivos JavaScript/TypeScript...');
const allFiles = findAllJsFiles('./src');

console.log(`📁 Encontrados ${allFiles.length} archivos para revisar\n`);

console.log('2️⃣ Procesando archivos con destructuring de auth...');
allFiles.forEach(filePath => {
  processFile(filePath);
});

// CORRECCIÓN ESPECÍFICA ADICIONAL: Verificar archivos API conocidos
console.log('\n3️⃣ Correcciones específicas adicionales...');

const specificFixes = [
  'src/pages/api/sftp/list-directory.js',
  'src/pages/api/admin/system-secrets/test.js',
  'src/pages/api/admin/db-secrets/test-connection.js'
];

specificFixes.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // Corrección específica para SFTP que sabemos es problemático
    if (filePath.includes('sftp')) {
      newContent = newContent.replace(
        /auth = {}/g,
        'auth = {} || {}'
      );
      newContent = newContent.replace(
        /if \(auth && auth\.password\)/g,
        'if (auth && typeof auth === "object" && auth.password)'
      );
      newContent = newContent.replace(
        /} else if \(auth && auth\.privateKey\)/g,
        '} else if (auth && typeof auth === "object" && auth.privateKey)'
      );
    }

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Corrección específica: ${filePath.replace(process.cwd(), '.')}`);
      filesFixed++;
    }
  }
});

console.log(`\n🎉 Corrección exhaustiva completada!`);
console.log(`📊 Archivos corregidos: ${filesFixed}`);
console.log('\n🔧 CORRECCIONES APLICADAS:');
console.log('   ✓ Validación de req.body antes de destructuring');
console.log('   ✓ Valores por defecto en destructuring de auth');
console.log('   ✓ Verificaciones de tipo para objetos auth');
console.log('   ✓ Correcciones específicas en APIs conocidas');
console.log('\n✅ El build debería completarse sin errores de destructuring');