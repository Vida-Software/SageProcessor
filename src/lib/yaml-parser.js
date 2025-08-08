// YAML parser utilities for SAGE configuration files
import yaml from 'yaml';

export function parseYaml(yamlString) {
  try {
    return yaml.parse(yamlString);
  } catch (error) {
    throw new Error(`Error parsing YAML: ${error.message}`);
  }
}

export function stringifyYaml(data) {
  try {
    return yaml.stringify(data, {
      indent: 2,
      lineWidth: -1,
      minContentWidth: 0,
      nullStr: 'null'
    });
  } catch (error) {
    throw new Error(`Error stringifying YAML: ${error.message}`);
  }
}

export function validateSageYaml(yamlData) {
  if (!yamlData.sage_yaml) {
    throw new Error('Missing sage_yaml section');
  }
  
  if (!yamlData.sage_yaml.name) {
    throw new Error('Missing name in sage_yaml');
  }
  
  if (!yamlData.sage_yaml.description) {
    throw new Error('Missing description in sage_yaml');
  }
  
  return true;
}

export function extractFieldsFromYaml(yamlData) {
  const fields = [];
  
  if (yamlData.sage_yaml && yamlData.sage_yaml.fields) {
    yamlData.sage_yaml.fields.forEach(field => {
      fields.push({
        name: field.name,
        type: field.type || 'string',
        required: field.required || false,
        description: field.description || ''
      });
    });
  }
  
  return fields;
}

export function extraerMetadatosYaml(contenido) {
  try {
    // Valores por defecto
    let nombre = '';
    let descripcion = '';
    
    // Usar el parser de YAML en lugar de expresiones regulares
    const parsedYaml = yaml.parse(contenido);
    
    // Extraer los metadatos del objeto YAML parseado
    if (parsedYaml && parsedYaml.sage_yaml) {
      nombre = parsedYaml.sage_yaml.name || '';
      descripcion = parsedYaml.sage_yaml.description || '';
    }
    
    return { nombre, descripcion };
  } catch (e) {
    console.error('Error extrayendo metadatos del YAML:', e);
    return { nombre: '', descripcion: '' };
  }
}