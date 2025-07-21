import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  Grid,
  Col,
  TextInput,
  Select,
  SelectItem,
  NumberInput,
  Textarea,
  Switch
} from '@tremor/react';
import { ArrowLeftIcon, ServerIcon, KeyIcon } from '@heroicons/react/24/outline';
import Breadcrumbs from '@/components/Breadcrumbs';
import { toast } from 'react-toastify';

export default function NewDBSecret() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'postgresql',
    servidor: '',
    puerto: 5432,
    usuario: '',
    contrasena: '',
    basedatos: '',
    opciones_conexion: '',
    activo: true
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name, value) => {
    let puerto = formData.puerto;
    
    // Ajustar puerto según tipo de base de datos
    if (name === 'tipo') {
      switch (value) {
        case 'postgresql':
          puerto = 5432;
          break;
        case 'mysql':
          puerto = 3306;
          break;
        case 'sqlserver':
          puerto = 1433;
          break;
        case 'duckdb':
          puerto = 0; // DuckDB es embebido, no usa puerto
          break;
        default:
          puerto = 5432;
      }
    }
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      ...(name === 'tipo' ? { puerto } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.nombre || !formData.servidor || !formData.usuario) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }
    
    try {
      setLoading(true);
      
      // Preparar datos para enviar
      const dataToSend = {
        ...formData,
        opciones_conexion: formData.opciones_conexion ? 
          JSON.parse(formData.opciones_conexion) : {}
      };
      
      // Si el formato JSON no es válido, usar como cadena
      if (formData.opciones_conexion && typeof dataToSend.opciones_conexion !== 'object') {
        dataToSend.opciones_conexion = { raw: formData.opciones_conexion };
      }
      
      const response = await fetch('/api/admin/db-secrets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear el secreto');
      }
      
      const result = await response.json();
      toast.success('Secreto de base de datos creado correctamente');
      router.push('/admin/db-secrets');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al crear el secreto de base de datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Secretos de Bases de Datos', href: '/admin/db-secrets' },
          { label: 'Nuevo Secreto', current: true }
        ]} />
        
        <div className="sm:flex sm:justify-between sm:items-center mb-8">
          <Title>Crear Secreto de Base de Datos</Title>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="light"
              icon={ArrowLeftIcon}
              onClick={() => router.push('/admin/db-secrets')}
            >
              Volver
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Grid numCols={1} numColsSm={2} numColsLg={3} className="gap-6">
            <Col numColSpan={1} numColSpanLg={2}>
              <Card>
                <h3 className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  Información General
                </h3>
                <div className="mt-4 space-y-4">
                  <TextInput
                    name="nombre"
                    placeholder="Nombre del secreto"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    icon={KeyIcon}
                    error={!formData.nombre ? 'Este campo es obligatorio' : ''}
                    errorMessage="Este campo es obligatorio"
                    className="mt-2"
                  />
                  
                  <Textarea
                    name="descripcion"
                    placeholder="Descripción (opcional)"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={3}
                    className="mt-2"
                  />
                  
                  <div className="flex items-center space-x-4">
                    <Switch
                      id="activo"
                      name="activo"
                      checked={formData.activo}
                      onChange={(checked) => handleSwitchChange('activo', checked)}
                    />
                    <label htmlFor="activo" className="text-tremor-default text-tremor-content cursor-pointer">
                      Secreto activo
                    </label>
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col>
              <Card>
                <h3 className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  Tipo de Base de Datos
                </h3>
                <div className="mt-4">
                  <Select
                    name="tipo"
                    value={formData.tipo}
                    onValueChange={(value) => handleSelectChange('tipo', value)}
                    required
                  >
                    <SelectItem value="postgresql" icon={ServerIcon}>
                      PostgreSQL
                    </SelectItem>
                    <SelectItem value="mysql" icon={ServerIcon}>
                      MySQL / MariaDB
                    </SelectItem>
                    <SelectItem value="sqlserver" icon={ServerIcon}>
                      SQL Server
                    </SelectItem>
                    <SelectItem value="duckdb" icon={ServerIcon}>
                      DuckDB
                    </SelectItem>
                  </Select>
                </div>
              </Card>
            </Col>
            
            <Col numColSpan={1} numColSpanSm={2} numColSpanLg={3}>
              <Card>
                <h3 className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  Detalles de Conexión
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <TextInput
                    name="servidor"
                    placeholder="Servidor / Host"
                    value={formData.servidor}
                    onChange={handleChange}
                    required
                    error={!formData.servidor ? 'Este campo es obligatorio' : ''}
                    className="mt-2"
                  />
                  
                  <NumberInput
                    name="puerto"
                    placeholder="Puerto"
                    value={formData.puerto}
                    onValueChange={(value) => handleNumberChange('puerto', value)}
                    required
                    min={0}
                    max={65535}
                    className="mt-2"
                  />
                  
                  <TextInput
                    name="basedatos"
                    placeholder="Base de datos (opcional)"
                    value={formData.basedatos}
                    onChange={handleChange}
                    className="mt-2"
                  />
                  
                  <TextInput
                    name="usuario"
                    placeholder="Usuario"
                    value={formData.usuario}
                    onChange={handleChange}
                    required
                    error={!formData.usuario ? 'Este campo es obligatorio' : ''}
                    className="mt-2"
                  />
                  
                  <TextInput
                    name="contrasena"
                    placeholder="Contraseña"
                    value={formData.contrasena}
                    onChange={handleChange}
                    type="password"
                    className="mt-2"
                  />
                  
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Textarea
                      name="opciones_conexion"
                      placeholder="Opciones de conexión (JSON, opcional)"
                      value={formData.opciones_conexion}
                      onChange={handleChange}
                      rows={3}
                      className="mt-2"
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      Ejemplo: {`{"sslmode":"require","connect_timeout":10}`}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Grid>
          
          <div className="mt-6 flex justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/db-secrets')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Secreto'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}