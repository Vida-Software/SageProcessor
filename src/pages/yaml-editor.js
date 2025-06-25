import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';

// Component definitions
const GeneralYamlSection = ({ data, onChange }) => (
  <div className="space-y-4">
    <h4 className="text-lg font-medium text-gray-900">Información General</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input
          type="text"
          value={data.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Nombre de la configuración"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Versión</label>
        <input
          type="text"
          value={data.version || ''}
          onChange={(e) => onChange('version', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="1.0.0"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
        <input
          type="text"
          value={data.author || ''}
          onChange={(e) => onChange('author', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Autor"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Descripción"
          rows="3"
        />
      </div>
    </div>
  </div>
);

const CatalogsYamlSection = ({ catalogs, onAdd, onUpdate, onDelete, dataTypes, fileTypes, severityTypes }) => {
  const [expandedCatalog, setExpandedCatalog] = React.useState(null);
  const [expandedField, setExpandedField] = React.useState(null);

  const toggleCatalog = (index) => {
    setExpandedCatalog(expandedCatalog === index ? null : index);
    setExpandedField(null);
  };

  const toggleField = (catalogIndex, fieldIndex) => {
    const key = `${catalogIndex}-${fieldIndex}`;
    setExpandedField(expandedField === key ? null : key);
  };

  const addField = (catalogIndex) => {
    const catalog = catalogs[catalogIndex];
    const newField = {
      name: `Campo ${(catalog.fields?.length || 0) + 1}`,
      type: 'texto',
      required: false,
      description: '',
      validations: []
    };
    const updatedCatalog = {
      ...catalog,
      fields: [...(catalog.fields || []), newField]
    };
    onUpdate(catalogIndex, updatedCatalog);
  };

  const updateField = (catalogIndex, fieldIndex, updatedField) => {
    const catalog = catalogs[catalogIndex];
    const updatedFields = [...catalog.fields];
    updatedFields[fieldIndex] = updatedField;
    const updatedCatalog = {
      ...catalog,
      fields: updatedFields
    };
    onUpdate(catalogIndex, updatedCatalog);
  };

  const deleteField = (catalogIndex, fieldIndex) => {
    const catalog = catalogs[catalogIndex];
    const updatedFields = catalog.fields.filter((_, i) => i !== fieldIndex);
    const updatedCatalog = {
      ...catalog,
      fields: updatedFields
    };
    onUpdate(catalogIndex, updatedCatalog);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium text-gray-900">Catálogos</h4>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Agregar Catálogo
        </button>
      </div>
      
      {catalogs.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay catálogos configurados</p>
      ) : (
        <div className="space-y-4">
          {catalogs.map((catalog, catalogIndex) => (
            <div key={catalogIndex} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={catalog.name || ''}
                      onChange={(e) => onUpdate(catalogIndex, { ...catalog, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={catalog.description || ''}
                      onChange={(e) => onUpdate(catalogIndex, { ...catalog, description: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => toggleCatalog(catalogIndex)}
                    className="p-2 text-blue-600 hover:text-blue-800"
                  >
                    {expandedCatalog === catalogIndex ? 'Ocultar' : 'Campos'}
                  </button>
                  <button
                    onClick={() => onDelete(catalogIndex)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between items-center">
                  <h5 className="text-sm font-medium text-gray-700">
                    Campos ({catalog.fields?.length || 0})
                  </h5>
                  {expandedCatalog === catalogIndex && (
                    <button
                      onClick={() => addField(catalogIndex)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Agregar Campo
                    </button>
                  )}
                </div>
                
                {expandedCatalog === catalogIndex && (
                  <div className="mt-4 space-y-3">
                    {catalog.fields?.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="border border-gray-100 rounded p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">{field.name}</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleField(catalogIndex, fieldIndex)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              {expandedField === `${catalogIndex}-${fieldIndex}` ? 'Ocultar' : 'Editar'}
                            </button>
                            <button
                              onClick={() => deleteField(catalogIndex, fieldIndex)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                        
                        {expandedField === `${catalogIndex}-${fieldIndex}` && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                              <input
                                type="text"
                                value={field.name || ''}
                                onChange={(e) => updateField(catalogIndex, fieldIndex, { ...field, name: e.target.value })}
                                className="w-full p-2 text-sm border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                              <select
                                value={field.type || 'texto'}
                                onChange={(e) => updateField(catalogIndex, fieldIndex, { ...field, type: e.target.value })}
                                className="w-full p-2 text-sm border border-gray-300 rounded-md"
                              >
                                {dataTypes.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                              <input
                                type="text"
                                value={field.description || ''}
                                onChange={(e) => updateField(catalogIndex, fieldIndex, { ...field, description: e.target.value })}
                                className="w-full p-2 text-sm border border-gray-300 rounded-md"
                              />
                            </div>
                            <div className="flex items-center">
                              <label className="flex items-center text-xs font-medium text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={field.required || false}
                                  onChange={(e) => updateField(catalogIndex, fieldIndex, { ...field, required: e.target.checked })}
                                  className="mr-2"
                                />
                                Campo requerido
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PackageYamlSection = ({ packageData, catalogs, onChange, fileTypes }) => (
  <div className="space-y-4">
    <h4 className="text-lg font-medium text-gray-900">Configuración del Paquete</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input
          type="text"
          value={packageData.name || ''}
          onChange={(e) => onChange({ ...packageData, name: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <input
          type="text"
          value={packageData.description || ''}
          onChange={(e) => onChange({ ...packageData, description: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Formato de Archivo</label>
        <select
          value={packageData.file_format?.type || 'ZIP'}
          onChange={(e) => onChange({ ...packageData, file_format: { type: e.target.value } })}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          {fileTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

export default function YAMLEditorPage() {
  // State management
  const [activeSection, setActiveSection] = useState('general');
  const [showYamlPreview, setShowYamlPreview] = useState(false);
  const [loadError, setLoadError] = useState('');

  // YAML configuration state
  const [sageYamlData, setSageYamlData] = useState({
    name: "Configuración SAGE",
    description: "",
    version: "1.0.0",
    author: "SAGE",
    comments: ""
  });

  const [catalogs, setCatalogs] = useState([]);
  const [packageData, setPackageData] = useState({
    name: "Paquete Principal",
    description: "",
    catalogs: [],
    file_format: { type: "ZIP" }
  });

  // Data types for form options
  const dataTypes = [
    { value: 'texto', label: 'Texto' },
    { value: 'numero', label: 'Número' },
    { value: 'fecha', label: 'Fecha' },
    { value: 'booleano', label: 'Booleano' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' }
  ];

  const fileTypes = [
    { value: 'CSV', label: 'CSV' },
    { value: 'EXCEL', label: 'Excel' },
    { value: 'ZIP', label: 'ZIP' },
    { value: 'JSON', label: 'JSON' }
  ];

  const severityTypes = [
    { value: 'error', label: 'Error' },
    { value: 'warning', label: 'Advertencia' }
  ];

  // YAML Parser using js-yaml (syntactic, not positional)
  const parseYamlContent = (yamlText) => {
    try {
      console.log('🔍 Iniciando parser sintáctico YAML...');
      
      // Use js-yaml for proper syntactic parsing
      const parsedYaml = yaml.load(yamlText);
      console.log("📋 YAML parseado:", parsedYaml);
      
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

      // Process sage_yaml if exists
      if (parsedYaml.sage_yaml) {
        result.sage_yaml = {
          ...result.sage_yaml,
          ...parsedYaml.sage_yaml
        };
      }

      // Process catalogs - handle both array and object formats
      if (parsedYaml.catalogs) {
        let catalogsToProcess = [];
        
        if (Array.isArray(parsedYaml.catalogs)) {
          // Array format: [catalog1, catalog2, ...]
          catalogsToProcess = parsedYaml.catalogs;
          console.log(`📂 Procesando ${catalogsToProcess.length} catálogos (formato array)...`);
        } else if (typeof parsedYaml.catalogs === 'object') {
          // Object format: { "productos": {...}, "clientes": {...} }
          catalogsToProcess = Object.entries(parsedYaml.catalogs).map(([key, catalog]) => ({
            ...catalog,
            name: catalog.name || key, // Use key as fallback name
            _catalogKey: key
          }));
          console.log(`📂 Procesando ${catalogsToProcess.length} catálogos (formato objeto)...`);
        }
        
        catalogsToProcess.forEach((catalog, catalogIndex) => {
          console.log(`📁 Catálogo ${catalogIndex + 1}:`, catalog.name || catalog.catalog_name || 'Sin nombre');
          
          const catalogData = {
            name: catalog.name || catalog.catalog_name || `Catálogo ${catalogIndex + 1}`,
            description: catalog.description || "",
            fields: [],
            field_validation: [],
            row_validation: [],
            catalog_validation: []
          };

          // Process fields
          if (catalog.fields && Array.isArray(catalog.fields)) {
            console.log(`🔍 Procesando ${catalog.fields.length} campos en catálogo: ${catalogData.name}`);
            
            catalog.fields.forEach((field, fieldIndex) => {
              console.log(`📝 Campo ${fieldIndex + 1}:`, field.name || 'Sin nombre');
              
              const fieldData = {
                name: field.name || `Campo ${fieldIndex + 1}`,
                type: field.type || 'texto',
                required: field.required !== false,
                description: field.description || "",
                validations: field.validation_rules || []
              };

              catalogData.fields.push(fieldData);
            });
          }

          // Process field_validation
          if (catalog.field_validation) {
            const validations = Array.isArray(catalog.field_validation) ? catalog.field_validation : [catalog.field_validation];
            catalogData.field_validation = validations.map(v => ({
              name: v.name || "Validación sin nombre",
              description: v.description || "",
              rule: v.rule || "",
              severity: v.severity || "error"
            }));
          }

          // Process row_validation
          if (catalog.row_validation) {
            const validations = Array.isArray(catalog.row_validation) ? catalog.row_validation : [catalog.row_validation];
            catalogData.row_validation = validations.map(v => ({
              name: v.name || "Validación sin nombre",
              description: v.description || "",
              rule: v.rule || "",
              severity: v.severity || "error"
            }));
          }

          // Process catalog_validation
          if (catalog.catalog_validation) {
            const validations = Array.isArray(catalog.catalog_validation) ? catalog.catalog_validation : [catalog.catalog_validation];
            catalogData.catalog_validation = validations.map(v => ({
              name: v.name || "Validación sin nombre",
              description: v.description || "",
              rule: v.rule || "",
              severity: v.severity || "error"
            }));
          }

          result.catalogs.push(catalogData);
        });
      }

      // Process package/packages
      if (parsedYaml.package || parsedYaml.packages) {
        const packageData = parsedYaml.package || (parsedYaml.packages && parsedYaml.packages[0]);
        if (packageData) {
          result.package = {
            name: packageData.name || "Paquete Principal",
            description: packageData.description || "",
            catalogs: packageData.catalogs || [],
            file_format: packageData.file_format || { type: "ZIP" },
            package_validation: []
          };

          // Process package_validation
          if (packageData.package_validation) {
            const validations = Array.isArray(packageData.package_validation) ? packageData.package_validation : [packageData.package_validation];
            result.package.package_validation = validations.map(v => ({
              name: v.name || "Validación sin nombre",
              description: v.description || "",
              rule: v.rule || "",
              severity: v.severity || "error"
            }));
          }
        }
      }

      console.log("✅ Parser completado. Catálogos encontrados:", result.catalogs.length);
      if (result.catalogs.length > 0) {
        console.log("📊 Primer catálogo:", result.catalogs[0].name, "con", result.catalogs[0].fields.length, "campos");
        if (result.catalogs[0].fields.length > 0) {
          result.catalogs[0].fields.forEach((field, index) => {
            console.log(`🔸 Campo ${index + 1}: ${field.name} (${field.type}), validaciones: ${field.validations?.length || 0}`);
          });
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Error parsing YAML:', error);
      return null;
    }
  };

  // Load YAML file handler
  const handleLoadYaml = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const yamlText = e.target.result;
        console.log('📁 Loading YAML file...');
        
        // Use the proper syntactic parser
        const result = parseYamlContent(yamlText);
        if (result) {
          setSageYamlData(result.sage_yaml || {});
          setCatalogs(result.catalogs || []);
          setPackageData(result.package || {});
          setLoadError('');
          console.log('✅ YAML loaded successfully:', result.catalogs.length, 'catalogs found');
        } else {
          setLoadError('Error parsing YAML file');
        }
      } catch (error) {
        console.error('❌ Error loading YAML:', error);
        setLoadError('Error reading YAML file: ' + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Catalog management
  const addCatalog = () => {
    const newCatalog = {
      id: Date.now(),
      name: `Catálogo ${catalogs.length + 1}`,
      description: "",
      fields: [],
      field_validation: [],
      row_validation: [],
      catalog_validation: []
    };
    setCatalogs([...catalogs, newCatalog]);
  };

  const updateCatalog = (index, updatedCatalog) => {
    const newCatalogs = [...catalogs];
    newCatalogs[index] = updatedCatalog;
    setCatalogs(newCatalogs);
  };

  const deleteCatalog = (index) => {
    const newCatalogs = catalogs.filter((_, i) => i !== index);
    setCatalogs(newCatalogs);
  };

  // SAGE YAML data handler
  const handleSageYamlChange = (field, value) => {
    setSageYamlData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Generate YAML output
  const generateYamlOutput = () => {
    return {
      sage_yaml: sageYamlData,
      catalogs: catalogs,
      packages: [packageData]
    };
  };

  // Generate YAML string
  const generateYamlString = (data) => {
    try {
      return yaml.dump(data, { 
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      });
    } catch (error) {
      console.error('Error generating YAML:', error);
      return '# Error generating YAML';
    }
  };

  // Export YAML
  const exportYaml = () => {
    const yamlData = generateYamlOutput();
    const yamlString = generateYamlString(yamlData);
    
    const blob = new Blob([yamlString], { type: 'text/yaml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${sageYamlData.name || 'configuracion'}.yaml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Main YAML Editor Component
  const YAMLEditor = () => {
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
                onChange={handleLoadYaml}
                className="hidden"
                id="yaml-file-input"
              />
              <label
                htmlFor="yaml-file-input"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                Cargar YAML
              </label>
            </div>
            <button
              onClick={() => setShowYamlPreview(!showYamlPreview)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {showYamlPreview ? 'Ocultar' : 'Ver'} YAML
            </button>
            <button
              onClick={exportYaml}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Exportar YAML
            </button>
          </div>
        </div>

        {/* Error de carga */}
        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
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
                {section === 'catalogs' && `Catálogos (${catalogs.length})`}
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
              data={sageYamlData}
              onChange={handleSageYamlChange}
            />
          )}

          {activeSection === 'catalogs' && (
            <CatalogsYamlSection 
              catalogs={catalogs}
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
              packageData={packageData}
              catalogs={catalogs}
              onChange={(updatedPackage) => setPackageData(updatedPackage)}
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

    const validateYaml = () => {
      try {
        const parsed = yaml.load(yamlText);
        setValidationResult({ valid: true, data: parsed });
      } catch (error) {
        setValidationResult({ valid: false, error: error.message });
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Validador YAML</h3>
          <p className="text-sm text-gray-600">Valida la sintaxis de tu YAML</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texto YAML
          </label>
          <textarea
            value={yamlText}
            onChange={(e) => setYamlText(e.target.value)}
            className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm"
            placeholder="Pega tu YAML aquí..."
          />
        </div>
        
        <button
          onClick={validateYaml}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Validar YAML
        </button>
        
        {validationResult && (
          <div className={`p-4 rounded-md ${validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {validationResult.valid ? (
              <div>
                <h4 className="text-sm font-medium text-green-800">YAML Válido</h4>
                <pre className="text-sm text-green-700 mt-2 overflow-x-auto">
                  {JSON.stringify(validationResult.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium text-red-800">Error de Sintaxis</h4>
                <p className="text-sm text-red-700 mt-1">{validationResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Editor YAML Completo</h1>
              <p className="mt-2 text-sm text-gray-600">
                Sistema completo para crear y editar configuraciones YAML según la especificación SAGE
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <YAMLEditor />
              </div>
              <div className="lg:col-span-1">
                <YAMLValidator />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}