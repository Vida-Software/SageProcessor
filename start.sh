#!/bin/bash

# Iniciar SSH daemon
/usr/sbin/sshd &

# Ejecutar las aplicaciones
npm run dev &
python3 duckdb_swarm_api_fixed.py &

# Mantener el contenedor activo
wait