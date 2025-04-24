import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Button, TextInput, Select, SelectItem, Card, Text, Title } from '@tremor/react';

interface NewEmisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

interface Organizacion {
  id: number;
  nombre: string;
}

interface CloudSecret {
  id: number;
  nombre: string;
  tipo: string;
}

interface Bucket {
  name: string;
  region?: string;
}

const TIPOS_EMISOR = [
  'interno',
  'corporativo',
  'distribuidora',
  'bot',
  'cadena mt',
  'eccomerce',
  'erp',
  'otros'
];

const TIPOS_ORIGEN = [
  { value: '', label: 'Sin origen de datos' },
  { value: 'sftp', label: 'Servidor SFTP' },
  { value: 'bucket', label: 'Bucket Cloud' }
];

export const NewEmisorModal: React.FC<NewEmisorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo_emisor: '',
    email_corporativo: '',
    telefono: '',
    organizacion_id: "",
    activo: true,
    codigo_interno: '',
    codigo_agente_merlin: '',
    tipo_origen: '',
    sftp_servidor: '',
    sftp_puerto: 22,
    sftp_usuario: '',
    sftp_clave: '',
    sftp_directorio: '/',
    cloud_secret_id: '',
    bucket_nombre: '',
  } as {
    nombre: string;
    tipo_emisor: string;
    email_corporativo: string;
    telefono: string;
    organizacion_id: string;
    activo: boolean;
    codigo_interno: string;
    codigo_agente_merlin: string;
    tipo_origen: string;
    sftp_servidor: string;
    sftp_puerto: number;
    sftp_usuario: string;
    sftp_clave: string;
    sftp_directorio: string;
    cloud_secret_id: string;
    bucket_nombre: string;
  });

  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [cloudSecrets, setCloudSecrets] = useState<CloudSecret[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [isLoadingBuckets, setIsLoadingBuckets] = useState(false);
  const [sftpValidationMessage, setSftpValidationMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const fetchOrganizaciones = async () => {
      try {
        const response = await fetch('/api/organizaciones');
        if (!response.ok) {
          throw new Error('Error fetching organizaciones');
        }
        const data = await response.json();
        setOrganizaciones(data);
        // Set default organizacion_id if we have organizations
        if (data.length > 0 && !formData.organizacion_id) {
          setFormData(prev => ({ ...prev, organizacion_id: data[0].id.toString() }));
        }
      } catch (error) {
        console.error('Error fetching organizaciones:', error);
      }
    };

    const fetchCloudSecrets = async () => {
      try {
        const response = await fetch('/api/cloud-secrets');
        if (!response.ok) {
          throw new Error('Error fetching cloud secrets');
        }
        const data = await response.json();
        setCloudSecrets(data);
      } catch (error) {
        console.error('Error fetching cloud secrets:', error);
      }
    };

    if (isOpen) {
      fetchOrganizaciones();
      fetchCloudSecrets();
      
      // Si hay un secreto seleccionado, cargar sus buckets
      if (formData.cloud_secret_id) {
        fetchBuckets(formData.cloud_secret_id);
      }
      
      // Reset form data when reopening
      setFormData({
        nombre: '',
        tipo_emisor: '',
        email_corporativo: '',
        telefono: '',
        organizacion_id: '',
        activo: true,
        codigo_interno: '',
        codigo_agente_merlin: '',
        tipo_origen: '',
        sftp_servidor: '',
        sftp_puerto: 22,
        sftp_usuario: '',
        sftp_clave: '',
        sftp_directorio: '/',
        cloud_secret_id: '',
        bucket_nombre: '',
      } as {
        nombre: string;
        tipo_emisor: string;
        email_corporativo: string;
        telefono: string;
        organizacion_id: string;
        activo: boolean;
        codigo_interno: string;
        codigo_agente_merlin: string;
        tipo_origen: string;
        sftp_servidor: string;
        sftp_puerto: number;
        sftp_usuario: string;
        sftp_clave: string;
        sftp_directorio: string;
        cloud_secret_id: string;
        bucket_nombre: string;
      });
      
      // Reset active tab
      setActiveTab('general');
      setSftpValidationMessage('');
    }
  }, [isOpen]);
  
  // Cargar buckets basado en el secreto seleccionado
  const fetchBuckets = async (secretId: string) => {
    setIsLoadingBuckets(true);
    try {
      const response = await fetch(`/api/emisores/buckets-secreto?secreto_id=${secretId}`);
      if (!response.ok) {
        throw new Error('Error fetching buckets');
      }
      const data = await response.json();
      if (data.success && data.buckets) {
        setBuckets(data.buckets);
      } else {
        setBuckets([]);
      }
    } catch (error) {
      console.error('Error fetching buckets:', error);
      setBuckets([]);
    } finally {
      setIsLoadingBuckets(false);
    }
  };

  // Verificar conexión SFTP
  const verificarSFTP = async () => {
    try {
      const response = await fetch('/api/emisores/verificar-sftp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sftp_servidor: formData.sftp_servidor,
          sftp_puerto: formData.sftp_puerto,
          sftp_usuario: formData.sftp_usuario,
          sftp_clave: formData.sftp_clave,
          sftp_directorio: formData.sftp_directorio,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSftpValidationMessage('Configuración SFTP válida');
      } else {
        setSftpValidationMessage(`Error: ${data.message || 'Datos de conexión SFTP inválidos'}`);
        if (data.errores && data.errores.length > 0) {
          setSftpValidationMessage(`${data.message}: ${data.errores.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error validating SFTP:', error);
      setSftpValidationMessage('Error al validar configuración SFTP');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validaciones básicas
      if (!formData.tipo_emisor) {
        alert('Por favor seleccione un tipo de emisor');
        return;
      }

      if (!formData.organizacion_id) {
        alert('Por favor seleccione una organización');
        return;
      }
      
      // Validar código interno (solo minúsculas, números, puntos y guiones)
      if (formData.codigo_interno && !/^[a-z0-9.-]+$/.test(formData.codigo_interno)) {
        setActiveTab('codigos');
        alert('El código interno solo puede contener letras minúsculas, números, puntos y guiones');
        return;
      }
      
      // Validar los campos según el tipo de origen
      if (formData.tipo_origen === 'sftp') {
        if (!formData.sftp_servidor || !formData.sftp_usuario) {
          setActiveTab('origen');
          alert('Para origen SFTP se requiere al menos el servidor y el usuario');
          return;
        }
      } else if (formData.tipo_origen === 'bucket') {
        if (!formData.cloud_secret_id || !formData.bucket_nombre) {
          setActiveTab('origen');
          alert('Para origen bucket se requiere seleccionar un secreto cloud y un bucket');
          return;
        }
      }

      // Preparar datos para envío
      const dataToSubmit = {
        ...formData,
        organizacion_id: parseInt(formData.organizacion_id),
        tipo_emisor: formData.tipo_emisor.toLowerCase(),
        // Convertir ID de secreto cloud a número si existe
        cloud_secret_id: formData.cloud_secret_id ? parseInt(formData.cloud_secret_id) : null,
        // Asegurarse de que los campos estén correctamente formateados
        sftp_puerto: formData.sftp_puerto || 22,
        // Limpiar campos no necesarios según el tipo de origen
        ...(formData.tipo_origen !== 'sftp' ? {
          sftp_servidor: null,
          sftp_puerto: null,
          sftp_usuario: null,
          sftp_clave: null,
          sftp_directorio: null
        } : {}),
        ...(formData.tipo_origen !== 'bucket' ? {
          cloud_secret_id: null,
          bucket_nombre: null
        } : {}),
        // Si no hay tipo de origen, limpiar todos los campos relacionados
        ...(formData.tipo_origen === '' ? {
          tipo_origen: null,
          sftp_servidor: null,
          sftp_puerto: null,
          sftp_usuario: null,
          sftp_clave: null,
          sftp_directorio: null,
          cloud_secret_id: null,
          bucket_nombre: null
        } : {})
      };

      await onSubmit(dataToSubmit);
      onClose();
    } catch (error: any) {
      console.error('Error creating emisor:', error);
      alert(error.message || 'Error al crear el emisor');
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
          <div className="p-6 border-b">
            <Dialog.Title className="text-lg font-medium">
              Nuevo Emisor
            </Dialog.Title>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Navegación de pestañas */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px space-x-8">
                  <button
                    type="button"
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'general'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('general')}
                  >
                    Información General
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'codigos'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('codigos')}
                  >
                    Códigos
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'origen'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('origen')}
                  >
                    Origen de Datos
                  </button>
                </nav>
              </div>

              {/* Contenido de pestañas */}
              <div className="mt-4">
                {/* Pestaña de Información General */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre
                      </label>
                      <TextInput
                        className="mt-1"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Nombre del emisor"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo de Emisor
                      </label>
                      <Select
                        className="mt-1"
                        value={formData.tipo_emisor}
                        onValueChange={(value) => setFormData({ ...formData, tipo_emisor: value })}
                        placeholder="Seleccionar tipo de emisor"
                      >
                        {TIPOS_EMISOR.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Organización
                      </label>
                      <Select
                        className="mt-1"
                        value={formData.organizacion_id}
                        onValueChange={(value) => setFormData({ ...formData, organizacion_id: value })}
                        placeholder="Seleccionar organización"
                      >
                        {organizaciones.map((org) => (
                          <SelectItem key={org.id} value={org.id.toString()}>
                            {org.nombre}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Corporativo
                      </label>
                      <TextInput
                        type="email"
                        className="mt-1"
                        value={formData.email_corporativo}
                        onChange={(e) => setFormData({ ...formData, email_corporativo: e.target.value })}
                        placeholder="Email corporativo"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Teléfono
                      </label>
                      <TextInput
                        className="mt-1"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="Teléfono"
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.activo}
                          onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Emisor activo
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Pestaña de Códigos */}
                {activeTab === 'codigos' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Código Interno
                      </label>
                      <TextInput
                        className="mt-1"
                        value={formData.codigo_interno}
                        onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value.toLowerCase() })}
                        placeholder="Código interno (solo letras minúsculas, números, puntos y guiones)"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Identificador único dentro del sistema. Solo se permiten letras minúsculas, números, puntos y guiones.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Código Agente Merlin
                      </label>
                      <TextInput
                        className="mt-1"
                        value={formData.codigo_agente_merlin}
                        onChange={(e) => setFormData({ ...formData, codigo_agente_merlin: e.target.value })}
                        placeholder="Código para integración con Merlin"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Código de integración con el sistema Merlin
                      </p>
                    </div>
                  </div>
                )}

                {/* Pestaña de Origen de Datos */}
                {activeTab === 'origen' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo de Origen de Datos
                      </label>
                      <Select
                        className="mt-1"
                        value={formData.tipo_origen}
                        onValueChange={(value) => {
                          setFormData({ 
                            ...formData, 
                            tipo_origen: value,
                            // Resetear los campos del otro tipo de origen
                            ...(value === 'sftp' ? {
                              cloud_secret_id: '',
                              bucket_nombre: '',
                            } : {}),
                            ...(value === 'bucket' ? {
                              sftp_servidor: '',
                              sftp_usuario: '',
                              sftp_clave: '',
                              sftp_directorio: '/',
                            } : {})
                          });
                          setSftpValidationMessage('');
                        }}
                        placeholder="Seleccionar tipo de origen"
                      >
                        {TIPOS_ORIGEN.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* Configuración SFTP */}
                    {formData.tipo_origen === 'sftp' && (
                      <Card className="p-4 space-y-4">
                        <Title>Configuración SFTP</Title>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Servidor
                          </label>
                          <TextInput
                            className="mt-1"
                            value={formData.sftp_servidor}
                            onChange={(e) => setFormData({ ...formData, sftp_servidor: e.target.value })}
                            placeholder="Nombre o IP del servidor"
                            required={formData.tipo_origen === 'sftp'}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Puerto
                          </label>
                          <TextInput
                            className="mt-1"
                            type="number"
                            value={formData.sftp_puerto.toString()}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              sftp_puerto: e.target.value ? parseInt(e.target.value) : 22 
                            })}
                            placeholder="22"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Usuario
                          </label>
                          <TextInput
                            className="mt-1"
                            value={formData.sftp_usuario}
                            onChange={(e) => setFormData({ ...formData, sftp_usuario: e.target.value })}
                            placeholder="Nombre de usuario"
                            required={formData.tipo_origen === 'sftp'}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Contraseña
                          </label>
                          <TextInput
                            className="mt-1"
                            type="password"
                            value={formData.sftp_clave}
                            onChange={(e) => setFormData({ ...formData, sftp_clave: e.target.value })}
                            placeholder="Contraseña"
                            required={formData.tipo_origen === 'sftp'}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Directorio
                          </label>
                          <TextInput
                            className="mt-1"
                            value={formData.sftp_directorio}
                            onChange={(e) => setFormData({ ...formData, sftp_directorio: e.target.value })}
                            placeholder="/path/to/directory"
                          />
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            variant="secondary" 
                            color="blue"
                            onClick={verificarSFTP}
                            type="button"
                          >
                            Verificar Datos SFTP
                          </Button>
                        </div>
                        
                        {sftpValidationMessage && (
                          <Text className={sftpValidationMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}>
                            {sftpValidationMessage}
                          </Text>
                        )}
                      </Card>
                    )}

                    {/* Configuración Bucket */}
                    {formData.tipo_origen === 'bucket' && (
                      <Card className="p-4 space-y-4">
                        <Title>Configuración Bucket</Title>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Secreto Cloud
                          </label>
                          <Select
                            className="mt-1"
                            value={formData.cloud_secret_id}
                            onValueChange={(value) => {
                              setFormData({ ...formData, cloud_secret_id: value, bucket_nombre: '' });
                              if (value) {
                                fetchBuckets(value);
                              }
                            }}
                            placeholder="Seleccionar secreto cloud"
                            required={formData.tipo_origen === 'bucket'}
                          >
                            {cloudSecrets.map((secret) => (
                              <SelectItem key={secret.id} value={secret.id.toString()}>
                                {secret.nombre} ({secret.tipo})
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Bucket
                          </label>
                          <Select
                            className="mt-1"
                            value={formData.bucket_nombre}
                            onValueChange={(value) => setFormData({ ...formData, bucket_nombre: value })}
                            placeholder="Seleccionar bucket"
                            required={formData.tipo_origen === 'bucket'}
                            disabled={isLoadingBuckets || !formData.cloud_secret_id || buckets.length === 0}
                          >
                            {buckets.map((bucket) => (
                              <SelectItem key={bucket.name} value={bucket.name}>
                                {bucket.name} {bucket.region ? `(${bucket.region})` : ''}
                              </SelectItem>
                            ))}
                          </Select>
                          {isLoadingBuckets && <p className="mt-1 text-xs text-gray-500">Cargando buckets...</p>}
                          {!isLoadingBuckets && formData.cloud_secret_id && buckets.length === 0 && (
                            <p className="mt-1 text-xs text-red-500">No se encontraron buckets para este secreto</p>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                <Button variant="secondary" onClick={onClose} type="button">
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                >
                  Crear Emisor
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};