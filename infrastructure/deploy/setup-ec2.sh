#!/usr/bin/env bash
set -euo pipefail

echo "=== Initializing EC2 Host for Perp Exchange ==="

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

sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.d/99-kafka.conf
sudo sysctl -w fs.file-max=2097152

sudo ufw allow 22/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw --force enable || true

APP_DIR="/opt/perp"
sudo mkdir -p "${APP_DIR}"
sudo chown -R "$USER:$USER" "${APP_DIR}"

echo "=== EC2 Host Setup Complete ==="
echo "Please re-login or run 'newgrp docker' to apply group permissions."
