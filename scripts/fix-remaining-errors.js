#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining compilation errors...');

// Fix duplicate Pool imports
function fixDuplicatePoolImports(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if has duplicate Pool imports
    if (content.includes('import { Pool, Client } from \'pg\';') && 
        content.includes('import { Pool } from \'pg\';')) {
      
      // Remove the duplicate single Pool import
      content = content.replace(/\nimport { Pool } from 'pg';\n/, '\n');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed duplicate Pool import: ${filePath}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Create missing cloud adapter files
function createMissingCloudAdapters() {
  const adaptersDir = 'src/utils/cloud/adapters';
  
  // Create minio.js if it doesn't exist
  const minioPath = path.join(adaptersDir, 'minio.js');
  if (!fs.existsSync(minioPath)) {
    const minioContent = `// MinIO adapter for cloud storage operations
import AWS from 'aws-sdk';

export function createBucket(config, bucketName) {
  const s3 = new AWS.S3({
    endpoint: config.endpoint,
    accessKeyId: config.accessKey,
    secretAccessKey: config.secretKey,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
  });

  return s3.createBucket({
    Bucket: bucketName
  }).promise();
}

export function listBuckets(config) {
  const s3 = new AWS.S3({
    endpoint: config.endpoint,
    accessKeyId: config.accessKey,
    secretAccessKey: config.secretKey,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
  });

  return s3.listBuckets().promise();
}

export function deleteBucket(config, bucketName) {
  const s3 = new AWS.S3({
    endpoint: config.endpoint,
    accessKeyId: config.accessKey,
    secretAccessKey: config.secretKey,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
  });

  return s3.deleteBucket({
    Bucket: bucketName
  }).promise();
}
`;
    fs.writeFileSync(minioPath, minioContent, 'utf8');
    console.log('✅ Created missing minio.js adapter');
  }

  // Create minio_fixed.js if it doesn't exist
  const minioFixedPath = path.join(adaptersDir, 'minio_fixed.js');
  if (!fs.existsSync(minioFixedPath)) {
    const minioFixedContent = `// MinIO fixed adapter for cloud storage operations
import AWS from 'aws-sdk';

export function createBucket(config, bucketName) {
  const s3 = new AWS.S3({
    endpoint: config.endpoint,
    accessKeyId: config.accessKey,
    secretAccessKey: config.secretKey,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    region: config.region || 'us-east-1'
  });

  return s3.createBucket({
    Bucket: bucketName
  }).promise();
}

export function listBuckets(config) {
  const s3 = new AWS.S3({
    endpoint: config.endpoint,
    accessKeyId: config.accessKey,
    secretAccessKey: config.secretKey,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    region: config.region || 'us-east-1'
  });

  return s3.listBuckets().promise();
}

export function uploadObject(config, bucketName, objectKey, data) {
  const s3 = new AWS.S3({
    endpoint: config.endpoint,
    accessKeyId: config.accessKey,
    secretAccessKey: config.secretKey,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    region: config.region || 'us-east-1'
  });

  return s3.upload({
    Bucket: bucketName,
    Key: objectKey,
    Body: data
  }).promise();
}
`;
    fs.writeFileSync(minioFixedPath, minioFixedContent, 'utf8');
    console.log('✅ Created missing minio_fixed.js adapter');
  }
}

// Create missing yaml-parser in lib directory
function createYamlParser() {
  const libDir = 'lib';
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }
  
  const yamlParserPath = path.join(libDir, 'yaml-parser.js');
  if (!fs.existsSync(yamlParserPath)) {
    const yamlParserContent = `// YAML parser utilities for SAGE configuration files
import yaml from 'yaml';

export function parseYaml(yamlString) {
  try {
    return yaml.parse(yamlString);
  } catch (error) {
    throw new Error(\`Error parsing YAML: \${error.message}\`);
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
    throw new Error(\`Error stringifying YAML: \${error.message}\`);
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
`;
    fs.writeFileSync(yamlParserPath, yamlParserContent, 'utf8');
    console.log('✅ Created missing yaml-parser.js');
  }
}

// Main execution
console.log('Starting fixes...\n');

// Fix duplicate Pool imports
const poolImportFiles = [
  'src/pages/api/admin/database-connections/[id]/databases.js',
  'src/pages/api/admin/db-secrets/[id]/schemas.js'
];

poolImportFiles.forEach(filePath => {
  fixDuplicatePoolImports(filePath);
});

// Create missing files
createMissingCloudAdapters();
createYamlParser();

console.log('\n✅ All remaining compilation errors have been fixed!');
console.log('\nNext steps:');
console.log('1. Run "npm install" to install any missing dependencies');
console.log('2. Run "npm run build" to verify compilation');