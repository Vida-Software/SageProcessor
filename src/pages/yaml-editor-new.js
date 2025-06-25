import { useState } from 'react';
import Head from 'next/head';
import { ChevronDownIcon, ChevronRightIcon, DocumentArrowDownIcon, DocumentArrowUpIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function YAMLEditorNew() {
  // Estado principal del YAML
  const [yamlConfig, setYamlConfig] = useState({
    sage_yaml: {
      name: "Configuración SAGE",
      description: "",
      version: "1.0.0",
      author: "",
      comments: ""
    },
    catalogs: [],
    packages: []
  });

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  // Estados de colapsado
  const [collapsed, setCollapsed] = useState({
    sage_yaml: false,
    catalogs: false,
    packages: false
  });

  // Toggle colapsado
  const toggleCollapse = (section) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
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
          setLoadError('No se pudo interpretar el archivo YAML. Verifica la estructura SAGE.');
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
    event.target.value = '';
  };

  // Parser YAML robusto desde cero
  const parseYamlContent = (yamlContent) => {
    try {
      const result = {
        sage_yaml: {
          name: "Configuración SAGE",
          description: "",
          version: "1.0.0",
          author: "",
          comments: ""
        },
        catalogs: [],
        packages: []
      };

      const lines = yamlContent.split('\n');
      let currentSection = null;
      let currentCatalog = null;
      let currentPackage = null;
      let currentField = null;
      let currentValidation = null;
      let inFieldValidationRules = false;
      let inRowValidation = false;
      let inCatalogValidation = false;
      let inPackageValidation = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const indent = line.search(/\S/);
        
        if (!trimmed || trimmed.startsWith('#')) continue;

        // Detectar secciones principales
        if (trimmed === 'sage_yaml:') {
          currentSection = 'sage_yaml';
          continue;
        } else if (trimmed === 'catalogs:') {
          currentSection = 'catalogs';
          currentCatalog = null;
          continue;
        } else if (trimmed === 'packages:') {
          currentSection = 'packages';
          currentPackage = null;
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

        // Parsear catalogs
        else if (currentSection === 'catalogs') {
          // Nuevo catálogo (nivel 2 espacios)
          if (indent === 2 && trimmed.endsWith(':') && !trimmed.includes(' ')) {
            const catalogId = trimmed.slice(0, -1);
            currentCatalog = {
              id: catalogId,
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
              // Manejar descripciones multilínea
              let fullDescription = value;
              let j = i + 1;
              while (j < lines.length && lines[j].search(/\S/) > 4) {
                const nextLine = lines[j].trim();
                if (nextLine && !nextLine.includes(':')) {
                  fullDescription += ' ' + nextLine.replace(/^["']|["']$/g, '');
                  i = j;
                } else {
                  break;
                }
                j++;
              }
              currentCatalog.description = fullDescription;
            } else if (key === 'filename') {
              currentCatalog.filename = value;
            } else if (key === 'file_format') {
              // No hacer nada, esperamos las propiedades anidadas
            } else if (key === 'fields') {
              // No hacer nada, esperamos los campos
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
          // Nuevo paquete (nivel 2 espacios)
          if (indent === 2 && trimmed.endsWith(':') && !trimmed.includes(' ')) {
            const packageId = trimmed.slice(0, -1);
            currentPackage = {
              id: packageId,
              name: packageId,
              description: '',
              catalogs: [],
              file_format: { type: 'ZIP' },
              package_validation: []
            };
            result.packages.push(currentPackage);
            inPackageValidation = false;
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
              // Manejar descripciones multilínea
              let fullDescription = value;
              let j = i + 1;
              while (j < lines.length && lines[j].search(/\S/) > 4) {
                const nextLine = lines[j].trim();
                if (nextLine && !nextLine.includes(':')) {
                  fullDescription += ' ' + nextLine.replace(/^["']|["']$/g, '');
                  i = j;
                } else {
                  break;
                }
                j++;
              }
              currentPackage.description = fullDescription;
            } else if (key === 'file_format') {
              // Esperamos propiedades anidadas
            } else if (key === 'catalogs') {
              // Esperamos lista de catálogos
            } else if (key === 'package_validation') {
              inPackageValidation = true;
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
            continue;
          }

          // Catálogos del paquete (nivel 4, con guión)
          if (indent === 4 && trimmed.startsWith('- ') && !inPackageValidation) {
            const catalogName = trimmed.substring(2).trim().replace(/^["']|["']$/g, '');
            currentPackage.catalogs.push(catalogName);
            continue;
          }

          // Validaciones de paquete (nivel 4, con guión)
          if (inPackageValidation && indent === 4 && trimmed.startsWith('- ')) {
            const validationData = trimmed.substring(2).trim();
            if (validationData.startsWith('name:')) {
              const validationName = validationData.substring(5).trim().replace(/^["']|["']$/g, '');
              currentValidation = {
                name: validationName,
                description: '',
                rule: '',
                severity: 'error'
              };
              currentPackage.package_validation.push(currentValidation);
            }
            continue;
          }

          // Propiedades de validaciones de paquete (nivel 6 espacios)
          if (currentValidation && inPackageValidation && indent === 6 && trimmed.includes(':')) {
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
      }

      return result;
    } catch (error) {
      console.error('Error parsing YAML:', error);
      return null;
    }
  };

  // Generar YAML de salida
  const generateYamlOutput = () => {
    let yaml = '';
    
    // sage_yaml
    yaml += 'sage_yaml:\n';
    yaml += `  name: ${yamlConfig.sage_yaml.name}\n`;
    yaml += `  description: ${yamlConfig.sage_yaml.description}\n`;
    yaml += `  version: ${yamlConfig.sage_yaml.version}\n`;
    yaml += `  author: ${yamlConfig.sage_yaml.author}\n`;
    if (yamlConfig.sage_yaml.comments) {
      yaml += `  comments: ${yamlConfig.sage_yaml.comments}\n`;
    }
    yaml += '\n';

    // catalogs
    yaml += 'catalogs:\n';
    yamlConfig.catalogs.forEach(catalog => {
      yaml += `  ${catalog.id}:\n`;
      yaml += `    name: ${catalog.name}\n`;
      if (catalog.description) {
        yaml += `    description: ${catalog.description}\n`;
      }
      yaml += `    filename: ${catalog.filename}\n`;
      yaml += `    file_format:\n`;
      yaml += `      type: ${catalog.file_format.type}\n`;
      if (catalog.file_format.type === 'CSV') {
        yaml += `      delimiter: '${catalog.file_format.delimiter}'\n`;
      }
      yaml += `      header: ${catalog.file_format.header}\n`;
      
      if (catalog.fields.length > 0) {
        yaml += `    fields:\n`;
        catalog.fields.forEach(field => {
          yaml += `    - name: ${field.name}\n`;
          yaml += `      type: ${field.type}\n`;
          if (field.required) yaml += `      required: true\n`;
          if (field.unique) yaml += `      unique: true\n`;
          if (field.description) yaml += `      description: ${field.description}\n`;
          if (field.defaultValue) yaml += `      defaultValue: ${field.defaultValue}\n`;
          
          if (field.validation_rules && field.validation_rules.length > 0) {
            yaml += `      validation_rules:\n`;
            field.validation_rules.forEach(rule => {
              yaml += `      - name: ${rule.name}\n`;
              yaml += `        rule: ${rule.rule}\n`;
              yaml += `        description: ${rule.description}\n`;
              yaml += `        severity: ${rule.severity.toUpperCase()}\n`;
            });
          }
        });
      }

      if (catalog.row_validation && catalog.row_validation.length > 0) {
        yaml += `    row_validation:\n`;
        catalog.row_validation.forEach(rule => {
          yaml += `    - name: ${rule.name}\n`;
          yaml += `      rule: ${rule.rule}\n`;
          yaml += `      description: ${rule.description}\n`;
          yaml += `      severity: ${rule.severity.toUpperCase()}\n`;
        });
      }

      if (catalog.catalog_validation && catalog.catalog_validation.length > 0) {
        yaml += `    catalog_validation:\n`;
        catalog.catalog_validation.forEach(rule => {
          yaml += `    - name: ${rule.name}\n`;
          yaml += `      rule: ${rule.rule}\n`;
          yaml += `      description: ${rule.description}\n`;
          yaml += `      severity: ${rule.severity.toUpperCase()}\n`;
        });
      }
    });
    yaml += '\n';

    // packages
    yaml += 'packages:\n';
    yamlConfig.packages.forEach(pkg => {
      yaml += `  ${pkg.id}:\n`;
      yaml += `    name: ${pkg.name}\n`;
      if (pkg.description) {
        yaml += `    description: ${pkg.description}\n`;
      }
      yaml += `    file_format:\n`;
      yaml += `      type: ${pkg.file_format.type}\n`;
      
      if (pkg.catalogs.length > 0) {
        yaml += `    catalogs:\n`;
        pkg.catalogs.forEach(catalog => {
          yaml += `    - ${catalog}\n`;
        });
      }

      if (pkg.package_validation && pkg.package_validation.length > 0) {
        yaml += `    package_validation:\n`;
        pkg.package_validation.forEach(rule => {
          yaml += `    - name: ${rule.name}\n`;
          yaml += `      rule: ${rule.rule}\n`;
          yaml += `      description: ${rule.description}\n`;
          yaml += `      severity: ${rule.severity.toUpperCase()}\n`;
        });
      }
    });

    return yaml;
  };

  // Descargar YAML
  const downloadYaml = () => {
    const yamlString = generateYamlOutput();
    const element = document.createElement('a');
    const file = new Blob([yamlString], { type: 'text/yaml' });
    element.href = URL.createObjectURL(file);
    element.download = `${yamlConfig.sage_yaml.name || 'config'}.yaml`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      <Head>
        <title>Editor YAML SAGE - Nuevo</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Editor YAML SAGE</h1>
            <p className="mt-2 text-gray-600">Editor completo para configuraciones YAML según especificación SAGE</p>
          </div>

          {/* Controles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <input
                  type="file"
                  accept=".yaml,.yml"
                  onChange={loadYamlFromFile}
                  className="hidden"
                  id="yaml-file-input"
                  disabled={isLoading}
                />
                <button
                  onClick={() => document.getElementById('yaml-file-input').click()}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                  <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                  {isLoading ? 'Cargando...' : 'Cargar YAML'}
                </button>
              </div>
              
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {showPreview ? 'Ocultar Vista Previa' : 'Ver Vista Previa'}
              </button>
              
              <button
                onClick={downloadYaml}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Descargar YAML
              </button>
            </div>

            {/* Error de carga */}
            {loadError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-800">{loadError}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="space-y-6">
              {/* Sección SAGE YAML */}
              <SageYamlSection 
                config={yamlConfig.sage_yaml}
                onChange={(newConfig) => setYamlConfig(prev => ({ ...prev, sage_yaml: newConfig }))}
                collapsed={collapsed.sage_yaml}
                onToggle={() => toggleCollapse('sage_yaml')}
              />

              {/* Sección Catálogos */}
              <CatalogsSection 
                catalogs={yamlConfig.catalogs}
                onChange={(newCatalogs) => setYamlConfig(prev => ({ ...prev, catalogs: newCatalogs }))}
                collapsed={collapsed.catalogs}
                onToggle={() => toggleCollapse('catalogs')}
              />

              {/* Sección Paquetes */}
              <PackagesSection 
                packages={yamlConfig.packages}
                catalogs={yamlConfig.catalogs}
                onChange={(newPackages) => setYamlConfig(prev => ({ ...prev, packages: newPackages }))}
                collapsed={collapsed.packages}
                onToggle={() => toggleCollapse('packages')}
              />
            </div>

            {/* Vista Previa */}
            {showPreview && (
              <div className="lg:sticky lg:top-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Vista Previa YAML</h3>
                  </div>
                  <div className="p-6">
                    <pre className="text-sm text-gray-800 bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                      {generateYamlOutput()}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Componente para la sección SAGE YAML
function SageYamlSection({ config, onChange, collapsed, onToggle }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <h3 className="text-lg font-medium text-gray-900">Información General (sage_yaml)</h3>
        {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
      </button>
      
      {!collapsed && (
        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => onChange({ ...config, name: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre de la configuración"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción *</label>
            <textarea
              value={config.description}
              onChange={(e) => onChange({ ...config, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción del propósito"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Versión *</label>
              <input
                type="text"
                value={config.version}
                onChange={(e) => onChange({ ...config, version: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="1.0.0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Autor *</label>
              <input
                type="text"
                value={config.author}
                onChange={(e) => onChange({ ...config, author: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre del autor"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Comentarios</label>
            <textarea
              value={config.comments}
              onChange={(e) => onChange({ ...config, comments: e.target.value })}
              rows={2}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionales (opcional)"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para la sección de Catálogos
function CatalogsSection({ catalogs, onChange, collapsed, onToggle }) {
  const addCatalog = () => {
    const newCatalog = {
      id: `catalog_${Date.now()}`,
      name: "Nuevo Catálogo",
      description: "",
      filename: "",
      file_format: { type: "CSV", delimiter: ",", header: true },
      fields: [],
      row_validation: [],
      catalog_validation: []
    };
    onChange([...catalogs, newCatalog]);
  };

  const updateCatalog = (index, updatedCatalog) => {
    const newCatalogs = [...catalogs];
    newCatalogs[index] = updatedCatalog;
    onChange(newCatalogs);
  };

  const deleteCatalog = (index) => {
    const newCatalogs = catalogs.filter((_, i) => i !== index);
    onChange(newCatalogs);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <h3 className="text-lg font-medium text-gray-900">Catálogos ({catalogs.length})</h3>
        {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
      </button>
      
      {!collapsed && (
        <div className="px-6 pb-6">
          <div className="mb-4">
            <button
              onClick={addCatalog}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Catálogo
            </button>
          </div>
          
          <div className="space-y-6">
            {catalogs.map((catalog, index) => (
              <CatalogEditor
                key={catalog.id}
                catalog={catalog}
                onChange={(updated) => updateCatalog(index, updated)}
                onDelete={() => deleteCatalog(index)}
              />
            ))}
            
            {catalogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay catálogos definidos. Haz clic en "Agregar Catálogo" para comenzar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Resto de componentes siguen el mismo patrón...
function CatalogEditor({ catalog, onChange, onDelete }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-center text-gray-500">
        Editor de catálogo para: {catalog.name}
        <br />
        {catalog.fields.length} campos encontrados
        <br />
        <button onClick={onDelete} className="text-red-600 mt-2">Eliminar Catálogo</button>
      </div>
    </div>
  );
}

function PackagesSection({ packages, catalogs, onChange, collapsed, onToggle }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <h3 className="text-lg font-medium text-gray-900">Paquetes ({packages.length})</h3>
        {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
      </button>
      
      {!collapsed && (
        <div className="px-6 pb-6">
          <div className="space-y-6">
            {packages.map((pkg, index) => (
              <div key={pkg.id} className="border border-gray-200 rounded-lg p-4">
                <div className="text-center text-gray-500">
                  Paquete: {pkg.name}
                  <br />
                  {pkg.catalogs.length} catálogos incluidos
                </div>
              </div>
            ))}
            
            {packages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay paquetes definidos.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}