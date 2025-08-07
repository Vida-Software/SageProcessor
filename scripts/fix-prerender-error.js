#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Corrigiendo error de pre-renderizado (destructuring undefined)...\n');

let filesProcessed = 0;

function processFile(filePath, processor) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = processor(content);
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Corregido: ${filePath}`);
      filesProcessed++;
      return true;
    }
    return false;
  } catch (error) {
    console.log(`❌ Error procesando ${filePath}: ${error.message}`);
    return false;
  }
}

// Corregir destructuring inseguro en API SFTP
console.log('1️⃣ Corrigiendo destructuring de auth en SFTP API...');
processFile('src/pages/api/sftp/list-directory.js', (content) => {
  let newContent = content;

  // Agregar verificación de req.body
  if (!content.includes('if (!req.body)')) {
    newContent = newContent.replace(
      /try \{\s*const \{ host, port, username, auth, path: sftpPath \} = req\.body;/,
      `try {
    // Verificar que req.body existe para evitar errores de destructuring
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { 
      host, 
      port = 22, 
      username, 
      auth = {}, 
      path: sftpPath = '~' 
    } = req.body;`
    );
  }

  // Agregar verificaciones de auth
  newContent = newContent.replace(
    /if \(auth\.password\)/g,
    'if (auth && auth.password)'
  );

  newContent = newContent.replace(
    /} else if \(auth\.privateKey\)/g,
    '} else if (auth && auth.privateKey)'
  );

  return newContent;
});

// Buscar otros archivos API que puedan tener problemas similares
console.log('2️⃣ Buscando otros archivos con destructuring inseguro...');

const apiFiles = [
  'src/pages/api/admin/system-secrets/test.js',
  'src/pages/api/admin/db-secrets/test-connection.js'
];

apiFiles.forEach(filePath => {
  processFile(filePath, (content) => {
    let newContent = content;

    // Verificar destructuring de req.body sin validación previa
    if (content.includes('const {') && content.includes('} = req.body') && !content.includes('if (!req.body)')) {
      // Agregar verificación de req.body antes del destructuring
      const destructureMatch = content.match(/(\s+)const \{([^}]+)\} = req\.body;/);
      
      if (destructureMatch) {
        const indent = destructureMatch[1];
        const destructureProps = destructureMatch[2];
        
        const replacement = `${indent}// Verificar que req.body existe para evitar errores de destructuring
${indent}if (!req.body) {
${indent}  return res.status(400).json({ error: 'Request body is required' });
${indent}}

${indent}const {${destructureProps}} = req.body;`;

        newContent = newContent.replace(destructureMatch[0], replacement);
      }
    }

    return newContent;
  });
});

console.log(`\n🎉 Corrección de pre-renderizado completada!`);
console.log(`📊 Archivos procesados: ${filesProcessed}`);
console.log('\n📋 Este error impedía el build exitoso de Next.js');
console.log('✅ Ahora el build debería completarse sin errores de pre-renderizado');
console.log('\n💡 El problema era destructuring de propiedades undefined durante SSR');