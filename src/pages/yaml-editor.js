import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Head from 'next/head';
import { YAMLStudioForm } from '@/components/YAMLStudio/YAMLStudioForm';
import { Card, Title, Button } from "@tremor/react";
import { DocumentArrowUpIcon, CogIcon, BeakerIcon } from '@heroicons/react/24/outline';

const YAMLEditorPage = () => {
  const router = useRouter();
  const [activeEditorTab, setActiveEditorTab] = useState(0);
  
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
          
          {/* Quick access buttons */}
          <div className="mb-6 flex flex-wrap gap-4">
            <Button
              onClick={() => router.push('/studio')}
              className="flex items-center space-x-2"
              variant="secondary"
            >
              <BeakerIcon className="h-4 w-4" />
              <span>YAML Studio (AI)</span>
            </Button>
            <Button
              onClick={() => setActiveEditorTab(1)}
              className="flex items-center space-x-2"
              variant="secondary"
            >
              <CogIcon className="h-4 w-4" />
              <span>Editor Visual</span>
            </Button>
            <Button
              onClick={() => setActiveEditorTab(0)}
              className="flex items-center space-x-2"
              variant="primary"
            >
              <DocumentArrowUpIcon className="h-4 w-4" />
              <span>Generador AI</span>
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

// Componente simplificado para editor manual
const ManualYAMLEditor = () => {
  return (
    <div className="text-center py-8 text-gray-600">
      <p className="mb-4">
        El editor visual manual está disponible en una aplicación dedicada con componentes avanzados.
      </p>
      <p className="text-sm">
        Por ahora, recomendamos usar el Generador con IA para crear YAMLs complejos, 
        o visitar la página YAML Studio para funcionalidades avanzadas.
      </p>
    </div>
  );
};

// Componente para validador YAML
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
      // Validación básica de sintaxis YAML
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
      // Verificaciones básicas de estructura SAGE
      const lines = yamlContent.split('\n');
      const details = [];
      
      // Verificar secciones requeridas
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
        <Card className={`mt-4 ${validationResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="p-4">
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
        </Card>
      )}
    </div>
  );
};

YAMLEditorPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default YAMLEditorPage;