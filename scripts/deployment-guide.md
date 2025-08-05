# Guía de Resolución de Problemas de Despliegue

## Problema: "Module not found: Can't resolve '@/lib/db'"

Este error ocurre cuando Next.js no puede resolver los alias de rutas configurados en `jsconfig.json` o `tsconfig.json`.

### Diagnóstico Rápido

1. **Ejecutar script de verificación**:
   ```bash
   node scripts/verify-deployment.js
   ```

2. **Verificar archivos críticos**:
   ```bash
   ls -la jsconfig.json tsconfig.json next.config.js
   ls -la @/utils/db/db.js
   ```

### Soluciones por Orden de Prioridad

#### Solución 1: Reinstalar dependencias (Más común)
```bash
# Limpiar instalación
rm -rf node_modules package-lock.json

# Reinstalar
npm install

# Intentar build
npm run build
```

#### Solución 2: Verificar configuración Node.js
```bash
# Verificar versión de Node.js
node --version  # Debe ser >= 18.0.0

# Si es menor, actualizar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Solución 3: Forzar recreación de configuración
```bash
# Backup de archivos importantes
cp jsconfig.json jsconfig.json.bak
cp package.json package.json.bak

# Recrear jsconfig.json
cat > jsconfig.json << 'EOF'
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
EOF

# Reinstalar y probar
npm install
npm run build
```

#### Solución 4: Conversión a rutas relativas (Última opción)
```bash
# Ejecutar script de corrección automática
node scripts/fix-deployment-imports.js

# Probar build
npm run build
```

### Variables de Entorno Requeridas

Crear archivo `.env.local`:
```env
DATABASE_URL=postgresql://usuario:password@host:5432/sage
```

### Comandos de Build y Deploy

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Con PM2 (recomendado)
npm install -g pm2
pm2 start npm --name "sage-app" -- start
```

### Verificación Final

Después de aplicar cualquier solución:

1. **Verificar que no hay errores**:
   ```bash
   npm run build 2>&1 | grep -i error
   ```

2. **Probar importación manual**:
   ```bash
   node -e "
   try {
     require('./@/utils/db/db.js');
     console.log('✅ db.js se puede importar correctamente');
   } catch(e) {
     console.log('❌ Error:', e.message);
   }
   "
   ```

3. **Verificar servidor de desarrollo**:
   ```bash
   npm run dev
   # Abrir http://localhost:3000/api/admin/materialization-servers
   ```

### Contacto de Soporte

Si ninguna solución funciona:
1. Ejecutar `node scripts/verify-deployment.js`
2. Enviar la salida completa del script
3. Incluir versión de Node.js y sistema operativo
4. Incluir logs completos del error

## Notas Adicionales

- Este problema NO afecta el funcionamiento en Replit
- Solo ocurre en despliegues en otras máquinas
- Es un problema de configuración de rutas, no de código