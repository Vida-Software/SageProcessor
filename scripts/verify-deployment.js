#!/usr/bin/env node
/**
 * Script para verificar configuración de despliegue
 * Ejecutar después de clonar el repositorio en otra máquina
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de despliegue...\n');

// Verificar archivos de configuración necesarios
const requiredFiles = [
  'jsconfig.json',
  'tsconfig.json', 
  'next.config.js',
  'package.json',
  '@/utils/db/db.js'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Existe`);
  } else {
    console.log(`❌ ${file} - NO EXISTE`);
    allFilesExist = false;
  }
});

// Verificar configuración de alias en jsconfig.json
if (fs.existsSync('jsconfig.json')) {
  try {
    const jsconfig = JSON.parse(fs.readFileSync('jsconfig.json', 'utf8'));
    const paths = jsconfig.compilerOptions?.paths;
    
    if (paths && paths['@/*']) {
      console.log(`✅ Alias @/* configurado: ${paths['@/*']}`);
    } else {
      console.log('❌ Alias @/* NO configurado en jsconfig.json');
      allFilesExist = false;
    }
  } catch (e) {
    console.log('❌ Error al leer jsconfig.json:', e.message);
    allFilesExist = false;
  }
}

// Verificar que @/utils/db/db.js existe y tiene exports
if (fs.existsSync('@/utils/db/db.js')) {
  try {
    const dbContent = fs.readFileSync('@/utils/db/db.js', 'utf8');
    if (dbContent.includes('export')) {
      console.log('✅ @/utils/db/db.js tiene exports');
    } else {
      console.log('❌ @/utils/db/db.js NO tiene exports');
      allFilesExist = false;
    }
  } catch (e) {
    console.log('❌ Error al leer @/utils/db/db.js:', e.message);
    allFilesExist = false;
  }
}

// Verificar variables de entorno
console.log('\n🔧 Verificando variables de entorno:');
const requiredEnvVars = ['DATABASE_URL'];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} - Configurada`);
  } else {
    console.log(`⚠️  ${envVar} - NO configurada`);
  }
});

console.log('\n📦 Información del sistema:');
console.log(`Node.js: ${process.version}`);
console.log(`Plataforma: ${process.platform}`);
console.log(`Directorio actual: ${process.cwd()}`);

if (allFilesExist) {
  console.log('\n✅ Configuración correcta para despliegue');
  console.log('\nPasos siguientes:');
  console.log('1. npm install');
  console.log('2. Configurar DATABASE_URL en .env');
  console.log('3. npm run build');
  console.log('4. npm start');
} else {
  console.log('\n❌ Faltan archivos o configuraciones');
  console.log('\nAcciones requeridas:');
  console.log('1. Verificar que todos los archivos fueron copiados');
  console.log('2. Verificar permisos de archivos');
  console.log('3. Ejecutar npm install --force si es necesario');
}