import Head from 'next/head';

export default function YAMLEditorComplete() {
  return (
    <>
      <Head>
        <title>Editor YAML SAGE - En Construcción</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-8">
              <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Editor YAML SAGE
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              En Construcción
            </p>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Funcionalidad en Desarrollo
              </h2>
              
              <p className="text-gray-600 mb-6">
                El editor YAML para configuraciones SAGE está siendo desarrollado. 
                Esta herramienta permitirá crear y editar configuraciones YAML 
                según la especificación SAGE de forma visual e intuitiva.
              </p>
              
              <div className="text-sm text-gray-500">
                <p className="mb-2">
                  <strong>Características planificadas:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Editor visual para estructuras SAGE YAML</li>
                  <li>Validación en tiempo real</li>
                  <li>Carga y edición de archivos existentes</li>
                  <li>Generación automática de configuraciones</li>
                  <li>Exportación de archivos YAML</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8">
              <a
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Volver al Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}