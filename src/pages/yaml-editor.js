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
    const severityTypes = ['error', 'warning'];

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

    // Parser YAML corregido para manejar archivos complejos con 24+ campos
    const parseYamlContent = (yamlContent) => {
      try {
        console.log('Iniciando parser mejorado...');
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

            // Nuevo campo (nivel 4, con guión)
            if (indent === 4 && trimmed.startsWith('- ')) {
              const fieldData = trimmed.substring(2).trim();
              if (fieldData.startsWith('name:')) {
                const fieldName = fieldData.substring(5).trim().replace(/^["']|["']$/g, '');
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
                console.log(`Nuevo campo encontrado: ${fieldName}`);
              }
              continue;
            }

            // Propiedades del campo (nivel 6 espacios)
            if (currentField && indent === 6 && trimmed.includes(':') && !trimmed.startsWith('- ')) {
              const colonIndex = trimmed.indexOf(':');
              const key = trimmed.substring(0, colonIndex).trim();
              const value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');

              if (key === 'type') {
                currentField.type = value;
              } else if (key === 'required') {
                currentField.required = value === 'true';
              } else if (key === 'unique') {
                currentField.unique = value === 'true';
              } else if (key === 'description') {
                currentField.description = value;
              } else if (key === 'defaultValue') {
                currentField.defaultValue = value;
              } else if (key === 'validation_rules') {
                inFieldValidationRules = true;
              }
              continue;
            }

            // Validaciones de campo (nivel 6, con guión)
            if (currentField && inFieldValidationRules && indent === 6 && trimmed.startsWith('- ')) {
              const validationData = trimmed.substring(2).trim();
              if (validationData.startsWith('name:')) {
                const validationName = validationData.substring(5).trim().replace(/^["']|["']$/g, '');
                currentValidation = {
                  name: validationName,
                  description: '',
                  rule: '',
                  severity: 'error'
                };
                currentField.validation_rules.push(currentValidation);
                console.log(`Nueva validación de campo: ${validationName}`);
              }
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
                  />
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
const YamlFieldEditor = ({ field, fieldIndex, onUpdate, onRemove, dataTypes }) => (
  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-gray-50 p-3 rounded-md">
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
    
    <div className="md:col-span-2 flex justify-end">
      <button
        onClick={() => onRemove(fieldIndex)}
        className="text-red-600 hover:text-red-800 text-sm"
      >
        Eliminar
      </button>
    </div>
  </div>
);

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
  </div>
);

YAMLEditorPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default YAMLEditorPage;