# ===== SETUP SCRIPT =====
#!/bin/bash
# setup-local-graph.sh

echo "🚀 Setting up Local Graph Node for FounderNFT..."

# Create data directories
mkdir -p data/ipfs data/postgres

# Start Graph Node infrastructure
echo "📦 Starting Graph Node infrastructure..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if Graph Node is ready
echo "🔍 Checking Graph Node status..."
curl -s http://localhost:8000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Graph Node is running on http://localhost:8000"
else
    echo "❌ Graph Node is not responding"
    exit 1
fi

# Check if IPFS is ready
if curl -s http://localhost:5002/api/v0/version >/dev/null 2>&1; then
    echo "✅ IPFS is running on http://localhost:5002"
else
    echo "❌ IPFS is not responding"
    exit 1
fi

echo "🎉 Local Graph Node setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy your FounderNFT contract to Anvil"
echo "2. Update subgraph.yaml with contract address"
echo "3. Run: npm run create-local"
echo "4. Run: npm run deploy-local"