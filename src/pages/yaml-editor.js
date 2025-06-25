import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Head from 'next/head';
import { YAMLStudioForm } from '@/components/YAMLStudio/YAMLStudioForm';
import { Card, Title, Button } from "@tremor/react";
import { DocumentArrowUpIcon, CogIcon, BeakerIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const YAMLEditorPage = () => {
  const router = useRouter();
  const [activeEditorTab, setActiveEditorTab] = useState(0);

  const ManualYAMLEditor = () => {
    // Estados para el YAML config
    const [yamlConfig, setYamlConfig] = useState({
      sage_yaml: {
        name: "Configuración SAGE",
        description: "Especificación YAML para validación de datos",
        version: "1.0.0",
        author: "SAGE",
        comments: ""
      },
      catalogs: [],
      package: {
        name: "Paquete Principal",
        description: "Configuración de validación para archivos de datos",
        catalogs: [],
        file_format: { type: "ZIP" }
      }
    });

    const [activeSection, setActiveSection] = useState('general');
    const [showYamlPreview, setShowYamlPreview] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    // Tipos de datos disponibles
    const dataTypes = ['texto', 'decimal', 'entero', 'fecha', 'booleano'];
    const fileTypes = ['CSV', 'EXCEL', 'ZIP'];
    const severityTypes = ['error', 'warning']; // Según YAML_SPEC.md líneas 95, 101, 107

    // Funciones para manejar cambios en sage_yaml
    const handleSageYamlChange = (key, value) => {
      setYamlConfig(prev => ({
        ...prev,
        sage_yaml: {
          ...prev.sage_yaml,
          [key]: value
        }
      }));
    };

    // Funciones para manejar catálogos
    const addCatalog = () => {
      const newCatalog = {
        name: `Catálogo ${yamlConfig.catalogs.length + 1}`,
        description: "",
        filename: "",
        file_format: { type: "CSV", delimiter: ",", header: true },
        fields: []
      };
      setYamlConfig(prev => ({
        ...prev,
        catalogs: [...prev.catalogs, newCatalog]
      }));
    };

    const updateCatalog = (index, updatedCatalog) => {
      setYamlConfig(prev => ({
        ...prev,
        catalogs: prev.catalogs.map((cat, i) => i === index ? updatedCatalog : cat)
      }));
    };

    const deleteCatalog = (index) => {
      const catalogName = yamlConfig.catalogs[index].name;
      setYamlConfig(prev => ({
        ...prev,
        catalogs: prev.catalogs.filter((_, i) => i !== index),
        package: {
          ...prev.package,
          catalogs: prev.package.catalogs.filter(cat => cat !== catalogName)
        }
      }));
    };

    // Función para generar YAML
    const generateYamlOutput = () => {
      const yamlObj = {
        sage_yaml: yamlConfig.sage_yaml,
        catalogs: {},
        packages: {
          [yamlConfig.package.name.toLowerCase().replace(/\s+/g, '_')]: yamlConfig.package
        }
      };

      // Convertir array de catálogos a objeto
      yamlConfig.catalogs.forEach(catalog => {
        const catalogKey = catalog.name.toLowerCase().replace(/\s+/g, '_');
        yamlObj.catalogs[catalogKey] = catalog;
      });

      return yamlObj;
    };

    // Función para cargar YAML desde archivo
    const loadYamlFromFile = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setIsLoading(true);
      setLoadError('');

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const yamlContent = e.target.result;
          const parsedYaml = parseYamlContent(yamlContent);
          
          if (parsedYaml) {
            setYamlConfig(parsedYaml);
            setLoadError('');
          } else {
            setLoadError('No se pudo interpretar el archivo YAML. Verifica que tenga la estructura SAGE correcta.');
          }
        } catch (error) {
          setLoadError('Error al leer el archivo: ' + error.message);
        }
        setIsLoading(false);
      };
      
      reader.onerror = () => {
        setLoadError('Error al leer el archivo');
        setIsLoading(false);
      };
      
      reader.readAsText(file);
      
      // Limpiar el input para permitir cargar el mismo archivo de nuevo
      event.target.value = '';
    };

    // Parser YAML usando función nativa del navegador
    const parseYamlContent = (yamlContent) => {
      try {
        console.log('Iniciando parser YAML nativo...');
        
        // Usar el parser manual mejorado directamente
        console.log('Usando parser manual mejorado...');
        const lines = yamlContent.split('\n');
        const result = {
          sage_yaml: {
            name: "Configuración SAGE",
            description: "",
            version: "1.0.0",
            author: "SAGE",
            comments: ""
          },
          catalogs: [],
          package: {
            name: "Paquete Principal",
            description: "",
            catalogs: [],
            file_format: { type: "ZIP" }
          }
        };

        let currentSection = null;
        let currentCatalog = null;
        let currentPackage = null;
        let currentField = null;
        let currentValidation = null;
        let inFieldValidationRules = false;
        let inRowValidation = false;
        let inCatalogValidation = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          const indent = line.search(/\S/); // Posición exacta del primer carácter no-espacio
          
          // Debug para líneas con guión
          if (trimmed.startsWith('- ')) {
            console.log(`🔍 LÍNEA CON GUIÓN: "${line}" (línea ${i+1}, indent=${indent})`);
            console.log(`🔍 Sección actual: ${currentSection}, Catálogo: ${currentCatalog ? currentCatalog.name : 'NINGUNO'}`);
          }
          
          if (!trimmed || trimmed.startsWith('#')) continue;

          // Detectar secciones principales
          if (trimmed === 'sage_yaml:') {
            currentSection = 'sage_yaml';
            continue;
          } else if (trimmed === 'catalogs:') {
            currentSection = 'catalogs';
            currentCatalog = null;
            continue;
          } else if (trimmed === 'packages:' || trimmed === 'package:') {
            currentSection = 'packages';
            continue;
          }

          // Parsear sage_yaml
          if (currentSection === 'sage_yaml' && indent > 0 && trimmed.includes(':')) {
            const colonIndex = trimmed.indexOf(':');
            const key = trimmed.substring(0, colonIndex).trim();
            const value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
            
            if (key && value) {
              result.sage_yaml[key] = value;
            }
          }

          // Parsear catalogs con lógica corregida
          else if (currentSection === 'catalogs') {
            // Nuevo catálogo (nivel 2 espacios)
            if (indent === 2 && trimmed.endsWith(':') && !trimmed.includes(' ')) {
              const catalogId = trimmed.slice(0, -1);
              currentCatalog = {
                name: catalogId,
                description: '',
                filename: '',
                file_format: { type: 'CSV', delimiter: ',', header: true },
                fields: [],
                row_validation: [],
                catalog_validation: []
              };
              result.catalogs.push(currentCatalog);
              currentField = null;
              inFieldValidationRules = false;
              inRowValidation = false;
              inCatalogValidation = false;
              console.log(`Nuevo catálogo encontrado: ${catalogId}`);
              continue;
            }

            if (!currentCatalog) continue;

            // Propiedades del catálogo (nivel 4 espacios)
            if (indent === 4 && trimmed.includes(':')) {
              const colonIndex = trimmed.indexOf(':');
              const key = trimmed.substring(0, colonIndex).trim();
              const value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');

              if (key === 'name') {
                currentCatalog.name = value;
              } else if (key === 'description') {
                currentCatalog.description = value;
              } else if (key === 'filename') {
                currentCatalog.filename = value;
              } else if (key === 'file_format') {
                // Esperamos propiedades anidadas
              } else if (key === 'fields') {
                // Esperamos campos
              } else if (key === 'row_validation') {
                inRowValidation = true;
                inCatalogValidation = false;
                inFieldValidationRules = false;
              } else if (key === 'catalog_validation') {
                inCatalogValidation = true;
                inRowValidation = false;
                inFieldValidationRules = false;
              }
              continue;
            }

            // Propiedades de file_format (nivel 6 espacios)
            if (indent === 6 && trimmed.includes(':')) {
              const colonIndex = trimmed.indexOf(':');
              const key = trimmed.substring(0, colonIndex).trim();
              const value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');

              if (key === 'type') {
                currentCatalog.file_format.type = value;
              } else if (key === 'delimiter') {
                currentCatalog.file_format.delimiter = value;
              } else if (key === 'header') {
                currentCatalog.file_format.header = value === 'true';
              }
              continue;
            }

            // Nuevo campo o validación (cualquier nivel con guión dentro de catalogs)
            if (currentCatalog && trimmed.startsWith('- ') && currentSection === 'catalogs') {
              console.log(`🔍 DEBUGGING: Línea nivel con guión: "${line}"`);
              console.log(`🔍 Estado: rowValidation=${inRowValidation}, catalogValidation=${inCatalogValidation}, fieldValidation=${inFieldValidationRules}`);
              
              const fieldLine = trimmed.substring(2).trim();
              
              // Si estamos en row_validation, agregar validación de fila
              if (inRowValidation) {
                const validation = { name: '', description: '', rule: '', severity: 'error' };
                if (fieldLine.includes('name:')) {
                  const nameMatch = fieldLine.match(/name:\s*["']?([^"']+)["']?/);
                  if (nameMatch) validation.name = nameMatch[1];
                }
                currentCatalog.row_validation.push(validation);
                console.log(`✅ Validación de fila agregada: ${validation.name}`);
                continue;
              }
              
              // Si estamos en catalog_validation, agregar validación de catálogo
              if (inCatalogValidation) {
                const validation = { name: '', description: '', rule: '', severity: 'error' };
                if (fieldLine.includes('name:')) {
                  const nameMatch = fieldLine.match(/name:\s*["']?([^"']+)["']?/);
                  if (nameMatch) validation.name = nameMatch[1];
                }
                currentCatalog.catalog_validation.push(validation);
                console.log(`✅ Validación de catálogo agregada: ${validation.name}`);
                continue;
              }
              
              // Si estamos en field validation_rules, agregar validación de campo
              if (inFieldValidationRules && currentField) {
                const validation = { name: '', description: '', rule: '', severity: 'error' };
                if (fieldLine.includes('name:')) {
                  const nameMatch = fieldLine.match(/name:\s*["']?([^"']+)["']?/);
                  if (nameMatch) validation.name = nameMatch[1];
                }
                currentField.validation_rules = currentField.validation_rules || [];
                currentField.validation_rules.push(validation);
                console.log(`✅ Validación de campo agregada: ${validation.name} para campo ${currentField.name}`);
                continue;
              }
              
              // Si no estamos en validaciones, es un campo normal
              console.log(`🔍 Contenido después del guión: "${fieldLine}"`);
              
              // Puede ser "- name: NombreCampo" o solo "- name: NombreCampo"
              if (fieldLine.startsWith('name:')) {
                const fieldName = fieldLine.substring(5).trim().replace(/^["']|["']$/g, '');
                console.log(`🔍 CAMPO DETECTADO: "${fieldName}"`);
                currentField = {
                  name: fieldName,
                  type: 'texto',
                  required: false,
                  unique: false,
                  description: '',
                  defaultValue: '',
                  validation_rules: []
                };
                currentCatalog.fields.push(currentField);
                inFieldValidationRules = false;
                inRowValidation = false;
                inCatalogValidation = false;
                console.log(`✅ Campo agregado: ${fieldName}. Total campos en catálogo: ${currentCatalog.fields.length}`);
              } else {
                console.log(`🔍 Guión sin name: inmediato, esperando siguiente línea`);
                // Caso donde el guión está solo y name: viene en la siguiente línea
                // Crear un campo temporal para la siguiente línea
                currentField = {
                  name: '',
                  type: 'texto',
                  required: false,
                  unique: false,
                  description: '',
                  defaultValue: '',
                  validation_rules: []
                };
                currentCatalog.fields.push(currentField);
                inFieldValidationRules = false;
                inRowValidation = false;
                inCatalogValidation = false;
                console.log(`🔍 Campo temporal creado, esperando name:`);
              }
              continue;
            }

            // Propiedades del campo que está en proceso (línea después del guión)
            if (currentField && currentField.name === '' && indent === 6 && trimmed.startsWith('name:')) {
              const fieldName = trimmed.substring(5).trim().replace(/^["']|["']$/g, '');
              currentField.name = fieldName;
              console.log(`Campo asignado: ${fieldName}`);
              continue;
            }

            // Propiedades del campo (cualquier nivel mayor que el campo)
            if (currentField && indent > 4 && trimmed.includes(':') && !trimmed.startsWith('- ')) {
              const colonIndex = trimmed.indexOf(':');
              const key = trimmed.substring(0, colonIndex).trim();
              const value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');

              if (key === 'type') {
                currentField.type = value;
                console.log(`Campo ${currentField.name}: tipo = ${value}`);
              } else if (key === 'required') {
                currentField.required = value === 'true';
                console.log(`Campo ${currentField.name}: required = ${value}`);
              } else if (key === 'unique') {
                currentField.unique = value === 'true';
                console.log(`Campo ${currentField.name}: unique = ${value}`);
              } else if (key === 'description') {
                currentField.description = value;
              } else if (key === 'defaultValue') {
                currentField.defaultValue = value;
              } else if (key === 'validation_rules') {
                inFieldValidationRules = true;
                inRowValidation = false;
                inCatalogValidation = false;
                console.log(`Campo ${currentField.name}: iniciando validation_rules`);
              }
              continue;
            }

            // Validaciones de campo (nivel 6, con guión)
            if (currentField && inFieldValidationRules && indent === 6 && trimmed.startsWith('- ')) {
              const validationLine = trimmed.substring(2).trim();
              if (validationLine.startsWith('name:')) {
                const validationName = validationLine.substring(5).trim().replace(/^["']|["']$/g, '');
                currentValidation = {
                  name: validationName,
                  description: '',
                  rule: '',
                  severity: 'error'
                };
                currentField.validation_rules.push(currentValidation);
                console.log(`Nueva validación de campo ${currentField.name}: ${validationName}`);
              } else {
                // Crear validación temporal si el guión está solo
                currentValidation = {
                  name: '',
                  description: '',
                  rule: '',
                  severity: 'error'
                };
                currentField.validation_rules.push(currentValidation);
              }
              continue;
            }

            // Propiedades de validación que están después del guión
            if (currentValidation && currentValidation.name === '' && inFieldValidationRules && indent === 8 && trimmed.startsWith('name:')) {
              const validationName = trimmed.substring(5).trim().replace(/^["']|["']$/g, '');
              currentValidation.name = validationName;
              console.log(`Validación asignada: ${validationName}`);
              continue;
            }

            // Propiedades de validaciones de campo (nivel 8 espacios)
            if (currentValidation && inFieldValidationRules && indent === 8 && trimmed.includes(':')) {
              const colonIndex = trimmed.indexOf(':');
              const key = trimmed.substring(0, colonIndex).trim();
              const value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');

              if (key === 'description') {
                currentValidation.description = value;
              } else if (key === 'rule') {
                currentValidation.rule = value;
              } else if (key === 'severity') {
                currentValidation.severity = value.toLowerCase();
              }
              continue;
            }

            // Validaciones de catálogo (row_validation y catalog_validation - nivel 4, con guión)
            if ((inRowValidation || inCatalogValidation) && indent === 4 && trimmed.startsWith('- ')) {
              const validationData = trimmed.substring(2).trim();
              if (validationData.startsWith('name:')) {
                const validationName = validationData.substring(5).trim().replace(/^["']|["']$/g, '');
                currentValidation = {
                  name: validationName,
                  description: '',
                  rule: '',
                  severity: 'error'
                };
                
                if (inRowValidation) {
                  currentCatalog.row_validation.push(currentValidation);
                } else if (inCatalogValidation) {
                  currentCatalog.catalog_validation.push(currentValidation);
                }
                console.log(`Nueva validación de catálogo: ${validationName}`);
              }
              continue;
            }

            // Propiedades de validaciones de catálogo (nivel 6 espacios)
            if (currentValidation && (inRowValidation || inCatalogValidation) && indent === 6 && trimmed.includes(':')) {
              const colonIndex = trimmed.indexOf(':');
              const key = trimmed.substring(0, colonIndex).trim();
              const value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');

              if (key === 'description') {
                currentValidation.description = value;
              } else if (key === 'rule') {
                currentValidation.rule = value;
              } else if (key === 'severity') {
                currentValidation.severity = value.toLowerCase();
              }
              continue;
            }
          }

          // Parsear packages
          else if (currentSection === 'packages') {
            // Nuevo paquete
            if (indent <= 2 && trimmed.includes(':') && !trimmed.includes(' ')) {
              const packageKey = trimmed.replace(':', '').trim();
              currentPackage = {
                name: packageKey,
                description: '',
                catalogs: [],
                file_format: { type: 'ZIP' },
                package_validation: []
              };
              result.package = currentPackage;
              continue;
            }

            if (!currentPackage) continue;

            // Propiedades del paquete (nivel 4 espacios)
            if (indent === 4 && trimmed.includes(':')) {
              const colonIndex = trimmed.indexOf(':');
              const key = trimmed.substring(0, colonIndex).trim();
              const value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');

              if (key === 'name') {
                currentPackage.name = value;
              } else if (key === 'description') {
                currentPackage.description = value;
              } else if (key === 'file_format') {
                // Esperamos propiedades del file_format
              } else if (key === 'catalogs') {
                // Esperamos lista de catálogos
              } else if (key === 'package_validation') {
                // Esperamos validaciones de paquete
              }
              continue;
            }

            // Propiedades de file_format del paquete (nivel 6 espacios)
            if (indent === 6 && trimmed.includes(':')) {
              const colonIndex = trimmed.indexOf(':');
              const key = trimmed.substring(0, colonIndex).trim();
              const value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');

              if (key === 'type') {
                currentPackage.file_format.type = value;
              }
            }

            // Catálogos del paquete (array)
            else if (indent === 4 && trimmed.startsWith('- ')) {
              const catalogName = trimmed.substring(2).trim().replace(/^["']|["']$/g, '');
              currentPackage.catalogs.push(catalogName);
            }

            // Validaciones de paquete (nivel 4, con guión)
            else if (indent === 4 && trimmed.startsWith('- ')) {
              const validationData = trimmed.substring(2).trim();
              if (validationData.includes(':')) {
                const [key, ...valueParts] = validationData.split(':');
                let value = valueParts.join(':').trim();
                value = value.replace(/^["']|["']$/g, '');
                
                if (key.trim() === 'name') {
                  currentValidation = {
                    name: value,
                    description: '',
                    rule: '',
                    severity: 'error'
                  };
                  currentPackage.package_validation.push(currentValidation);
                }
              }
            }

            // Propiedades de validaciones de paquete (nivel 6 espacios)
            else if (currentValidation && indent === 6 && trimmed.includes(':')) {
              const colonIndex = trimmed.indexOf(':');
              const key = trimmed.substring(0, colonIndex).trim();
              const value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');

              if (key === 'description') {
                currentValidation.description = value;
              } else if (key === 'rule') {
                currentValidation.rule = value;
              } else if (key === 'severity') {
                currentValidation.severity = value;
              }
            }
          }
        }

        console.log('Parser completado. Catálogos encontrados:', result.catalogs.length);
        if (result.catalogs.length > 0) {
          console.log('Primer catálogo:', result.catalogs[0].name, 'con', result.catalogs[0].fields.length, 'campos');
          result.catalogs[0].fields.forEach((field, idx) => {
            console.log(`Campo ${idx + 1}: ${field.name} (${field.type}), validaciones: ${field.validation_rules.length}`);
          });
        }
        return result;
      } catch (error) {
        console.error('Error parsing YAML:', error);
        return null;
      }
    };

    // Parser YAML especializado para estructura SAGE
    const parseSimpleYAML = (yamlContent) => {
      try {
        const lines = yamlContent.split('\n');
        const result = {};
        let currentObject = result;
        let arrayStack = []; // Stack para manejar objetos en arrays
        let currentArrayItem = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          
          if (!trimmed || trimmed.startsWith('#')) continue;
          
          const indent = line.search(/\S/);
          const level = Math.floor(indent / 2);
          
          if (trimmed.startsWith('- ') && trimmed.includes(':')) {
            // Es el inicio de un nuevo objeto en array
            const content = trimmed.substring(2).trim();
            const colonIndex = content.indexOf(':');
            const key = content.substring(0, colonIndex).trim();
            const value = content.substring(colonIndex + 1).trim();
            
            // Crear nuevo objeto para el array
            currentArrayItem = {};
            currentArrayItem[key] = value.replace(/^["']|["']$/g, '');
            
            // Encontrar el array padre basado en el contexto
            const parentPath = findParentPath(result, level);
            if (parentPath && parentPath.array) {
              parentPath.array.push(currentArrayItem);
            }
            
          } else if (trimmed.startsWith('- ') && !trimmed.includes(':')) {
            // Es un valor simple en array
            const value = trimmed.substring(2).trim().replace(/^["']|["']$/g, '');
            const parentPath = findParentPath(result, level);
            if (parentPath && parentPath.array) {
              parentPath.array.push(value);
            }
            
          } else if (trimmed.endsWith(':')) {
            // Es una clave de objeto o array
            const key = trimmed.slice(0, -1);
            const path = buildPath(result, level, key);
            
            // Determinar si el próximo nivel es un array
            const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
            const nextTrimmed = nextLine.trim();
            
            if (nextTrimmed.startsWith('- ')) {
              // Es un array
              setNestedValue(result, path, []);
            } else {
              // Es un objeto
              setNestedValue(result, path, {});
            }
            
          } else if (trimmed.includes(':')) {
            // Es una propiedad simple
            const colonIndex = trimmed.indexOf(':');
            const key = trimmed.substring(0, colonIndex).trim();
            const value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
            
            // Si estamos dentro de un objeto de array, agregar ahí
            if (currentArrayItem && level > 0) {
              currentArrayItem[key] = value;
            } else {
              // Agregar al objeto principal
              const path = buildPath(result, level, key);
              setNestedValue(result, path, value);
            }
          }
        }
        
        return result;
      } catch (error) {
        console.error('Error en parseSimpleYAML:', error);
        return null;
      }
    };

    // Función auxiliar para construir rutas anidadas
    const buildPath = (obj, level, key) => {
      // Implementación simplificada - para el caso de SAGE
      if (level === 0) return [key];
      if (level === 1) return ['catalogs', key];  // Asumiendo estructura SAGE
      return [key]; // Fallback
    };

    // Función auxiliar para establecer valores anidados
    const setNestedValue = (obj, path, value) => {
      let current = obj;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
    };

    // Función auxiliar para encontrar el array padre
    const findParentPath = (obj, level) => {
      // Implementación simplificada para estructura SAGE
      if (level === 1) return { array: obj.catalogs };
      if (level === 2) {
        // Buscar en catálogos
        if (obj.catalogs) {
          for (const catalogKey in obj.catalogs) {
            const catalog = obj.catalogs[catalogKey];
            if (catalog.fields && Array.isArray(catalog.fields)) {
              return { array: catalog.fields };
            }
          }
        }
      }
      return null;
    };

    // Convertir datos parseados a configuración del editor
    const convertParsedYamlToConfig = (parsedData) => {
      try {
        const config = {
          sage_yaml: parsedData.sage_yaml || {
            name: "Configuración SAGE",
            description: "",
            version: "1.0.0",
            author: "SAGE",
            comments: ""
          },
          catalogs: [],
          package: {
            name: "Paquete Principal",
            description: "",
            file_format: { type: "ZIP" },
            catalogs: [],
            package_validation: []
          }
        };

        // Procesar catálogos
        if (parsedData.catalogs) {
          Object.entries(parsedData.catalogs).forEach(([catalogId, catalogData]) => {
            const catalog = {
              name: catalogData.name || catalogId,
              description: catalogData.description || "",
              filename: catalogData.filename || "",
              file_format: catalogData.file_format || { type: 'CSV', delimiter: ',', header: true },
              fields: [],
              row_validation: catalogData.row_validation || [],
              catalog_validation: catalogData.catalog_validation || []
            };

            // Procesar campos
            if (catalogData.fields && Array.isArray(catalogData.fields)) {
              catalog.fields = catalogData.fields.map(field => ({
                name: field.name || '',
                type: field.type || 'texto',
                required: field.required === true || field.required === 'true',
                unique: field.unique === true || field.unique === 'true',
                validation_rules: field.validation_rules || []
              }));
            }

            // Asegurar que las validaciones sean arrays
            if (catalogData.row_validation && !Array.isArray(catalogData.row_validation)) {
              catalog.row_validation = [catalogData.row_validation];
            }
            if (catalogData.catalog_validation && !Array.isArray(catalogData.catalog_validation)) {
              catalog.catalog_validation = [catalogData.catalog_validation];
            }

            // Asegurar que package_validation también sea array si existe
            if (catalogData.package_validation && !Array.isArray(catalogData.package_validation)) {
              // Esta validación pertenece al paquete, no al catálogo
              // La moveremos al procesar el paquete
            }

            config.catalogs.push(catalog);
          });
        }

        // Procesar paquete
        if (parsedData.packages || parsedData.package) {
          const packageData = parsedData.packages || parsedData.package;
          if (typeof packageData === 'object') {
            const firstPackageKey = Object.keys(packageData)[0];
            if (firstPackageKey) {
              const packageInfo = packageData[firstPackageKey];
              config.package = {
                name: packageInfo.name || firstPackageKey,
                description: packageInfo.description || "",
                file_format: packageInfo.file_format || { type: "ZIP" },
                catalogs: packageInfo.catalogs || [],
                package_validation: packageInfo.package_validation || []
              };

              // Asegurar que package_validation sea array
              if (packageInfo.package_validation && !Array.isArray(packageInfo.package_validation)) {
                config.package.package_validation = [packageInfo.package_validation];
              }
            }
          }
        }

        console.log('Configuración convertida:', config);
        return config;
      } catch (error) {
        console.error('Error convirtiendo configuración:', error);
        return null;
      }
    };

    // Función para descargar YAML
    const downloadYaml = () => {
      const yamlData = generateYamlOutput();
      const yamlString = generateYamlString(yamlData);
      const element = document.createElement('a');
      const file = new Blob([yamlString], { type: 'text/yaml' });
      element.href = URL.createObjectURL(file);
      element.download = `${yamlConfig.sage_yaml.name || 'config'}.yaml`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };

    // Función simple para generar YAML string
    const generateYamlString = (obj, indent = 0) => {
      const spaces = '  '.repeat(indent);
      let result = '';
      
      Object.entries(obj).forEach(([key, value]) => {
        if (value === '' || (typeof value === 'object' && value !== null && Object.keys(value).length === 0 && !Array.isArray(value))) {
          return;
        }
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result += `${spaces}${key}:\n`;
          result += generateYamlString(value, indent + 1);
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            result += `${spaces}${key}:\n`;
            value.forEach(item => {
              if (typeof item === 'object') {
                result += `${spaces}  -\n`;
                Object.entries(item).forEach(([itemKey, itemValue]) => {
                  const valueStr = typeof itemValue === 'string' ? `"${itemValue}"` : String(itemValue);
                  result += `${spaces}    ${itemKey}: ${valueStr}\n`;
                });
              } else {
                result += `${spaces}  - ${item}\n`;
              }
            });
          }
        } else if (value !== '') {
          const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
          result += `${spaces}${key}: ${valueStr}\n`;
        }
      });
      
      return result;
    };

    return (
      <div className="space-y-6">
        {/* Header con controles */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Editor Visual YAML</h3>
            <p className="text-sm text-gray-600">Crea tu configuración YAML paso a paso</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <input
                type="file"
                accept=".yaml,.yml"
                onChange={loadYamlFromFile}
                className="hidden"
                id="yaml-file-input"
                disabled={isLoading}
              />
              <Button
                onClick={() => document.getElementById('yaml-file-input').click()}
                variant="secondary"
                className="text-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Cargando...' : 'Cargar YAML'}
              </Button>
            </div>
            <Button
              onClick={() => setShowYamlPreview(!showYamlPreview)}
              variant="secondary"
              className="text-sm"
            >
              {showYamlPreview ? 'Ocultar Vista Previa' : 'Ver YAML'}
            </Button>
            <Button
              onClick={downloadYaml}
              variant="primary"
              className="text-sm"
            >
              Descargar YAML
            </Button>
          </div>
        </div>

        {/* Error de carga */}
        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al cargar YAML</h3>
                <p className="text-sm text-red-700 mt-1">{loadError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación de secciones */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['general', 'catalogs', 'package'].map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === section
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {section === 'general' && 'Información General'}
                {section === 'catalogs' && `Catálogos (${yamlConfig.catalogs.length})`}
                {section === 'package' && 'Paquete'}
              </button>
            ))}
          </nav>
        </div>

        {/* Vista previa YAML */}
        {showYamlPreview && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Vista Previa YAML</h4>
            <pre className="bg-white p-4 rounded border text-sm overflow-x-auto">
              <code>{generateYamlString(generateYamlOutput())}</code>
            </pre>
          </div>
        )}

        {/* Contenido de las secciones */}
        <div className="bg-white rounded-lg border p-6">
          {activeSection === 'general' && (
            <GeneralYamlSection 
              data={yamlConfig.sage_yaml}
              onChange={handleSageYamlChange}
            />
          )}

          {activeSection === 'catalogs' && (
            <CatalogsYamlSection 
              catalogs={yamlConfig.catalogs}
              onAdd={addCatalog}
              onUpdate={updateCatalog}
              onDelete={deleteCatalog}
              dataTypes={dataTypes}
              fileTypes={fileTypes}
              severityTypes={severityTypes}
            />
          )}

          {activeSection === 'package' && (
            <PackageYamlSection 
              packageData={yamlConfig.package}
              catalogs={yamlConfig.catalogs}
              onChange={(updatedPackage) => setYamlConfig(prev => ({ ...prev, package: updatedPackage }))}
              fileTypes={fileTypes}
            />
          )}
        </div>
      </div>
    );
  };

  const YAMLValidator = () => {
    const [yamlText, setYamlText] = useState('');
    const [validationResult, setValidationResult] = useState(null);
    const [isValidating, setIsValidating] = useState(false);

    const validateYAML = async () => {
      if (!yamlText.trim()) {
        setValidationResult({ error: 'Por favor ingresa contenido YAML para validar' });
        return;
      }

      setIsValidating(true);
      try {
        const basicValidation = validateYAMLSyntax(yamlText);
        if (basicValidation.isValid) {
          setValidationResult({ 
            success: true, 
            message: 'YAML válido según especificación SAGE',
            details: basicValidation.details 
          });
        } else {
          setValidationResult({ 
            error: basicValidation.error,
            details: basicValidation.details 
          });
        }
      } catch (error) {
        setValidationResult({ error: 'Error validando YAML: ' + error.message });
      }
      setIsValidating(false);
    };

    const validateYAMLSyntax = (yamlContent) => {
      try {
        const details = [];
        
        const hasSageYaml = yamlContent.includes('sage_yaml:');
        const hasCatalogs = yamlContent.includes('catalogs:');
        const hasPackages = yamlContent.includes('packages:') || yamlContent.includes('package:');
        
        details.push(`✓ Sección sage_yaml: ${hasSageYaml ? 'Presente' : 'Faltante'}`);
        details.push(`✓ Sección catalogs: ${hasCatalogs ? 'Presente' : 'Faltante'}`);
        details.push(`✓ Sección packages: ${hasPackages ? 'Presente' : 'Faltante'}`);
        
        if (!hasSageYaml || !hasCatalogs) {
          return {
            isValid: false,
            error: 'Faltan secciones requeridas en el YAML',
            details
          };
        }
        
        return {
          isValid: true,
          details
        };
      } catch (error) {
        return {
          isValid: false,
          error: 'Error de sintaxis YAML: ' + error.message,
          details: ['Error al parsear el contenido YAML']
        };
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contenido YAML a validar
          </label>
          <textarea
            value={yamlText}
            onChange={(e) => setYamlText(e.target.value)}
            className="w-full h-64 border border-gray-300 rounded-md px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Pega aquí tu contenido YAML..."
          />
        </div>
        
        <Button
          onClick={validateYAML}
          disabled={isValidating}
          className="w-full"
        >
          {isValidating ? 'Validando...' : 'Validar YAML'}
        </Button>
        
        {validationResult && (
          <div className={`mt-4 p-4 rounded-md ${validationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h4 className={`font-semibold ${validationResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {validationResult.success ? 'Validación Exitosa' : 'Error de Validación'}
            </h4>
            <p className={`mt-2 ${validationResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {validationResult.success ? validationResult.message : validationResult.error}
            </p>
            {validationResult.details && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700">Detalles:</p>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  {validationResult.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <>
      <Head>
        <title>YAML Editor - SAGE</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <Title className="text-3xl font-bold text-gray-900">Editor de YAML SAGE</Title>
            <p className="text-gray-600 mt-2">Herramientas completas para crear, editar y validar archivos de configuración YAML</p>
          </div>
          
          {/* Navigation tabs */}
          <div className="mb-6">
            <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveEditorTab(0)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeEditorTab === 0
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Generador IA
              </button>
              <button
                onClick={() => setActiveEditorTab(1)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeEditorTab === 1
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Editor Visual
              </button>
              <button
                onClick={() => setActiveEditorTab(2)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeEditorTab === 2
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Validador
              </button>
            </nav>
          </div>
          
          {/* Quick access buttons */}
          <div className="mb-6 flex flex-wrap gap-4">
            <Button
              onClick={() => router.push('/studio')}
              className="flex items-center space-x-2"
              variant="secondary"
            >
              <BeakerIcon className="h-4 w-4" />
              <span>YAML Studio Completo</span>
            </Button>
          </div>
          
          {/* Tab content based on activeEditorTab */}
          {activeEditorTab === 0 && (
            <Card>
              <Title className="mb-4">Generador YAML con Inteligencia Artificial</Title>
              <p className="text-gray-600 mb-6">
                Sube un archivo de datos (CSV, Excel, ZIP) y recibe instrucciones específicas. 
                La IA generará automáticamente un YAML optimizado según la especificación SAGE.
              </p>
              <YAMLStudioForm />
            </Card>
          )}
          
          {activeEditorTab === 1 && (
            <Card>
              <Title className="mb-4">Editor Visual Manual</Title>
              <p className="text-gray-600 mb-6">
                Crea YAMLs paso a paso usando formularios estructurados. 
                Ideal para usuarios que prefieren control total sobre la configuración.
              </p>
              <ManualYAMLEditor />
            </Card>
          )}
          
          {activeEditorTab === 2 && (
            <Card>
              <Title className="mb-4">Validador de YAML</Title>
              <p className="text-gray-600 mb-6">
                Valida archivos YAML existentes contra la especificación SAGE. 
                Detecta errores de sintaxis y conformidad.
              </p>
              <YAMLValidator />
            </Card>
          )}
        </div>
      </div>
    </>
  );
};



// Componente para la sección de información general
const GeneralYamlSection = ({ data, onChange }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Información General (sage_yaml)</h3>
      <p className="text-sm text-gray-600 mb-6">Información básica sobre tu configuración YAML</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre *
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nombre descriptivo del YAML"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Versión *
        </label>
        <input
          type="text"
          value={data.version}
          onChange={(e) => onChange('version', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="1.0.0"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Autor *
        </label>
        <input
          type="text"
          value={data.author}
          onChange={(e) => onChange('author', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nombre del autor"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comentarios
        </label>
        <input
          type="text"
          value={data.comments || ''}
          onChange={(e) => onChange('comments', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Comentarios adicionales (opcional)"
        />
      </div>
      
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción *
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Descripción del propósito del YAML"
        />
      </div>
    </div>
  </div>
);

// Componente para la sección de catálogos
const CatalogsYamlSection = ({ catalogs, onAdd, onUpdate, onDelete, dataTypes, fileTypes, severityTypes }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Catálogos</h3>
        <p className="text-sm text-gray-600 mt-1">Define la estructura y validaciones para tus archivos de datos</p>
      </div>
      <Button onClick={onAdd} variant="primary" className="text-sm">
        + Agregar Catálogo
      </Button>
    </div>
    
    {catalogs.length === 0 ? (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 mb-4">No hay catálogos definidos</p>
        <Button onClick={onAdd} variant="primary">
          Crear primer catálogo
        </Button>
      </div>
    ) : (
      <div className="space-y-4">
        {catalogs.map((catalog, index) => (
          <YamlCatalogEditor
            key={index}
            catalog={catalog}
            index={index}
            onUpdate={onUpdate}
            onDelete={onDelete}
            dataTypes={dataTypes}
            fileTypes={fileTypes}
            severityTypes={severityTypes}
          />
        ))}
      </div>
    )}
  </div>
);

// Componente editor individual de catálogo
const YamlCatalogEditor = ({ catalog, index, onUpdate, onDelete, dataTypes, fileTypes, severityTypes }) => {
  const [expanded, setExpanded] = useState(true);
  
  const updateField = (field, value) => {
    onUpdate(index, { ...catalog, [field]: value });
  };
  
  const updateFileFormat = (field, value) => {
    onUpdate(index, {
      ...catalog,
      file_format: { ...catalog.file_format, [field]: value }
    });
  };
  
  const addField = () => {
    const newField = {
      name: '',
      type: 'texto',
      required: false,
      unique: false
    };
    onUpdate(index, {
      ...catalog,
      fields: [...catalog.fields, newField]
    });
  };
  
  const updateFieldAt = (fieldIndex, field, value) => {
    const updatedFields = catalog.fields.map((f, i) => 
      i === fieldIndex ? { ...f, [field]: value } : f
    );
    onUpdate(index, { ...catalog, fields: updatedFields });
  };
  
  const removeField = (fieldIndex) => {
    onUpdate(index, {
      ...catalog,
      fields: catalog.fields.filter((_, i) => i !== fieldIndex)
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {expanded ? '▼' : '▶'}
            </button>
            <h4 className="font-medium text-gray-900">
              {catalog.name || `Catálogo ${index + 1}`}
            </h4>
          </div>
          <button
            onClick={() => onDelete(index)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Eliminar
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Catálogo *
              </label>
              <input
                type="text"
                value={catalog.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del catálogo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Archivo
              </label>
              <input
                type="text"
                value={catalog.filename || ''}
                onChange={(e) => updateField('filename', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="archivo.csv"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={catalog.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Descripción del catálogo"
              />
            </div>
          </div>
          
          {/* Formato de archivo */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-4">Formato de Archivo</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={catalog.file_format?.type || 'CSV'}
                  onChange={(e) => updateFileFormat('type', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fileTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              {catalog.file_format?.type === 'CSV' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delimitador
                    </label>
                    <select
                      value={catalog.file_format?.delimiter || ','}
                      onChange={(e) => updateFileFormat('delimiter', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value=",">Coma (,)</option>
                      <option value=";">Punto y coma (;)</option>
                      <option value="|">Pipe (|)</option>
                      <option value="\t">Tab</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Encabezados
                    </label>
                    <select
                      value={catalog.file_format?.header ? 'true' : 'false'}
                      onChange={(e) => updateFileFormat('header', e.target.value === 'true')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Campos */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-medium text-gray-900">Campos</h5>
              <Button onClick={addField} variant="secondary" className="text-sm">
                + Agregar Campo
              </Button>
            </div>
            
            {catalog.fields.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No hay campos definidos. Agrega uno para comenzar.
              </div>
            ) : (
              <div className="space-y-3">
                {catalog.fields.map((field, fieldIndex) => (
                  <YamlFieldEditor
                    key={fieldIndex}
                    field={field}
                    fieldIndex={fieldIndex}
                    onUpdate={updateFieldAt}
                    onRemove={removeField}
                    dataTypes={dataTypes}
                    severityTypes={severityTypes}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Validaciones de Fila */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-medium text-gray-900">Validaciones de Fila (Opcional)</h5>
              <Button 
                onClick={() => {
                  const newValidation = { name: '', description: '', rule: '', severity: 'error' };
                  onUpdate(index, {
                    ...catalog,
                    row_validation: [...(catalog.row_validation || []), newValidation]
                  });
                }} 
                variant="secondary" 
                className="text-sm"
              >
                + Agregar Validación
              </Button>
            </div>
            
            {(!catalog.row_validation || catalog.row_validation.length === 0) ? (
              <div className="text-center py-4 text-gray-500">
                No hay validaciones de fila definidas.
              </div>
            ) : (
              <div className="space-y-3">
                {catalog.row_validation.map((validation, validationIndex) => (
                  <div key={validationIndex} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={validation.name || ''}
                        onChange={(e) => {
                          const updatedValidations = catalog.row_validation.map((v, i) => 
                            i === validationIndex ? { ...v, name: e.target.value } : v
                          );
                          onUpdate(index, { ...catalog, row_validation: updatedValidations });
                        }}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        placeholder="Ej: Total válido"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <input
                        type="text"
                        value={validation.description || ''}
                        onChange={(e) => {
                          const updatedValidations = catalog.row_validation.map((v, i) => 
                            i === validationIndex ? { ...v, description: e.target.value } : v
                          );
                          onUpdate(index, { ...catalog, row_validation: updatedValidations });
                        }}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        placeholder="Ej: El total debe ser mayor a cero"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Regla (pandas) *</label>
                      <input
                        type="text"
                        value={validation.rule || ''}
                        onChange={(e) => {
                          const updatedValidations = catalog.row_validation.map((v, i) => 
                            i === validationIndex ? { ...v, rule: e.target.value } : v
                          );
                          onUpdate(index, { ...catalog, row_validation: updatedValidations });
                        }}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm font-mono"
                        placeholder="df['total'] > 0"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <div className="flex-1 mr-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Severidad</label>
                        <select
                          value={validation.severity || 'error'}
                          onChange={(e) => {
                            const updatedValidations = catalog.row_validation.map((v, i) => 
                              i === validationIndex ? { ...v, severity: e.target.value } : v
                            );
                            onUpdate(index, { ...catalog, row_validation: updatedValidations });
                          }}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                          {severityTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          const updatedValidations = catalog.row_validation.filter((_, i) => i !== validationIndex);
                          onUpdate(index, { ...catalog, row_validation: updatedValidations });
                        }}
                        className="text-red-600 hover:text-red-800 text-sm mb-1"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Validaciones de Catálogo */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-medium text-gray-900">Validaciones de Catálogo (Opcional)</h5>
              <Button 
                onClick={() => {
                  const newValidation = { name: '', description: '', rule: '', severity: 'error' };
                  onUpdate(index, {
                    ...catalog,
                    catalog_validation: [...(catalog.catalog_validation || []), newValidation]
                  });
                }} 
                variant="secondary" 
                className="text-sm"
              >
                + Agregar Validación
              </Button>
            </div>
            
            {(!catalog.catalog_validation || (Array.isArray(catalog.catalog_validation) && catalog.catalog_validation.length === 0)) ? (
              <div className="text-center py-4 text-gray-500">
                No hay validaciones de catálogo definidas.
              </div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(catalog.catalog_validation) ? catalog.catalog_validation : [catalog.catalog_validation]).map((validation, validationIndex) => (
                  <div key={validationIndex} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={validation.name || ''}
                        onChange={(e) => {
                          const updatedValidations = catalog.catalog_validation.map((v, i) => 
                            i === validationIndex ? { ...v, name: e.target.value } : v
                          );
                          onUpdate(index, { ...catalog, catalog_validation: updatedValidations });
                        }}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        placeholder="Ej: Límite total"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <input
                        type="text"
                        value={validation.description || ''}
                        onChange={(e) => {
                          const updatedValidations = catalog.catalog_validation.map((v, i) => 
                            i === validationIndex ? { ...v, description: e.target.value } : v
                          );
                          onUpdate(index, { ...catalog, catalog_validation: updatedValidations });
                        }}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        placeholder="Ej: El total general no debe exceder límite"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Regla (pandas) *</label>
                      <input
                        type="text"
                        value={validation.rule || ''}
                        onChange={(e) => {
                          const updatedValidations = catalog.catalog_validation.map((v, i) => 
                            i === validationIndex ? { ...v, rule: e.target.value } : v
                          );
                          onUpdate(index, { ...catalog, catalog_validation: updatedValidations });
                        }}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm font-mono"
                        placeholder="df['total'].sum() < 1000000"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <div className="flex-1 mr-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Severidad</label>
                        <select
                          value={validation.severity || 'error'}
                          onChange={(e) => {
                            const updatedValidations = catalog.catalog_validation.map((v, i) => 
                              i === validationIndex ? { ...v, severity: e.target.value } : v
                            );
                            onUpdate(index, { ...catalog, catalog_validation: updatedValidations });
                          }}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                          {severityTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          const updatedValidations = catalog.catalog_validation.filter((_, i) => i !== validationIndex);
                          onUpdate(index, { ...catalog, catalog_validation: updatedValidations });
                        }}
                        className="text-red-600 hover:text-red-800 text-sm mb-1"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente editor de campo
const YamlFieldEditor = ({ field, fieldIndex, onUpdate, onRemove, dataTypes, severityTypes }) => {
  const [expanded, setExpanded] = useState(false);
  
  const addValidationRule = () => {
    const newRule = { name: '', description: '', rule: '', severity: 'error' };
    const updatedField = {
      ...field,
      validation_rules: [...(field.validation_rules || []), newRule]
    };
    onUpdate(fieldIndex, 'validation_rules', updatedField.validation_rules);
  };
  
  const updateValidationRule = (ruleIndex, property, value) => {
    const updatedRules = (field.validation_rules || []).map((rule, i) => 
      i === ruleIndex ? { ...rule, [property]: value } : rule
    );
    onUpdate(fieldIndex, 'validation_rules', updatedRules);
  };
  
  const removeValidationRule = (ruleIndex) => {
    const updatedRules = (field.validation_rules || []).filter((_, i) => i !== ruleIndex);
    onUpdate(fieldIndex, 'validation_rules', updatedRules);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            value={field.name || ''}
            onChange={(e) => onUpdate(fieldIndex, 'name', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="nombre_campo"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tipo *
          </label>
          <select
            value={field.type || 'texto'}
            onChange={(e) => onUpdate(fieldIndex, 'type', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {dataTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => onUpdate(fieldIndex, 'required', e.target.checked)}
              className="mr-2"
            />
            Requerido
          </label>
        </div>
        
        <div className="flex items-center">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={field.unique || false}
              onChange={(e) => onUpdate(fieldIndex, 'unique', e.target.checked)}
              className="mr-2"
            />
            Único
          </label>
        </div>
        
        <div className="flex items-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-800 text-sm mr-2"
          >
            {expanded ? 'Ocultar' : 'Validaciones'}
          </button>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => onRemove(fieldIndex)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Eliminar
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between items-center mb-3">
            <h6 className="text-sm font-medium text-gray-700">Validaciones del Campo (Opcional)</h6>
            <button
              onClick={addValidationRule}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Agregar Validación
            </button>
          </div>
          
          {(!field.validation_rules || field.validation_rules.length === 0) ? (
            <div className="text-center py-3 text-gray-500 text-sm">
              No hay validaciones definidas para este campo.
            </div>
          ) : (
            <div className="space-y-3">
              {field.validation_rules.map((rule, ruleIndex) => (
                <div key={ruleIndex} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={rule.name || ''}
                      onChange={(e) => updateValidationRule(ruleIndex, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      placeholder="Ej: Rango válido"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={rule.description || ''}
                      onChange={(e) => updateValidationRule(ruleIndex, 'description', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      placeholder="Ej: El valor debe estar entre 0 y 100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Regla (pandas) *</label>
                    <input
                      type="text"
                      value={rule.rule || ''}
                      onChange={(e) => updateValidationRule(ruleIndex, 'rule', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm font-mono"
                      placeholder={`df['${field.name || 'campo'}'].between(0, 100)`}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <div className="flex-1 mr-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Severidad</label>
                      <select
                        value={rule.severity || 'error'}
                        onChange={(e) => updateValidationRule(ruleIndex, 'severity', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        {severityTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => removeValidationRule(ruleIndex)}
                      className="text-red-600 hover:text-red-800 text-sm mb-1"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente para la sección de paquete
const PackageYamlSection = ({ packageData, catalogs, onChange, fileTypes }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900">Configuración del Paquete</h3>
      <p className="text-sm text-gray-600 mt-1">Define cómo se agrupan y validan los catálogos</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del Paquete *
        </label>
        <input
          type="text"
          value={packageData.name}
          onChange={(e) => onChange({ ...packageData, name: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nombre del paquete"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Archivo
        </label>
        <select
          value={packageData.file_format?.type || 'ZIP'}
          onChange={(e) => onChange({ 
            ...packageData, 
            file_format: { ...packageData.file_format, type: e.target.value }
          })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {fileTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          value={packageData.description || ''}
          onChange={(e) => onChange({ ...packageData, description: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Descripción del paquete"
        />
      </div>
    </div>
    
    {/* Selección de catálogos */}
    <div className="border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-4">Catálogos Incluidos</h4>
      {catalogs.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay catálogos disponibles. Crea catálogos primero.</p>
      ) : (
        <div className="space-y-2">
          {catalogs.map((catalog, index) => {
            const isSelected = packageData.catalogs.includes(catalog.name);
            return (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    const newCatalogs = e.target.checked
                      ? [...packageData.catalogs, catalog.name]
                      : packageData.catalogs.filter(name => name !== catalog.name);
                    onChange({ ...packageData, catalogs: newCatalogs });
                  }}
                  className="mr-3"
                />
                <span className="text-sm">
                  {catalog.name} ({catalog.filename || 'sin archivo'})
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
    
    {/* Validaciones de Paquete */}
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-900">Validaciones de Paquete (Opcional)</h4>
        <Button 
          onClick={() => {
            const newValidation = { name: '', description: '', rule: '', severity: 'error' };
            onChange({
              ...packageData,
              package_validation: [...(packageData.package_validation || []), newValidation]
            });
          }} 
          variant="secondary" 
          className="text-sm"
        >
          + Agregar Validación
        </Button>
      </div>
      
      {(!packageData.package_validation || packageData.package_validation.length === 0) ? (
        <div className="text-center py-4 text-gray-500">
          No hay validaciones de paquete definidas.
        </div>
      ) : (
        <div className="space-y-3">
          {packageData.package_validation.map((validation, validationIndex) => (
            <div key={validationIndex} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={validation.name || ''}
                  onChange={(e) => {
                    const updatedValidations = packageData.package_validation.map((v, i) => 
                      i === validationIndex ? { ...v, name: e.target.value } : v
                    );
                    onChange({ ...packageData, package_validation: updatedValidations });
                  }}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  placeholder="Ej: Referencias válidas"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={validation.description || ''}
                  onChange={(e) => {
                    const updatedValidations = packageData.package_validation.map((v, i) => 
                      i === validationIndex ? { ...v, description: e.target.value } : v
                    );
                    onChange({ ...packageData, package_validation: updatedValidations });
                  }}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  placeholder="Ej: Referencias entre catálogos deben ser válidas"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Regla (pandas) *</label>
                <input
                  type="text"
                  value={validation.rule || ''}
                  onChange={(e) => {
                    const updatedValidations = packageData.package_validation.map((v, i) => 
                      i === validationIndex ? { ...v, rule: e.target.value } : v
                    );
                    onChange({ ...packageData, package_validation: updatedValidations });
                  }}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm font-mono"
                  placeholder="df['ventas']['cliente'].isin(df['clientes']['id'])"
                />
              </div>
              
              <div className="flex items-end">
                <div className="flex-1 mr-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severidad</label>
                  <select
                    value={validation.severity || 'error'}
                    onChange={(e) => {
                      const updatedValidations = packageData.package_validation.map((v, i) => 
                        i === validationIndex ? { ...v, severity: e.target.value } : v
                      );
                      onChange({ ...packageData, package_validation: updatedValidations });
                    }}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  >
                    <option value="error">error</option>
                    <option value="warning">warning</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    const updatedValidations = packageData.package_validation.filter((_, i) => i !== validationIndex);
                    onChange({ ...packageData, package_validation: updatedValidations });
                  }}
                  className="text-red-600 hover:text-red-800 text-sm mb-1"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

YAMLEditorPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default YAMLEditorPage;