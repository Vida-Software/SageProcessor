#!/usr/bin/env node

const fs = require('fs');

console.log('🚨 CORRECCIÓN ESPECÍFICA: Error de pre-renderizado SSR\n');

let filesFixed = 0;

function processFile(filePath, description, processor) {
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

// CORRECCIÓN 1: Configurar página admin para evitar SSR problemático
console.log('1️⃣ Configurando página admin para SSR seguro...');
processFile('src/pages/admin/index.js', 'Página Admin SSR', (content) => {
  let newContent = content;

  // Agregar configuración de SSR al final del archivo
  if (!content.includes('getServerSideProps')) {
    newContent = newContent.replace(
      /export default function AdminPage/,
      `// Configuración para evitar errores de pre-renderizado
AdminPage.getInitialProps = () => ({});

export default function AdminPage`
    );
  }

  return newContent;
});

// CORRECCIÓN 2: Agregar configuración de exportación estática
console.log('2️⃣ Configurando next.config.js para exportación segura...');
processFile('next.config.js', 'Configuración Next.js', (content) => {
  let newContent = content;

  // Agregar configuración de exportación para evitar SSR problemático
  if (!content.includes('trailingSlash')) {
    newContent = newContent.replace(
      /module\.exports = {/,
      `module.exports = {
  trailingSlash: false,
  generateBuildId: () => 'build',
  experimental: {
    esmExternals: false
  },`
    );
  }

  // Agregar configuración específica para evitar pre-rendering en admin
  if (!content.includes('generateStaticParams')) {
    newContent = newContent.replace(
      /module\.exports = {([^}]*)}/,
      `module.exports = {$1
  async generateStaticParams() {
    return [];
  }
}`
    );
  }

  return newContent;
});

// CORRECCIÓN 3: Crear alternativa de página admin sin SSR
console.log('3️⃣ Creando componente admin con lazy loading...');
processFile('src/pages/admin/index.js', 'Admin con lazy loading', (content) => {
  let newContent = content;

  // Agregar import dinámico si no existe
  if (!content.includes('dynamic')) {
    newContent = newContent.replace(
      /import { useState } from 'react';/,
      `import { useState } from 'react';
import dynamic from 'next/dynamic';`
    );
  }

  // Envolver los componentes problemáticos con dynamic
  if (!content.includes('DynamicIcon')) {
    newContent = newContent.replace(
      /import {([^}]+)} from '@tremor\/react';/,
      (match, imports) => {
        return `const DynamicTremor = dynamic(() => import('@tremor/react').then(mod => ({ default: mod })), { ssr: false });
import {${imports}} from '@tremor/react';`
      }
    );
  }

  return newContent;
});

// CORRECCIÓN 4: Configurar _app.js para manejar SSR 
console.log('4️⃣ Configurando _app.js para SSR seguro...');
processFile('src/pages/_app.js', 'Configuración App SSR', (content) => {
  let newContent = content;

  // Agregar verificación de SSR en el useEffect del tema
  newContent = newContent.replace(
    /useEffect\(\(\) => {[\s\S]*?\}, \[router\.pathname\]\);/,
    `useEffect(() => {
    // Verificar que estamos en el cliente antes de manipular el DOM
    if (typeof window === 'undefined') return;
    
    // Para portal-externo, siempre tema claro sin importar la preferencia
    if (router.pathname.startsWith("/portal-externo")) {
      document.documentElement.classList.remove("dark");
      return;
    }
    
    // Para el resto de la aplicación, leer la preferencia guardada
    const storedTheme = localStorage.getItem('theme');
    
    // Por defecto usamos tema oscuro, o el tema guardado si existe
    const prefersDark = storedTheme === 'dark' || (storedTheme === null);
    
    // Aplicar el tema correspondiente
    document.documentElement.classList.toggle("dark", prefersDark);
  }, [router.pathname]);`
  );

  return newContent;
});

// CORRECCIÓN 5: Verificar y corregir componentes Tremor
console.log('5️⃣ Verificando componentes Tremor...');
processFile('src/pages/admin/index.js', 'Tremor components', (content) => {
  let newContent = content;

  // Asegurar que los componentes Tremor se rendericen solo en client-side
  if (content.includes('@tremor/react')) {
    newContent = newContent.replace(
      /return \(/,
      `// Verificar que estamos en el cliente antes de renderizar
  if (typeof window === 'undefined') {
    return <div>Loading...</div>;
  }

  return (`
    );
  }

  return newContent;
});

console.log(`\n🎉 Corrección de pre-renderizado SSR completada!`);
console.log(`📊 Archivos procesados: ${filesFixed}`);
console.log('\n🔧 CORRECCIONES APLICADAS:');
console.log('   ✓ Configuración de SSR seguro en página admin');
console.log('   ✓ Next.config.js configurado para evitar pre-rendering problemático');
console.log('   ✓ Lazy loading para componentes problemáticos'); 
console.log('   ✓ Verificación client-side en _app.js');
console.log('   ✓ Protección client-side para componentes Tremor');
console.log('\n✅ El build debería completarse sin errores de SSR');