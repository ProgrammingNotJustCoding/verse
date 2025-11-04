#!/bin/bash

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONNECTOR_CONFIG="${SCRIPT_DIR}/connectors/captions-sink.json"
CONNECTOR_FULL="${SCRIPT_DIR}/connectors/captions-sink-full.json"

# Verify the connector files exist
if [ ! -f "$CONNECTOR_CONFIG" ]; then
  echo "ERROR: Connector config not found at: $CONNECTOR_CONFIG"
  exit 1
fi

if [ ! -f "$CONNECTOR_FULL" ]; then
  echo "ERROR: Connector full config not found at: $CONNECTOR_FULL"
  exit 1
fi

# Wait for Kafka Connect to be ready
echo "Waiting for Kafka Connect to be ready..."
until curl -s http://localhost:8083/ > /dev/null; do
  echo "Kafka Connect not ready yet..."
  sleep 5
done

echo "✓ Kafka Connect is ready!"

# Check if connector already exists
if curl -s http://localhost:8083/connectors | grep -q "captions-sink"; then
  echo "Connector 'captions-sink' already exists. Updating config..."
  curl -X PUT \
    -H "Content-Type: application/json" \
    --data "@${CONNECTOR_CONFIG}" \
    http://localhost:8083/connectors/captions-sink/config
else
  echo "Creating new connector 'captions-sink'..."
  curl -X POST \
    -H "Content-Type: application/json" \
    --data "@${CONNECTOR_FULL}" \
    http://localhost:8083/connectors
fi

echo ""
echo ""
echo "Connector status:"
curl -s http://localhost:8083/connectors/captions-sink/status | jq .

echo ""
echo "Available connectors:"
curl -s http://localhost:8083/connectors | jq .

echo ""
echo "✅ Kafka Connect setup complete!"
