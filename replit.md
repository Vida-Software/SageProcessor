# SAGE System - Replit Configuration

## Overview

SAGE (Sistema Avanzado para la Gestión de Configuraciones Organizacionales) is a comprehensive data processing and validation system that handles multi-channel file processing, automated email responses, and intelligent YAML configuration management with AI assistance.

## System Architecture

### Core Architecture Components

- **Frontend**: Next.js 20 application with modern React components
- **Backend**: Python 3.11 FastAPI/Flask services with multiple daemon processes
- **Database**: PostgreSQL 16 for data persistence
- **File Processing**: Multi-format support (CSV, Excel, ZIP) with BOM handling
- **Email System**: IMAP/SMTP integration for automated email processing
- **AI Integration**: OpenRouter API integration for YAML configuration assistance

### Processing Architecture

- **Multi-Channel Input**: Email (IMAP), SFTP, API endpoints, and file system
- **Validation Engine**: YAML-based rule engine with pandas integration
- **Response System**: Automated email responses with HTML/text formatting
- **Cloud Storage**: Multi-provider cloud storage with automatic migration
- **Monitoring**: Real-time activity logging and reporting

## Key Components

### 1. SAGE Daemon System
- **sage_daemon**: Primary email monitoring and processing daemon
- **sage_daemon2**: Enhanced version with SFTP support and improved error handling
- **Monitoring**: Continuous monitoring of configured email accounts and SFTP servers

### 2. File Processing Engine
- **Core Processor**: `sage/file_processor.py` - Main validation and processing logic
- **BOM Support**: Automatic detection and handling of UTF-8 BOM in CSV files
- **Multi-format**: CSV, Excel, ZIP archive processing
- **Validation**: Pandas-based data validation with custom rule engine

### 3. YAML Studio
- **AI-Assisted Configuration**: OpenRouter integration for intelligent YAML generation
- **Template System**: Predefined templates for common data structures
- **Validation**: Real-time YAML syntax and structure validation
- **Export**: Generate configuration files for external use

### 4. YAML Editor Complete
- **Full SAGE Specification**: Complete implementation of SAGE YAML structure
- **Collapsible Sections**: Organized interface with sage_yaml, catalogs, and packages
- **Field Management**: Complete field editing with types, validation rules, and properties
- **Validation System**: Support for field, row, catalog, and package validations
- **File Operations**: Load existing YAML files and export edited configurations
- **Real-time Preview**: Live YAML generation and preview functionality

### 4. Email Processing System
- **IMAP Integration**: Automatic email retrieval and processing
- **SMTP Response**: HTML/text email responses with attachment support
- **Authorization**: Sender authorization with automatic internal domain handling
- **Threading**: Proper email threading with In-Reply-To and References headers

### 5. Cloud Storage Integration
- **Multi-Provider**: AWS S3, Azure Blob, Google Cloud Storage, MinIO
- **Automatic Migration**: Janitor daemon for moving old executions to cloud storage
- **Fallback System**: Multiple cloud providers for redundancy

## Data Flow

1. **Input Reception**: Files received via email attachments, SFTP uploads, or direct API calls
2. **Validation**: YAML configuration determines validation rules and data structure requirements
3. **Processing**: Pandas-based data validation with detailed error reporting
4. **Response Generation**: Automated email responses with processing results and logs
5. **Storage**: Local storage with automatic cloud migration for long-term retention
6. **Monitoring**: Activity logging and statistics generation

## External Dependencies

### Required Services
- **PostgreSQL 16+**: Primary database for configuration and execution logs
- **Email Server**: IMAP/SMTP access (currently configured for DreamHost)
- **OpenRouter API**: AI assistance for YAML configuration generation (optional)

### Python Dependencies
- **pandas**: Data manipulation and validation
- **psycopg2**: PostgreSQL database connectivity
- **email/smtplib**: Email processing and sending
- **paramiko**: SFTP client functionality
- **pyyaml**: YAML configuration parsing
- **requests**: HTTP client for API integrations

### Node.js Dependencies
- **Next.js 20**: Frontend framework
- **React**: UI components
- **TailwindCSS**: Styling framework

## Deployment Strategy

### Development Environment
- **Replit Integration**: Configured for Replit with appropriate workflows
- **Multi-Service**: Next.js frontend and Python backend services
- **Database**: PostgreSQL container or Replit database
- **Port Configuration**: Frontend on port 5000, API services on additional ports

### Production Deployment
- **Docker Support**: Multi-stage Dockerfile for containerized deployment
- **Supervisor**: Process management for multiple daemon services
- **Cloud Storage**: Automatic backup and archival to configured cloud providers
- **Monitoring**: Built-in health checks and performance monitoring

### Configuration Management
- **Environment Variables**: Database connections, API keys, email credentials
- **YAML Configuration**: Business logic and validation rules
- **Database Schema**: Structured configuration storage with versioning

## Changelog

- June 25, 2025: System Secrets Management Added
  - Created new system secrets center at /admin/system-secrets
  - Added API endpoint for managing system-wide credentials
  - Organized secrets by categories: AI APIs, Database, External Services, Security
  - Includes predefined secret templates for common integrations
  - Secure handling with masked values and visibility toggles
  - Added to configuration menu for easy access
- June 25, 2025: Data Boxes Layout Fixed
  - Fixed card layout on large screens to use vertical stacking
  - Improved responsive design consistency across screen sizes
- June 25, 2025: YAML Editor Removed
  - Removed standalone YAML Editor component at user request
  - Cleaned up navigation menu - removed YAML Editor link and icon imports
  - YAML Studio remains as the primary YAML configuration tool
- June 25, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.