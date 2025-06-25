// ARCHIVO BORRADO - USAR yaml-editor-new.js

export default function YAMLEditorComplete() {
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

  // Parser YAML completo según especificación SAGE
  const parseYamlContent = (yamlContent) => {
    try {
      const lines = yamlContent.split('\n');
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

      let currentSection = null;
      let currentCatalog = null;
      let currentPackage = null;
      let currentField = null;
      let currentValidationRule = null;
      let currentContext = null;
      let validationLevel = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const indent = line.length - line.trimStart().length;
        
        if (!trimmed || trimmed.startsWith('#')) continue;

        // Secciones principales
        if (trimmed.startsWith('sage_yaml:')) {
          currentSection = 'sage_yaml';
          currentContext = null;
          continue;
        } else if (trimmed.startsWith('catalogs:')) {
          currentSection = 'catalogs';
          currentContext = null;
          continue;
        } else if (trimmed.startsWith('packages:')) {
          currentSection = 'packages';
          currentContext = null;
          continue;
        }

        // Parsear sage_yaml
        if (currentSection === 'sage_yaml' && trimmed.includes(':')) {
          const [key, ...valueParts] = trimmed.split(':');
          let value = valueParts.join(':').trim();
          value = value.replace(/^["']|["']$/g, '');
          if (key && value) {
            result.sage_yaml[key.trim()] = value;
          }
        }

        // Parsear catalogs
        else if (currentSection === 'catalogs') {
          // Nuevo catálogo
          if (indent <= 2 && trimmed.includes(':') && !trimmed.includes(' ')) {
            const catalogKey = trimmed.replace(':', '').trim();
            currentCatalog = {
              id: catalogKey,
              name: catalogKey,
              description: '',
              filename: '',
              file_format: { type: 'CSV', delimiter: ',', header: true },
              fields: [],
              row_validation: [],
              catalog_validation: []
            };
            result.catalogs.push(currentCatalog);
            currentContext = null;
            currentField = null;
            continue;
          }

          if (!currentCatalog) continue;

          // Propiedades del catálogo
          if (indent <= 4 && trimmed.includes(':')) {
            const [key, ...valueParts] = trimmed.split(':');
            const keyTrimmed = key.trim();
            let value = valueParts.join(':').trim();
            value = value.replace(/^["']|["']$/g, '');

            if (keyTrimmed === 'name') {
              currentCatalog.name = value;
            } else if (keyTrimmed === 'description') {
              currentCatalog.description = value;
            } else if (keyTrimmed === 'filename') {
              currentCatalog.filename = value;
            } else if (keyTrimmed === 'file_format') {
              currentContext = 'file_format';
            } else if (keyTrimmed === 'fields') {
              currentContext = 'fields';
              currentField = null;
            } else if (keyTrimmed === 'row_validation') {
              currentContext = 'row_validation';
              validationLevel = 'row';
            } else if (keyTrimmed === 'catalog_validation') {
              currentContext = 'catalog_validation';
              validationLevel = 'catalog';
            } else if (keyTrimmed === 'type' && currentContext === 'file_format') {
              currentCatalog.file_format.type = value;
            } else if (keyTrimmed === 'delimiter' && currentContext === 'file_format') {
              currentCatalog.file_format.delimiter = value;
            } else if (keyTrimmed === 'header' && currentContext === 'file_format') {
              currentCatalog.file_format.header = value === 'true';
            }
          }

          // Nuevo campo (con guión)
          else if (currentContext === 'fields' && trimmed.startsWith('- ') && indent >= 4) {
            const fieldData = trimmed.substring(2).trim();
            if (fieldData.includes(':')) {
              const [key, ...valueParts] = fieldData.split(':');
              let value = valueParts.join(':').trim();
              value = value.replace(/^["']|["']$/g, '');
              
              if (key.trim() === 'name') {
                currentField = {
                  name: value,
                  type: 'texto',
                  required: false,
                  unique: false,
                  description: '',
                  defaultValue: '',
                  validation_rules: []
                };
                currentCatalog.fields.push(currentField);
                validationLevel = null; // Reset validation level for new field
              }
            }
          }

          // Propiedades del campo (cualquier propiedad de nivel de campo)
          else if (currentField && currentContext === 'fields' && indent >= 6 && trimmed.includes(':') && !trimmed.startsWith('- ')) {
            const [key, ...valueParts] = trimmed.split(':');
            const keyTrimmed = key.trim();
            let value = valueParts.join(':').trim();
            value = value.replace(/^["']|["']$/g, '');

            if (keyTrimmed === 'type') {
              currentField.type = value;
            } else if (keyTrimmed === 'required') {
              currentField.required = value === 'true';
            } else if (keyTrimmed === 'unique') {
              currentField.unique = value === 'true';
            } else if (keyTrimmed === 'description') {
              currentField.description = value;
            } else if (keyTrimmed === 'defaultValue') {
              currentField.defaultValue = value;
            } else if (keyTrimmed === 'validation_rules') {
              validationLevel = 'field';
              // No cambiar currentContext aquí, mantenerlo como 'fields'
            }
          }

          // Validaciones de campo (dentro de validation_rules del campo)
          else if (validationLevel === 'field' && currentField && currentContext === 'fields' && trimmed.startsWith('- ') && indent >= 8) {
            const validationData = trimmed.substring(2).trim();
            if (validationData.includes(':')) {
              const [key, ...valueParts] = validationData.split(':');
              let value = valueParts.join(':').trim();
              value = value.replace(/^["']|["']$/g, '');
              
              if (key.trim() === 'name') {
                currentValidationRule = {
                  name: value,
                  description: '',
                  rule: '',
                  severity: 'error'
                };
                currentField.validation_rules.push(currentValidationRule);
              }
            }
          }

          // Propiedades de validaciones de campo
          else if (currentValidationRule && validationLevel === 'field' && currentContext === 'fields' && indent >= 10 && trimmed.includes(':') && !trimmed.startsWith('- ')) {
            const [key, ...valueParts] = trimmed.split(':');
            const keyTrimmed = key.trim();
            let value = valueParts.join(':').trim();
            value = value.replace(/^["']|["']$/g, '');

            if (keyTrimmed === 'description') {
              currentValidationRule.description = value;
            } else if (keyTrimmed === 'rule') {
              currentValidationRule.rule = value;
            } else if (keyTrimmed === 'severity') {
              currentValidationRule.severity = value.toLowerCase();
            }
          }

          // Validaciones de catálogo (row_validation y catalog_validation)
          else if ((currentContext === 'row_validation' || currentContext === 'catalog_validation') && trimmed.startsWith('- ')) {
            const validationData = trimmed.substring(2).trim();
            if (validationData.includes(':')) {
              const [key, ...valueParts] = validationData.split(':');
              let value = valueParts.join(':').trim();
              value = value.replace(/^["']|["']$/g, '');
              
              if (key.trim() === 'name') {
                currentValidationRule = {
                  name: value,
                  description: '',
                  rule: '',
                  severity: 'error'
                };
                
                if (validationLevel === 'row' && currentCatalog) {
                  currentCatalog.row_validation.push(currentValidationRule);
                } else if (validationLevel === 'catalog' && currentCatalog) {
                  currentCatalog.catalog_validation.push(currentValidationRule);
                }
              }
            }
          }

          // Propiedades de validaciones de catálogo
          else if (currentValidationRule && (currentContext === 'row_validation' || currentContext === 'catalog_validation') && indent > 8 && trimmed.includes(':')) {
            const [key, ...valueParts] = trimmed.split(':');
            const keyTrimmed = key.trim();
            let value = valueParts.join(':').trim();
            value = value.replace(/^["']|["']$/g, '');

            if (keyTrimmed === 'description') {
              currentValidationRule.description = value;
            } else if (keyTrimmed === 'rule') {
              currentValidationRule.rule = value;
            } else if (keyTrimmed === 'severity') {
              currentValidationRule.severity = value.toLowerCase();
            }
          }
        }

        // Parsear packages
        else if (currentSection === 'packages') {
          // Nuevo paquete
          if (indent <= 2 && trimmed.includes(':') && !trimmed.includes(' ')) {
            const packageKey = trimmed.replace(':', '').trim();
            currentPackage = {
              id: packageKey,
              name: packageKey,
              description: '',
              catalogs: [],
              file_format: { type: 'ZIP' },
              package_validation: []
            };
            result.packages.push(currentPackage);
            continue;
          }

          if (!currentPackage) continue;

          // Propiedades del paquete
          if (indent <= 4 && trimmed.includes(':')) {
            const [key, ...valueParts] = trimmed.split(':');
            const keyTrimmed = key.trim();
            let value = valueParts.join(':').trim();
            value = value.replace(/^["']|["']$/g, '');

            if (keyTrimmed === 'name') {
              currentPackage.name = value;
            } else if (keyTrimmed === 'description') {
              currentPackage.description = value;
            } else if (keyTrimmed === 'file_format') {
              currentContext = 'package_file_format';
            } else if (keyTrimmed === 'catalogs') {
              currentContext = 'package_catalogs';
            } else if (keyTrimmed === 'package_validation') {
              currentContext = 'package_validation';
              validationLevel = 'package';
            } else if (keyTrimmed === 'type' && currentContext === 'package_file_format') {
              currentPackage.file_format.type = value;
            }
          }

          // Catálogos del paquete
          else if (currentContext === 'package_catalogs' && trimmed.startsWith('- ')) {
            const catalogName = trimmed.substring(2).trim().replace(/^["']|["']$/g, '');
            currentPackage.catalogs.push(catalogName);
          }

          // Validaciones de paquete
          else if (currentContext === 'package_validation' && trimmed.startsWith('- ')) {
            const validationData = trimmed.substring(2).trim();
            if (validationData.includes(':')) {
              const [key, ...valueParts] = validationData.split(':');
              let value = valueParts.join(':').trim();
              value = value.replace(/^["']|["']$/g, '');
              
              if (key.trim() === 'name') {
                currentValidationRule = {
                  name: value,
                  description: '',
                  rule: '',
                  severity: 'error'
                };
                currentPackage.package_validation.push(currentValidationRule);
              }
            }
          }

          // Propiedades de validaciones de paquete
          else if (currentValidationRule && currentContext === 'package_validation' && indent > 8 && trimmed.includes(':')) {
            const [key, ...valueParts] = trimmed.split(':');
            const keyTrimmed = key.trim();
            let value = valueParts.join(':').trim();
            value = value.replace(/^["']|["']$/g, '');

            if (keyTrimmed === 'description') {
              currentValidationRule.description = value;
            } else if (keyTrimmed === 'rule') {
              currentValidationRule.rule = value;
            } else if (keyTrimmed === 'severity') {
              currentValidationRule.severity = value;
            }
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
    yaml += `  name: "${yamlConfig.sage_yaml.name}"\n`;
    yaml += `  description: "${yamlConfig.sage_yaml.description}"\n`;
    yaml += `  version: "${yamlConfig.sage_yaml.version}"\n`;
    yaml += `  author: "${yamlConfig.sage_yaml.author}"\n`;
    if (yamlConfig.sage_yaml.comments) {
      yaml += `  comments: "${yamlConfig.sage_yaml.comments}"\n`;
    }
    yaml += '\n';

    // catalogs
    yaml += 'catalogs:\n';
    yamlConfig.catalogs.forEach(catalog => {
      yaml += `  ${catalog.id}:\n`;
      yaml += `    name: "${catalog.name}"\n`;
      yaml += `    description: "${catalog.description}"\n`;
      yaml += `    filename: "${catalog.filename}"\n`;
      yaml += `    file_format:\n`;
      yaml += `      type: "${catalog.file_format.type}"\n`;
      if (catalog.file_format.type === 'CSV') {
        yaml += `      delimiter: "${catalog.file_format.delimiter}"\n`;
        yaml += `      header: ${catalog.file_format.header}\n`;
      }
      
      if (catalog.fields.length > 0) {
        yaml += `    fields:\n`;
        catalog.fields.forEach(field => {
          yaml += `      - name: "${field.name}"\n`;
          yaml += `        type: "${field.type}"\n`;
          if (field.required) yaml += `        required: true\n`;
          if (field.unique) yaml += `        unique: true\n`;
          if (field.description) yaml += `        description: "${field.description}"\n`;
          if (field.defaultValue) yaml += `        defaultValue: "${field.defaultValue}"\n`;
          
          if (field.validation_rules && field.validation_rules.length > 0) {
            yaml += `        validation_rules:\n`;
            field.validation_rules.forEach(rule => {
              yaml += `          - name: "${rule.name}"\n`;
              yaml += `            description: "${rule.description}"\n`;
              yaml += `            rule: "${rule.rule}"\n`;
              yaml += `            severity: "${rule.severity}"\n`;
            });
          }
        });
      }

      if (catalog.row_validation && catalog.row_validation.length > 0) {
        yaml += `    row_validation:\n`;
        catalog.row_validation.forEach(rule => {
          yaml += `      - name: "${rule.name}"\n`;
          yaml += `        description: "${rule.description}"\n`;
          yaml += `        rule: "${rule.rule}"\n`;
          yaml += `        severity: "${rule.severity}"\n`;
        });
      }

      if (catalog.catalog_validation && catalog.catalog_validation.length > 0) {
        yaml += `    catalog_validation:\n`;
        catalog.catalog_validation.forEach(rule => {
          yaml += `      - name: "${rule.name}"\n`;
          yaml += `        description: "${rule.description}"\n`;
          yaml += `        rule: "${rule.rule}"\n`;
          yaml += `        severity: "${rule.severity}"\n`;
        });
      }
      yaml += '\n';
    });

    // packages
    yaml += 'packages:\n';
    yamlConfig.packages.forEach(pkg => {
      yaml += `  ${pkg.id}:\n`;
      yaml += `    name: "${pkg.name}"\n`;
      yaml += `    description: "${pkg.description}"\n`;
      yaml += `    file_format:\n`;
      yaml += `      type: "${pkg.file_format.type}"\n`;
      
      if (pkg.catalogs.length > 0) {
        yaml += `    catalogs:\n`;
        pkg.catalogs.forEach(catalog => {
          yaml += `      - ${catalog}\n`;
        });
      }

      if (pkg.package_validation && pkg.package_validation.length > 0) {
        yaml += `    package_validation:\n`;
        pkg.package_validation.forEach(rule => {
          yaml += `      - name: "${rule.name}"\n`;
          yaml += `        description: "${rule.description}"\n`;
          yaml += `        rule: "${rule.rule}"\n`;
          yaml += `        severity: "${rule.severity}"\n`;
        });
      }
      yaml += '\n';
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
        <title>Editor YAML SAGE - Completo</title>
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

// Componente para editar un catálogo individual
function CatalogEditor({ catalog, onChange, onDelete }) {
  const [catalogCollapsed, setCatalogCollapsed] = useState(false);

  const addField = () => {
    const newField = {
      name: "",
      type: "texto",
      required: false,
      unique: false,
      description: "",
      defaultValue: "",
      validation_rules: []
    };
    onChange({ ...catalog, fields: [...catalog.fields, newField] });
  };

  const updateField = (index, updatedField) => {
    const newFields = [...catalog.fields];
    newFields[index] = updatedField;
    onChange({ ...catalog, fields: newFields });
  };

  const deleteField = (index) => {
    const newFields = catalog.fields.filter((_, i) => i !== index);
    onChange({ ...catalog, fields: newFields });
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setCatalogCollapsed(!catalogCollapsed)}
          className="flex items-center space-x-2"
        >
          {catalogCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          <span className="font-medium">{catalog.name || 'Catálogo sin nombre'}</span>
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
      
      {!catalogCollapsed && (
        <div className="p-4 space-y-4">
          {/* Información básica del catálogo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                type="text"
                value={catalog.name}
                onChange={(e) => onChange({ ...catalog, name: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Archivo *</label>
              <input
                type="text"
                value={catalog.filename}
                onChange={(e) => onChange({ ...catalog, filename: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="archivo.csv"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción *</label>
            <textarea
              value={catalog.description}
              onChange={(e) => onChange({ ...catalog, description: e.target.value })}
              rows={2}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Formato de archivo */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Formato de Archivo</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo *</label>
                <select
                  value={catalog.file_format.type}
                  onChange={(e) => onChange({ ...catalog, file_format: { ...catalog.file_format, type: e.target.value } })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CSV">CSV</option>
                  <option value="EXCEL">EXCEL</option>
                </select>
              </div>
              {catalog.file_format.type === 'CSV' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delimitador</label>
                    <input
                      type="text"
                      value={catalog.file_format.delimiter}
                      onChange={(e) => onChange({ ...catalog, file_format: { ...catalog.file_format, delimiter: e.target.value } })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder=","
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Encabezados</label>
                    <select
                      value={catalog.file_format.header}
                      onChange={(e) => onChange({ ...catalog, file_format: { ...catalog.file_format, header: e.target.value === 'true' } })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Campos ({catalog.fields.length})</h4>
              <button
                onClick={addField}
                className="inline-flex items-center px-2 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Agregar Campo
              </button>
            </div>
            
            <div className="space-y-3">
              {catalog.fields.map((field, index) => (
                <FieldEditor
                  key={index}
                  field={field}
                  onChange={(updated) => updateField(index, updated)}
                  onDelete={() => deleteField(index)}
                />
              ))}
            </div>
          </div>

          {/* Validaciones */}
          <ValidationSection
            catalog={catalog}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
}

// Componente para editar campos
function FieldEditor({ field, onChange, onDelete }) {
  const [fieldCollapsed, setFieldCollapsed] = useState(true);

  return (
    <div className="border border-gray-200 rounded bg-gray-50">
      <div className="px-3 py-2 flex items-center justify-between">
        <button
          onClick={() => setFieldCollapsed(!fieldCollapsed)}
          className="flex items-center space-x-2 flex-1 text-left"
        >
          {fieldCollapsed ? <ChevronRightIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
          <span className="text-sm font-medium">{field.name || 'Campo sin nombre'} ({field.type})</span>
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800"
        >
          <TrashIcon className="h-3 w-3" />
        </button>
      </div>
      
      {!fieldCollapsed && (
        <div className="px-3 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Nombre *</label>
              <input
                type="text"
                value={field.name}
                onChange={(e) => onChange({ ...field, name: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Tipo *</label>
              <select
                value={field.type}
                onChange={(e) => onChange({ ...field, type: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="texto">texto</option>
                <option value="decimal">decimal</option>
                <option value="entero">entero</option>
                <option value="fecha">fecha</option>
                <option value="booleano">booleano</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700">Descripción</label>
            <input
              type="text"
              value={field.description}
              onChange={(e) => onChange({ ...field, description: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onChange({ ...field, required: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Requerido</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.unique}
                onChange={(e) => onChange({ ...field, unique: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Único</span>
            </label>
          </div>

          {/* Validaciones del campo */}
          <FieldValidationRules
            field={field}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
}

// Componente para validaciones de campo
function FieldValidationRules({ field, onChange }) {
  const [rulesCollapsed, setRulesCollapsed] = useState(true);

  const addValidationRule = () => {
    const newRule = {
      name: "",
      description: "",
      rule: "",
      severity: "error"
    };
    onChange({ ...field, validation_rules: [...field.validation_rules, newRule] });
  };

  const updateValidationRule = (index, updatedRule) => {
    const newRules = [...field.validation_rules];
    newRules[index] = updatedRule;
    onChange({ ...field, validation_rules: newRules });
  };

  const deleteValidationRule = (index) => {
    const newRules = field.validation_rules.filter((_, i) => i !== index);
    onChange({ ...field, validation_rules: newRules });
  };

  return (
    <div className="border-t pt-3">
      <button
        onClick={() => setRulesCollapsed(!rulesCollapsed)}
        className="flex items-center space-x-2 text-sm font-medium text-gray-700"
      >
        {rulesCollapsed ? <ChevronRightIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
        <span>Validaciones ({field.validation_rules.length})</span>
      </button>
      
      {!rulesCollapsed && (
        <div className="mt-2 space-y-2">
          <button
            onClick={addValidationRule}
            className="inline-flex items-center px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
          >
            <PlusIcon className="h-3 w-3 mr-1" />
            Agregar Validación
          </button>
          
          {field.validation_rules.map((rule, index) => (
            <ValidationRuleEditor
              key={index}
              rule={rule}
              onChange={(updated) => updateValidationRule(index, updated)}
              onDelete={() => deleteValidationRule(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Componente para editar reglas de validación
function ValidationRuleEditor({ rule, onChange, onDelete }) {
  return (
    <div className="bg-white border border-gray-200 rounded p-2 space-y-2">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={rule.name}
          onChange={(e) => onChange({ ...rule, name: e.target.value })}
          className="flex-1 border-gray-300 rounded text-xs"
          placeholder="Nombre de la validación"
        />
        <button
          onClick={onDelete}
          className="ml-2 text-red-600 hover:text-red-800"
        >
          <TrashIcon className="h-3 w-3" />
        </button>
      </div>
      
      <textarea
        value={rule.description}
        onChange={(e) => onChange({ ...rule, description: e.target.value })}
        rows={2}
        className="w-full border-gray-300 rounded text-xs"
        placeholder="Descripción del error (ej: ¡Ops! El código no es válido 😅)"
      />
      
      <textarea
        value={rule.rule}
        onChange={(e) => onChange({ ...rule, rule: e.target.value })}
        rows={2}
        className="w-full border-gray-300 rounded text-xs font-mono"
        placeholder="Regla pandas (ej: df['codigo'].notnull())"
      />
      
      <select
        value={rule.severity}
        onChange={(e) => onChange({ ...rule, severity: e.target.value })}
        className="w-full border-gray-300 rounded text-xs"
      >
        <option value="error">Error</option>
        <option value="warning">Warning</option>
      </select>
    </div>
  );
}

// Componente para validaciones de catálogo
function ValidationSection({ catalog, onChange }) {
  const [validationCollapsed, setValidationCollapsed] = useState(true);

  const addRowValidation = () => {
    const newValidation = {
      name: "",
      description: "",
      rule: "",
      severity: "error"
    };
    onChange({ ...catalog, row_validation: [...catalog.row_validation, newValidation] });
  };

  const addCatalogValidation = () => {
    const newValidation = {
      name: "",
      description: "",
      rule: "",
      severity: "error"
    };
    onChange({ ...catalog, catalog_validation: [...catalog.catalog_validation, newValidation] });
  };

  return (
    <div className="border-t pt-4">
      <button
        onClick={() => setValidationCollapsed(!validationCollapsed)}
        className="flex items-center space-x-2 font-medium text-gray-700 mb-3"
      >
        {validationCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        <span>Validaciones de Catálogo</span>
      </button>
      
      {!validationCollapsed && (
        <div className="space-y-4">
          {/* Row Validation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium">Validaciones de Fila ({catalog.row_validation.length})</h5>
              <button
                onClick={addRowValidation}
                className="inline-flex items-center px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Agregar
              </button>
            </div>
            <div className="space-y-2">
              {catalog.row_validation.map((rule, index) => (
                <ValidationRuleEditor
                  key={index}
                  rule={rule}
                  onChange={(updated) => {
                    const newValidations = [...catalog.row_validation];
                    newValidations[index] = updated;
                    onChange({ ...catalog, row_validation: newValidations });
                  }}
                  onDelete={() => {
                    const newValidations = catalog.row_validation.filter((_, i) => i !== index);
                    onChange({ ...catalog, row_validation: newValidations });
                  }}
                />
              ))}
            </div>
          </div>

          {/* Catalog Validation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium">Validaciones de Catálogo ({catalog.catalog_validation.length})</h5>
              <button
                onClick={addCatalogValidation}
                className="inline-flex items-center px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Agregar
              </button>
            </div>
            <div className="space-y-2">
              {catalog.catalog_validation.map((rule, index) => (
                <ValidationRuleEditor
                  key={index}
                  rule={rule}
                  onChange={(updated) => {
                    const newValidations = [...catalog.catalog_validation];
                    newValidations[index] = updated;
                    onChange({ ...catalog, catalog_validation: newValidations });
                  }}
                  onDelete={() => {
                    const newValidations = catalog.catalog_validation.filter((_, i) => i !== index);
                    onChange({ ...catalog, catalog_validation: newValidations });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para la sección de Paquetes
function PackagesSection({ packages, catalogs, onChange, collapsed, onToggle }) {
  const addPackage = () => {
    const newPackage = {
      id: `package_${Date.now()}`,
      name: "Nuevo Paquete",
      description: "",
      catalogs: [],
      file_format: { type: "ZIP" },
      package_validation: []
    };
    onChange([...packages, newPackage]);
  };

  const updatePackage = (index, updatedPackage) => {
    const newPackages = [...packages];
    newPackages[index] = updatedPackage;
    onChange(newPackages);
  };

  const deletePackage = (index) => {
    const newPackages = packages.filter((_, i) => i !== index);
    onChange(newPackages);
  };

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
          <div className="mb-4">
            <button
              onClick={addPackage}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Paquete
            </button>
          </div>
          
          <div className="space-y-6">
            {packages.map((pkg, index) => (
              <PackageEditor
                key={pkg.id}
                package={pkg}
                catalogs={catalogs}
                onChange={(updated) => updatePackage(index, updated)}
                onDelete={() => deletePackage(index)}
              />
            ))}
            
            {packages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay paquetes definidos. Haz clic en "Agregar Paquete" para comenzar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para editar un paquete individual
function PackageEditor({ package: pkg, catalogs, onChange, onDelete }) {
  const [packageCollapsed, setPackageCollapsed] = useState(false);

  const toggleCatalogInPackage = (catalogId) => {
    const newCatalogs = pkg.catalogs.includes(catalogId)
      ? pkg.catalogs.filter(id => id !== catalogId)
      : [...pkg.catalogs, catalogId];
    onChange({ ...pkg, catalogs: newCatalogs });
  };

  const addPackageValidation = () => {
    const newValidation = {
      name: "",
      description: "",
      rule: "",
      severity: "error"
    };
    onChange({ ...pkg, package_validation: [...pkg.package_validation, newValidation] });
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setPackageCollapsed(!packageCollapsed)}
          className="flex items-center space-x-2"
        >
          {packageCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          <span className="font-medium">{pkg.name || 'Paquete sin nombre'}</span>
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
      
      {!packageCollapsed && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              type="text"
              value={pkg.name}
              onChange={(e) => onChange({ ...pkg, name: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción *</label>
            <textarea
              value={pkg.description}
              onChange={(e) => onChange({ ...pkg, description: e.target.value })}
              rows={2}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Archivo</label>
            <select
              value={pkg.file_format.type}
              onChange={(e) => onChange({ ...pkg, file_format: { ...pkg.file_format, type: e.target.value } })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ZIP">ZIP</option>
              <option value="CSV">CSV</option>
              <option value="EXCEL">EXCEL</option>
            </select>
          </div>

          {/* Selección de catálogos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catálogos Incluidos</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {catalogs.map(catalog => (
                <label key={catalog.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={pkg.catalogs.includes(catalog.id)}
                    onChange={() => toggleCatalogInPackage(catalog.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{catalog.name}</span>
                </label>
              ))}
              {catalogs.length === 0 && (
                <div className="text-sm text-gray-500">No hay catálogos disponibles</div>
              )}
            </div>
          </div>

          {/* Validaciones de paquete */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Validaciones de Paquete ({pkg.package_validation.length})</h4>
              <button
                onClick={addPackageValidation}
                className="inline-flex items-center px-2 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Agregar
              </button>
            </div>
            
            <div className="space-y-2">
              {pkg.package_validation.map((rule, index) => (
                <ValidationRuleEditor
                  key={index}
                  rule={rule}
                  onChange={(updated) => {
                    const newValidations = [...pkg.package_validation];
                    newValidations[index] = updated;
                    onChange({ ...pkg, package_validation: newValidations });
                  }}
                  onDelete={() => {
                    const newValidations = pkg.package_validation.filter((_, i) => i !== index);
                    onChange({ ...pkg, package_validation: newValidations });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}