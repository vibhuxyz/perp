#!/usr/bin/env bash
set -euo pipefail

echo "=== Initializing EC2 Host for Perp Exchange & Shared Infrastructure ==="

sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git ufw

if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

# Kafka KRaft kernel parameters
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.d/99-kafka.conf
sudo sysctl -w fs.file-max=2097152

# Firewall rules
sudo ufw allow 22/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw allow 7070/tcp || true
sudo ufw --force enable || true

# Global shared Docker network for multi-project usage
sudo docker network create shared-services 2>/dev/null || true

# Setup Standalone Shared Kafka infrastructure
SHARED_DIR="/opt/shared-infra"
sudo mkdir -p "${SHARED_DIR}"
sudo chown -R "$USER:$USER" "${SHARED_DIR}"

cat << 'EOF' > "${SHARED_DIR}/docker-compose.yml"
name: shared-infra

networks:
  shared-services:
    external: true

volumes:
  shared_kafka_data:

services:
  kafka:
    image: apache/kafka-native:3.9.0
    container_name: shared-kafka
    restart: always
    networks:
      - shared-services
    ports:
      - "9092:9092"
      - "29092:29092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093,PLAINTEXT_HOST://0.0.0.0:29092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://shared-kafka:9092,PLAINTEXT_HOST://localhost:29092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@shared-kafka:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
    volumes:
      - shared_kafka_data:/var/lib/kafka/data
EOF

# Start shared Kafka container
cd "${SHARED_DIR}"
sudo docker compose up -d

# Application workspace
APP_DIR="/opt/perp"
sudo mkdir -p "${APP_DIR}"
sudo chown -R "$USER:$USER" "${APP_DIR}"

echo "=== EC2 Host Setup Complete ==="
echo "Shared Kafka is running in container 'shared-kafka'."
echo "Please re-login or run 'newgrp docker' to apply group permissions."
