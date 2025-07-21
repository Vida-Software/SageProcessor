FROM node:20-alpine AS next-builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./
COPY . .
RUN npm run build

FROM python:3.11-slim AS backend-builder
WORKDIR /app
COPY pyproject.toml *.py ./
COPY sage ./sage
COPY sage_daemon ./sage_daemon
COPY sage_daemon2 ./sage_daemon2
COPY utils ./utils
COPY scripts ./scripts

FROM node:18-bullseye-slim

# Instalar dependencias del sistema incluyendo SSH
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    git \
    openssh-server \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Configurar SSH
RUN mkdir /var/run/sshd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
RUN echo 'Port 2222' >> /etc/ssh/sshd_config

# Crear usuario SSH
RUN useradd -m -s /bin/bash sageuser && \
    echo 'sageuser:sage2025!' | chpasswd && \
    usermod -aG sudo sageuser

WORKDIR /app
COPY --from=next-builder /app/.next ./.next
COPY --from=next-builder /app/public ./public
COPY --from=next-builder /app/node_modules ./node_modules
COPY --from=next-builder /app/package.json ./package.json
COPY --from=backend-builder /app /app
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
EXPOSE 5000
CMD ["/usr/bin/supervisord"]