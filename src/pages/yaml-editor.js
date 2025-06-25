import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Head from 'next/head';
// Implementación simple de generación de YAML sin dependencias externas
const generateYamlString = (obj, indent = 0) => {
  const spaces = '  '.repeat(indent);
  let result = '';
  
  if (typeof obj !== 'object' || obj === null) {
    return String(obj);
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    obj.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        result += `${spaces}-\n`;
        Object.entries(item).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            result += `${spaces}  ${key}:\n`;
            result += generateYamlString(value, indent + 2) + '\n';
          } else if (Array.isArray(value)) {
            result += `${spaces}  ${key}:\n`;
            value.forEach(subItem => {
              result += `${spaces}    - ${subItem}\n`;
            });
          } else {
            const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
            result += `${spaces}  ${key}: ${valueStr}\n`;
          }
        });
      } else {
        result += `${spaces}- ${item}\n`;
      }
    });
    return result.slice(0, -1);
  }
  
  Object.entries(obj).forEach(([key, value]) => {
    // Skip empty objects and empty strings
    if (value === '' || (typeof value === 'object' && value !== null && Object.keys(value).length === 0 && !Array.isArray(value))) {
      return;
    }
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result += `${spaces}${key}:\n`;
      const nestedYaml = generateYamlString(value, indent + 1);
      if (nestedYaml.trim()) {
        result += nestedYaml + '\n';
      }
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        result += `${spaces}${key}:\n`;
        result += generateYamlString(value, indent + 1) + '\n';
      }
    } else if (value !== '') {
      const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
      result += `${spaces}${key}: ${valueStr}\n`;
    }
  });
  
  return result.slice(0, -1);
};

const YAMLEditorPage = () => {
  const router = useRouter();
  
  // Estados para manejar el YAML
  const [yamlData, setYamlData] = useState({
    sage_yaml: {
      name: '',
      description: '',
      version: '1.0.0',
      author: '',
      comments: ''
    },
    catalogs: {},
    packages: {}
  });
  
  const [activeTab, setActiveTab] = useState('general');
  const [previewMode, setPreviewMode] = useState(false);
  const [yamlOutput, setYamlOutput] = useState('');
  
  // Tipos de datos disponibles
  const dataTypes = ['texto', 'decimal', 'entero', 'fecha', 'booleano'];
  const fileTypes = ['CSV', 'EXCEL', 'ZIP'];
  const severityTypes = ['error', 'warning'];
  
  // Generar YAML de salida
  const generateYAML = () => {
    try {
      const output = generateYamlString(yamlData);
      setYamlOutput(output);
    } catch (error) {
      console.error('Error generando YAML:', error);
      setYamlOutput('Error generando YAML: ' + error.message);
    }
  };
  
  useEffect(() => {
    generateYAML();
  }, [yamlData]);
  
  // Actualizar información general
  const updateGeneral = (field, value) => {
    setYamlData(prev => ({
      ...prev,
      sage_yaml: {
        ...prev.sage_yaml,
        [field]: value
      }
    }));
  };
  
  // Agregar nuevo catálogo
  const addCatalog = () => {
    const catalogId = `catalog_${Date.now()}`;
    setYamlData(prev => ({
      ...prev,
      catalogs: {
        ...prev.catalogs,
        [catalogId]: {
          name: '',
          description: '',
          filename: '',
          file_format: {
            type: 'CSV',
            delimiter: ',',
            header: true
          },
          fields: []
        }
      }
    }));
  };
  
  // Actualizar catálogo
  const updateCatalog = (catalogId, field, value) => {
    setYamlData(prev => ({
      ...prev,
      catalogs: {
        ...prev.catalogs,
        [catalogId]: {
          ...prev.catalogs[catalogId],
          [field]: value
        }
      }
    }));
  };
  
  // Agregar campo a catálogo
  const addField = (catalogId) => {
    const fieldId = `field_${Date.now()}`;
    setYamlData(prev => ({
      ...prev,
      catalogs: {
        ...prev.catalogs,
        [catalogId]: {
          ...prev.catalogs[catalogId],
          fields: [
            ...prev.catalogs[catalogId].fields,
            {
              name: '',
              type: 'texto',
              required: false,
              unique: false
            }
          ]
        }
      }
    }));
  };
  
  // Actualizar campo
  const updateField = (catalogId, fieldIndex, field, value) => {
    setYamlData(prev => ({
      ...prev,
      catalogs: {
        ...prev.catalogs,
        [catalogId]: {
          ...prev.catalogs[catalogId],
          fields: prev.catalogs[catalogId].fields.map((f, i) => 
            i === fieldIndex ? { ...f, [field]: value } : f
          )
        }
      }
    }));
  };
  
  // Eliminar campo
  const removeField = (catalogId, fieldIndex) => {
    setYamlData(prev => ({
      ...prev,
      catalogs: {
        ...prev.catalogs,
        [catalogId]: {
          ...prev.catalogs[catalogId],
          fields: prev.catalogs[catalogId].fields.filter((_, i) => i !== fieldIndex)
        }
      }
    }));
  };
  
  // Eliminar catálogo
  const removeCatalog = (catalogId) => {
    setYamlData(prev => {
      const newCatalogs = { ...prev.catalogs };
      delete newCatalogs[catalogId];
      return {
        ...prev,
        catalogs: newCatalogs
      };
    });
  };
  
  // Agregar nuevo paquete
  const addPackage = () => {
    const packageId = `package_${Date.now()}`;
    setYamlData(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [packageId]: {
          name: '',
          description: '',
          file_format: {
            type: 'ZIP'
          },
          catalogs: []
        }
      }
    }));
  };
  
  // Actualizar paquete
  const updatePackage = (packageId, field, value) => {
    setYamlData(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [packageId]: {
          ...prev.packages[packageId],
          [field]: value
        }
      }
    }));
  };
  
  // Eliminar paquete
  const removePackage = (packageId) => {
    setYamlData(prev => {
      const newPackages = { ...prev.packages };
      delete newPackages[packageId];
      return {
        ...prev,
        packages: newPackages
      };
    });
  };
  
  // Guardar YAML
  const saveYAML = () => {
    const element = document.createElement('a');
    const file = new Blob([yamlOutput], { type: 'text/yaml' });
    element.href = URL.createObjectURL(file);
    element.download = `${yamlData.sage_yaml.name || 'config'}.yaml`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Cargar YAML (funcionalidad básica)
  const loadYAML = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // Para esta implementación, el usuario debe pegar el contenido manualmente
          alert('Por favor, copia el contenido del archivo YAML y pégalo en la vista previa para editarlo manualmente.');
        } catch (error) {
          alert('Error cargando el archivo YAML: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };
  
  return (
    <>
      <Head>
        <title>YAML Editor - SAGE</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Editor Visual de YAML</h1>
            <p className="text-gray-600 mt-2">Crea y edita archivos de configuración YAML de forma visual</p>
          </div>
          
          {/* Controles principales */}
          <div className="mb-6 flex flex-wrap gap-4">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {previewMode ? 'Modo Editor' : 'Vista Previa'}
            </button>
            <button
              onClick={saveYAML}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Descargar YAML
            </button>
            <label className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer">
              Cargar YAML
              <input
                type="file"
                accept=".yaml,.yml"
                onChange={loadYAML}
                className="hidden"
              />
            </label>
          </div>
          
          {previewMode ? (
            // Vista previa del YAML
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Vista Previa del YAML</h2>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                <code>{yamlOutput}</code>
              </pre>
            </div>
          ) : (
            // Editor visual
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Navegación lateral */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Secciones</h3>
                  <nav className="space-y-2">
                    <button
                      onClick={() => setActiveTab('general')}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        activeTab === 'general' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Información General
                    </button>
                    <button
                      onClick={() => setActiveTab('catalogs')}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        activeTab === 'catalogs' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Catálogos ({Object.keys(yamlData.catalogs).length})
                    </button>
                    <button
                      onClick={() => setActiveTab('packages')}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        activeTab === 'packages' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Paquetes ({Object.keys(yamlData.packages).length})
                    </button>
                  </nav>
                </div>
              </div>
              
              {/* Contenido principal */}
              <div className="lg:col-span-3">
                {activeTab === 'general' && (
                  <GeneralSection 
                    data={yamlData.sage_yaml} 
                    updateGeneral={updateGeneral} 
                  />
                )}
                
                {activeTab === 'catalogs' && (
                  <CatalogsSection 
                    catalogs={yamlData.catalogs}
                    addCatalog={addCatalog}
                    updateCatalog={updateCatalog}
                    removeCatalog={removeCatalog}
                    addField={addField}
                    updateField={updateField}
                    removeField={removeField}
                    dataTypes={dataTypes}
                    fileTypes={fileTypes}
                  />
                )}
                
                {activeTab === 'packages' && (
                  <PackagesSection 
                    packages={yamlData.packages}
                    catalogs={yamlData.catalogs}
                    addPackage={addPackage}
                    updatePackage={updatePackage}
                    removePackage={removePackage}
                    fileTypes={fileTypes}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Componente para la sección de información general
const GeneralSection = ({ data, updateGeneral }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold mb-6">Información General (sage_yaml)</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre *
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => updateGeneral('name', e.target.value)}
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
          onChange={(e) => updateGeneral('version', e.target.value)}
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
          onChange={(e) => updateGeneral('author', e.target.value)}
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
          onChange={(e) => updateGeneral('comments', e.target.value)}
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
          onChange={(e) => updateGeneral('description', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Descripción del propósito del YAML"
        />
      </div>
    </div>
  </div>
);

// Componente para la sección de catálogos
const CatalogsSection = ({ 
  catalogs, 
  addCatalog, 
  updateCatalog, 
  removeCatalog, 
  addField, 
  updateField, 
  removeField, 
  dataTypes, 
  fileTypes 
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Catálogos</h2>
      <button
        onClick={addCatalog}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        + Agregar Catálogo
      </button>
    </div>
    
    {Object.keys(catalogs).length === 0 ? (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No hay catálogos definidos. Agrega uno para comenzar.
      </div>
    ) : (
      Object.entries(catalogs).map(([catalogId, catalog]) => (
        <CatalogEditor
          key={catalogId}
          catalogId={catalogId}
          catalog={catalog}
          updateCatalog={updateCatalog}
          removeCatalog={removeCatalog}
          addField={addField}
          updateField={updateField}
          removeField={removeField}
          dataTypes={dataTypes}
          fileTypes={fileTypes}
        />
      ))
    )}
  </div>
);

// Componente editor individual de catálogo
const CatalogEditor = ({ 
  catalogId, 
  catalog, 
  updateCatalog, 
  removeCatalog, 
  addField, 
  updateField, 
  removeField, 
  dataTypes, 
  fileTypes 
}) => {
  const [expanded, setExpanded] = useState(true);
  
  const updateFileFormat = (field, value) => {
    updateCatalog(catalogId, 'file_format', {
      ...catalog.file_format,
      [field]: value
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {expanded ? '▼' : '▶'}
            </button>
            <h3 className="text-lg font-medium">
              {catalog.name || `Catálogo ${catalogId}`}
            </h3>
          </div>
          <button
            onClick={() => removeCatalog(catalogId)}
            className="text-red-600 hover:text-red-800"
          >
            Eliminar
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="p-6 space-y-6">
          {/* Información básica del catálogo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={catalog.name || ''}
                onChange={(e) => updateCatalog(catalogId, 'name', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del catálogo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo *
              </label>
              <input
                type="text"
                value={catalog.filename || ''}
                onChange={(e) => updateCatalog(catalogId, 'filename', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="archivo.csv"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={catalog.description || ''}
                onChange={(e) => updateCatalog(catalogId, 'description', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Descripción del catálogo"
              />
            </div>
          </div>
          
          {/* Formato de archivo */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-4">Formato de Archivo</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
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
              <h4 className="font-medium">Campos</h4>
              <button
                onClick={() => addField(catalogId)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                + Agregar Campo
              </button>
            </div>
            
            {catalog.fields && catalog.fields.length > 0 ? (
              <div className="space-y-3">
                {catalog.fields.map((field, index) => (
                  <FieldEditor
                    key={index}
                    catalogId={catalogId}
                    field={field}
                    fieldIndex={index}
                    updateField={updateField}
                    removeField={removeField}
                    dataTypes={dataTypes}
                  />
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                No hay campos definidos. Agrega uno para comenzar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente editor de campo
const FieldEditor = ({ catalogId, field, fieldIndex, updateField, removeField, dataTypes }) => (
  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-gray-50 p-3 rounded-md">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Nombre *
      </label>
      <input
        type="text"
        value={field.name || ''}
        onChange={(e) => updateField(catalogId, fieldIndex, 'name', e.target.value)}
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
        onChange={(e) => updateField(catalogId, fieldIndex, 'type', e.target.value)}
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
          onChange={(e) => updateField(catalogId, fieldIndex, 'required', e.target.checked)}
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
          onChange={(e) => updateField(catalogId, fieldIndex, 'unique', e.target.checked)}
          className="mr-2"
        />
        Único
      </label>
    </div>
    
    <div className="md:col-span-2 flex justify-end">
      <button
        onClick={() => removeField(catalogId, fieldIndex)}
        className="text-red-600 hover:text-red-800 text-sm"
      >
        Eliminar
      </button>
    </div>
  </div>
);

// Componente para la sección de paquetes
const PackagesSection = ({ packages, catalogs, addPackage, updatePackage, removePackage, fileTypes }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Paquetes</h2>
      <button
        onClick={addPackage}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        + Agregar Paquete
      </button>
    </div>
    
    {Object.keys(packages).length === 0 ? (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No hay paquetes definidos. Agrega uno para comenzar.
      </div>
    ) : (
      Object.entries(packages).map(([packageId, pkg]) => (
        <PackageEditor
          key={packageId}
          packageId={packageId}
          pkg={pkg}
          catalogs={catalogs}
          updatePackage={updatePackage}
          removePackage={removePackage}
          fileTypes={fileTypes}
        />
      ))
    )}
  </div>
);

// Componente editor individual de paquete
const PackageEditor = ({ packageId, pkg, catalogs, updatePackage, removePackage, fileTypes }) => {
  const [expanded, setExpanded] = useState(true);
  
  const updateFileFormat = (field, value) => {
    updatePackage(packageId, 'file_format', {
      ...pkg.file_format,
      [field]: value
    });
  };
  
  const toggleCatalog = (catalogId) => {
    const currentCatalogs = pkg.catalogs || [];
    const newCatalogs = currentCatalogs.includes(catalogId)
      ? currentCatalogs.filter(id => id !== catalogId)
      : [...currentCatalogs, catalogId];
    updatePackage(packageId, 'catalogs', newCatalogs);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {expanded ? '▼' : '▶'}
            </button>
            <h3 className="text-lg font-medium">
              {pkg.name || `Paquete ${packageId}`}
            </h3>
          </div>
          <button
            onClick={() => removePackage(packageId)}
            className="text-red-600 hover:text-red-800"
          >
            Eliminar
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="p-6 space-y-6">
          {/* Información básica del paquete */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={pkg.name || ''}
                onChange={(e) => updatePackage(packageId, 'name', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del paquete"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Archivo *
              </label>
              <select
                value={pkg.file_format?.type || 'ZIP'}
                onChange={(e) => updateFileFormat('type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fileTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={pkg.description || ''}
                onChange={(e) => updatePackage(packageId, 'description', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Descripción del paquete"
              />
            </div>
          </div>
          
          {/* Selección de catálogos */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-4">Catálogos Incluidos</h4>
            {Object.keys(catalogs).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(catalogs).map(([catalogId, catalog]) => (
                  <label key={catalogId} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(pkg.catalogs || []).includes(catalogId)}
                      onChange={() => toggleCatalog(catalogId)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {catalog.name || catalogId} ({catalog.filename || 'sin archivo'})
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                No hay catálogos disponibles. Crea catálogos primero.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

YAMLEditorPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default YAMLEditorPage;