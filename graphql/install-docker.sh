set -e

echo "🐳 Installing Docker and Docker Compose..."

sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
sudo systemctl start docker
sudo systemctl enable docker

echo ""
echo "✅ Docker installation completed!"
echo ""
echo "📝 Next steps:"
echo "1. Log out and log back in (Linux) or restart Docker Desktop (macOS/Windows)"
echo "2. Run 'docker --version' to verify installation"
echo "3. Run 'docker run hello-world' to test Docker"
echo "4. Continue with Graph Node setup"