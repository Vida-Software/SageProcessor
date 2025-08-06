
#!/bin/bash

# Instalar OpenSSH Server
apt-get update
apt-get install -y openssh-server

# Crear usuario para SSH
useradd -m -s /bin/bash sageuser
echo 'sageuser:sage2025!' | chpasswd

# Configurar SSH
mkdir -p /var/run/sshd
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
echo 'Port 2222' >> /etc/ssh/sshd_config

# Agregar usuario al grupo sudo
usermod -aG sudo sageuser

# Iniciar SSH daemon
/usr/sbin/sshd -D &

echo "SSH habilitado en puerto 2222"
echo "Usuario: sageuser"
echo "Contraseña: sage2025!"
