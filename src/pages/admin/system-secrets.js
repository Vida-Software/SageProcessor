import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Button, TextInput, Textarea, Switch, Badge } from '@tremor/react';
import { 
  KeyIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  PlusIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const SYSTEM_SECRET_CATEGORIES = {
  'ai_apis': {
    name: 'APIs de Inteligencia Artificial',
    icon: '🤖',
    description: 'Claves para servicios de IA y procesamiento de lenguaje natural'
  },
  'database': {
    name: 'Base de Datos Principal',
    icon: '🗄️',
    description: 'Credenciales de conexión a la base de datos PostgreSQL'
  },
  'external_services': {
    name: 'Servicios Externos',
    icon: '🔗',
    description: 'Integraciones con servicios externos y webhooks'
  },
  'security': {
    name: 'Seguridad del Sistema',
    icon: '🔐',
    description: 'Claves de cifrado y tokens de autenticación'
  }
};

const PREDEFINED_SECRETS = {
  'ai_apis': [
    { key: 'OPENROUTER_API_KEY', name: 'OpenRouter API Key', description: 'Clave para acceso a OpenRouter para YAML Studio', masked: true },
    { key: 'OPENAI_API_KEY', name: 'OpenAI API Key', description: 'Clave para servicios de OpenAI', masked: true }
  ],
  'database': [
    { key: 'DATABASE_URL', name: 'PostgreSQL Connection URL', description: 'URL de conexión principal a PostgreSQL', masked: true },
    { key: 'DB_BACKUP_CREDENTIALS', name: 'Credenciales de Backup', description: 'Credenciales para respaldos automáticos', masked: true }
  ],
  'external_services': [
    { key: 'SENDGRID_API_KEY', name: 'SendGrid API Key', description: 'Clave para servicio de email SendGrid', masked: true },
    { key: 'WEBHOOK_SECRET', name: 'Webhook Secret', description: 'Secreto para validación de webhooks', masked: true }
  ],
  'security': [
    { key: 'JWT_SECRET', name: 'JWT Secret Key', description: 'Clave secreta para tokens JWT', masked: true },
    { key: 'SESSION_SECRET', name: 'Session Secret', description: 'Clave para cifrado de sesiones', masked: true },
    { key: 'ENCRYPTION_KEY', name: 'Encryption Key', description: 'Clave maestra de cifrado', masked: true }
  ]
};

export default function SystemSecretsPage() {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSecret, setEditingSecret] = useState(null);
  const [newSecret, setNewSecret] = useState({ category: '', key: '', value: '', description: '', masked: false });
  const [showAddForm, setShowAddForm] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState(new Set());

  useEffect(() => {
    loadSecrets();
  }, []);

  const loadSecrets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system-secrets');
      if (response.ok) {
        const data = await response.json();
        setSecrets(data);
      } else {
        throw new Error('Error al cargar secretos');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los secretos del sistema');
    } finally {
      setLoading(false);
    }
  };

  const saveSecret = async (secretData) => {
    try {
      const response = await fetch('/api/admin/system-secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secretData)
      });

      if (response.ok) {
        toast.success('Secreto guardado correctamente');
        loadSecrets();
        setEditingSecret(null);
        setShowAddForm(false);
        setNewSecret({ category: '', key: '', value: '', description: '', masked: false });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al guardar el secreto');
    }
  };

  const toggleSecretVisibility = (secretKey) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(secretKey)) {
      newVisible.delete(secretKey);
    } else {
      newVisible.add(secretKey);
    }
    setVisibleSecrets(newVisible);
  };

  const groupedSecrets = secrets.reduce((acc, secret) => {
    if (!acc[secret.category]) {
      acc[secret.category] = [];
    }
    acc[secret.category].push(secret);
    return acc;
  }, {});

  const addPredefinedSecret = (category, predefinedSecret) => {
    setNewSecret({
      category,
      key: predefinedSecret.key,
      value: '',
      description: predefinedSecret.description,
      masked: predefinedSecret.masked
    });
    setShowAddForm(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Title className="text-2xl">APIs y Credenciales del Sistema</Title>
          <Text className="text-gray-600 mt-1">
            Gestiona las claves de APIs y credenciales principales del sistema SAGE
          </Text>
        </div>
        <Button
          icon={PlusIcon}
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white"
        >
          Agregar Secreto
        </Button>
      </div>

      {/* Formulario para agregar nuevo secreto */}
      {showAddForm && (
        <Card className="mb-6 p-6 border-2 border-indigo-200">
          <div className="flex justify-between items-center mb-4">
            <Title className="text-lg">Agregar Nuevo Secreto</Title>
            <Button
              icon={XMarkIcon}
              variant="light"
              onClick={() => {
                setShowAddForm(false);
                setNewSecret({ category: '', key: '', value: '', description: '', masked: false });
              }}
            >
              Cancelar
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={newSecret.category}
                onChange={(e) => setNewSecret({ ...newSecret, category: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar categoría...</option>
                {Object.entries(SYSTEM_SECRET_CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <TextInput
                label="Clave (Key)"
                placeholder="Ej: OPENAI_API_KEY"
                value={newSecret.key}
                onChange={(e) => setNewSecret({ ...newSecret, key: e.target.value })}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <TextInput
              label="Valor"
              placeholder="Ingrese el valor del secreto..."
              type={newSecret.masked ? "password" : "text"}
              value={newSecret.value}
              onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
            />
          </div>
          
          <div className="mb-4">
            <Textarea
              label="Descripción"
              placeholder="Descripción del propósito de este secreto..."
              value={newSecret.description}
              onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Switch
                checked={newSecret.masked}
                onChange={() => setNewSecret({ ...newSecret, masked: !newSecret.masked })}
              />
              <span className="ml-2 text-sm text-gray-600">Valor sensible (ocultar)</span>
            </div>
            
            <Button
              icon={CheckIcon}
              onClick={() => saveSecret(newSecret)}
              disabled={!newSecret.category || !newSecret.key}
              className="bg-green-600 text-white"
            >
              Guardar Secreto
            </Button>
          </div>
        </Card>
      )}

      {/* Categorías de secretos */}
      <div className="space-y-8">
        {Object.entries(SYSTEM_SECRET_CATEGORIES).map(([categoryKey, category]) => (
          <Card key={categoryKey} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{category.icon}</span>
                <div>
                  <Title className="text-lg">{category.name}</Title>
                  <Text className="text-gray-600 text-sm">{category.description}</Text>
                </div>
              </div>
              <Badge color="blue" className="text-xs">
                {groupedSecrets[categoryKey]?.length || 0} secretos
              </Badge>
            </div>

            {/* Secretos existentes en esta categoría */}
            {groupedSecrets[categoryKey]?.map((secret) => (
              <div key={secret.id} className="border rounded-lg p-4 mb-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <KeyIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="font-medium">{secret.key}</span>
                      {secret.has_value && (
                        <Badge color="green" className="ml-2 text-xs">Configurado</Badge>
                      )}
                      {!secret.has_value && (
                        <Badge color="red" className="ml-2 text-xs">Sin valor</Badge>
                      )}
                    </div>
                    <Text className="text-sm text-gray-600 mb-2">{secret.description}</Text>
                    
                    {secret.masked ? (
                      <div className="flex items-center">
                        <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">
                          {visibleSecrets.has(secret.key) ? secret.value : secret.display_value}
                        </code>
                        <Button
                          icon={visibleSecrets.has(secret.key) ? EyeSlashIcon : EyeIcon}
                          variant="light"
                          size="xs"
                          onClick={() => toggleSecretVisibility(secret.key)}
                          className="ml-2"
                        >
                          {visibleSecrets.has(secret.key) ? 'Ocultar' : 'Mostrar'}
                        </Button>
                      </div>
                    ) : (
                      <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">
                        {secret.display_value || 'Sin valor'}
                      </code>
                    )}
                  </div>
                  
                  <Button
                    icon={PencilIcon}
                    variant="light"
                    size="xs"
                    onClick={() => setEditingSecret(secret)}
                    className="ml-4"
                  >
                    Editar
                  </Button>
                </div>
              </div>
            ))}

            {/* Secretos predefinidos no configurados */}
            {PREDEFINED_SECRETS[categoryKey]?.filter(pred => 
              !groupedSecrets[categoryKey]?.some(secret => secret.key === pred.key)
            ).map((predefined) => (
              <div key={predefined.key} className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <KeyIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-600">{predefined.key}</span>
                      <Badge color="gray" className="ml-2 text-xs">No configurado</Badge>
                    </div>
                    <Text className="text-sm text-gray-500">{predefined.description}</Text>
                  </div>
                  
                  <Button
                    icon={PlusIcon}
                    variant="light"
                    size="xs"
                    onClick={() => addPredefinedSecret(categoryKey, predefined)}
                    className="ml-4 text-indigo-600"
                  >
                    Configurar
                  </Button>
                </div>
              </div>
            ))}

            {!groupedSecrets[categoryKey]?.length && !PREDEFINED_SECRETS[categoryKey]?.length && (
              <div className="text-center py-8 text-gray-500">
                <ShieldCheckIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <Text>No hay secretos configurados en esta categoría</Text>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Modal de edición (simplificado por espacio) */}
      {editingSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <Title className="mb-4">Editar Secreto</Title>
            <div className="space-y-4">
              <TextInput
                label="Valor"
                type={editingSecret.masked ? "password" : "text"}
                value={editingSecret.value || ''}
                onChange={(e) => setEditingSecret({ ...editingSecret, value: e.target.value })}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="light"
                  onClick={() => setEditingSecret(null)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => saveSecret(editingSecret)}
                  className="bg-blue-600 text-white"
                >
                  Guardar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}