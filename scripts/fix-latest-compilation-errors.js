#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando corrección de errores de compilación más recientes...\n');

// Contador de archivos procesados
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
      console.log(`✅ Procesado: ${filePath}`);
      filesProcessed++;
      return true;
    }
    return false;
  } catch (error) {
    console.log(`❌ Error procesando ${filePath}: ${error.message}`);
    return false;
  }
}

// 1. Corregir ruta del yaml-parser en update.ts
console.log('1️⃣ Corrigiendo ruta de yaml-parser...');
processFile('src/pages/api/data-boxes/[id]/update.ts', (content) => {
  // Cambiar la ruta relativa incorrecta por la ruta correcta
  return content.replace(
    /from ['"]..\/..\/..\/..\/lib\/yaml-parser['"]/g,
    'from \'@/lib/yaml-parser\''
  );
});

// 2. Corregir importación de next-auth en casillas_fix.js  
console.log('2️⃣ Corrigiendo importaciones de next-auth...');
processFile('src/pages/api/portales/[uuid]/casillas_fix.js', (content) => {
  let newContent = content;
  
  // Reemplazar next-auth/next por next-auth
  newContent = newContent.replace(
    /from ['"]next-auth\/next['"]/g,
    'from \'next-auth\''
  );
  
  // Corregir ruta del archivo nextauth
  newContent = newContent.replace(
    /from ['"]..\/..\/auth\/\[\.\.\.nextauth\]['"]/g,
    'from \'../auth/[...nextauth]\''
  );
  
  return newContent;
});

// 3. Crear archivo yaml-parser en src/lib/ si no existe
console.log('3️⃣ Verificando yaml-parser en src/lib/...');
const srcLibDir = 'src/lib';
if (!fs.existsSync(srcLibDir)) {
  fs.mkdirSync(srcLibDir, { recursive: true });
  console.log(`📁 Creado directorio: ${srcLibDir}`);
}

const srcYamlParserPath = 'src/lib/yaml-parser.js';
if (!fs.existsSync(srcYamlParserPath)) {
  const yamlParserContent = `// YAML parser utilities for SAGE configuration files
import yaml from 'yaml';

export function parseYaml(yamlString) {
  try {
    return yaml.parse(yamlString);
  } catch (error) {
    throw new Error(\`Error parsing YAML: \${error.message}\`);
  }
}

export function stringifyYaml(data) {
  try {
    return yaml.stringify(data, {
      indent: 2,
      lineWidth: -1,
      minContentWidth: 0,
      nullStr: 'null'
    });
  } catch (error) {
    throw new Error(\`Error stringifying YAML: \${error.message}\`);
  }
}

export function validateSageYaml(yamlData) {
  if (!yamlData.sage_yaml) {
    throw new Error('Missing sage_yaml section');
  }
  
  if (!yamlData.sage_yaml.name) {
    throw new Error('Missing name in sage_yaml');
  }
  
  if (!yamlData.sage_yaml.description) {
    throw new Error('Missing description in sage_yaml');
  }
  
  return true;
}

export function extractFieldsFromYaml(yamlData) {
  const fields = [];
  
  if (yamlData.sage_yaml && yamlData.sage_yaml.fields) {
    yamlData.sage_yaml.fields.forEach(field => {
      fields.push({
        name: field.name,
        type: field.type || 'string',
        required: field.required || false,
        description: field.description || ''
      });
    });
  }
  
  return fields;
}`;

  fs.writeFileSync(srcYamlParserPath, yamlParserContent, 'utf8');
  console.log(`✅ Creado: ${srcYamlParserPath}`);
  filesProcessed++;
}

// 4. Verificar que ConfirmDialog existe
console.log('4️⃣ Verificando ConfirmDialog...');
const confirmDialogPath = 'src/components/ConfirmDialog.js';
if (fs.existsSync(confirmDialogPath)) {
  console.log(`✅ ConfirmDialog ya existe: ${confirmDialogPath}`);
} else {
  console.log(`⚠️  ConfirmDialog no encontrado en: ${confirmDialogPath}`);
}

// 5. Verificar que NextAuth existe
console.log('5️⃣ Verificando configuración NextAuth...');
const nextAuthPath = 'src/pages/api/auth/[...nextauth].js';
if (fs.existsSync(nextAuthPath)) {
  console.log(`✅ NextAuth ya existe: ${nextAuthPath}`);
} else {
  console.log(`⚠️  NextAuth no encontrado en: ${nextAuthPath}`);
}

// 6. Agregar dependencia yaml si no existe
console.log('6️⃣ Verificando dependencia yaml en package.json...');
try {
  const packageJsonPath = 'package.json';
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.dependencies.yaml) {
      packageJson.dependencies.yaml = '^2.3.4';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      console.log('✅ Agregada dependencia yaml al package.json');
      filesProcessed++;
    } else {
      console.log('✅ Dependencia yaml ya existe');
    }
  }
} catch (error) {
  console.log(`❌ Error verificando package.json: ${error.message}`);
}

console.log(`\n🎉 Proceso completado!`);
console.log(`📊 Archivos procesados: ${filesProcessed}`);
console.log('\n📋 Próximos pasos para el despliegue:');
console.log('   1. npm install  (para instalar dependencia yaml)');
console.log('   2. npm run build  (para verificar compilación)');
console.log('   3. npm run start  (para iniciar en producción)');