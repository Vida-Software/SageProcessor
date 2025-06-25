# SAGE System - Replit.md

## Overview

SAGE is an advanced system for organizational configuration management, file processing, and YAML-based rule validation with AI assistance. It's a comprehensive data processing platform designed for handling complex data workflows with multi-cloud materialization capabilities.

## System Architecture

### Frontend Architecture
- **Technology**: Next.js with React and Tailwind CSS
- **Location**: `/src/pages/`
- **Purpose**: Provides web-based dashboard for monitoring, configuration management, and system administration
- **Key Features**: Real-time monitoring dashboard, data mailbox management, cloud provider configuration, materialization setup

### Backend Architecture
- **Node.js API Layer**: Next.js API routes (`/src/pages/api/`) for REST endpoints
- **Python Processing Engine**: Core processing logic in `/sage/` directory
- **Daemon Services**: Background services for continuous monitoring and processing
  - SAGE Daemon 2: Email and SFTP monitoring (`run_sage_daemon2.py`)
  - Janitor Daemon: File cleanup and cloud migration (`janitor_daemon.py`)

### Database Layer
- **Primary Database**: PostgreSQL 15+ for application data
- **Analytics Database**: DuckDB for data analytics and processing
- **Schema Management**: Drizzle ORM (configured to work with PostgreSQL)

## Key Components

### 1. YAML Studio
- AI-powered YAML configuration editor
- Supports BOM (Byte Order Mark) in CSV files
- OpenRouter integration with o3-mini model
- Downloadable prompts for external use

### 2. Multi-Channel File Processor
- **Email Processing**: IMAP monitoring with automatic responses
- **SFTP Processing**: Secure file transfer monitoring
- **File System Processing**: Local file monitoring
- **API Processing**: REST API endpoints for file submission

### 3. Validation Engine
- YAML-based rule definitions
- CSV/Excel file validation
- Column count verification
- Data type validation
- Custom business rules

### 4. Cloud Integration
- Multi-cloud materialization support
- MinIO integration for object storage
- AWS, Azure, GCP support
- Cloud URI management

### 5. Notification System
- Email notifications with configurable frequencies
- Event-based alerts (error, warning, info, success)
- Subscription management
- Detailed reporting

## Data Flow

1. **Input Sources**: Files arrive via Email (IMAP), SFTP, API, or file system
2. **Processing Pipeline**: 
   - File validation against YAML rules
   - Data transformation and cleaning
   - Error detection and reporting
3. **Storage & Materialization**:
   - Local storage for immediate processing
   - Cloud materialization for long-term storage
   - Database logging of all operations
4. **Notifications & Responses**:
   - Automatic email responses
   - Event notifications to subscribers
   - Dashboard updates

## External Dependencies

### Core Dependencies
- **Node.js 20.x**: JavaScript runtime
- **Python 3.11+**: Processing engine
- **PostgreSQL 15+**: Primary database
- **DuckDB**: Analytics database

### Email Infrastructure
- **IMAP/SMTP**: Email processing (Dreamhost/MailChannels)
- **DNS Configuration**: SPF, DKIM, DMARC records for deliverability

### Cloud Services
- **MinIO**: Object storage
- **AWS/Azure/GCP**: Cloud materialization targets
- **OpenRouter**: AI model access for YAML Studio

### Python Libraries
- pandas: Data manipulation
- psycopg2: PostgreSQL connectivity
- imaplib/smtplib: Email processing
- duckdb: Analytics database
- boto3: AWS/cloud integration

## Deployment Strategy

### Development Environment
- Replit-based development with integrated PostgreSQL
- Hot reload for Next.js frontend
- Python daemon services running in parallel

### Docker Deployment
- Multi-stage Docker build
- Docker Compose orchestration
- Separated services: web app, database, nginx proxy
- Volume mounts for persistent data

### Production Considerations
- Supervisor for daemon process management
- Nginx reverse proxy for load balancing
- Automated backups for PostgreSQL
- Cloud storage for file archival

## Changelog

- June 25, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.