#!/bin/bash

# Must be run from verse root directory
cd "$(dirname "$0")/../.."

echo "🚀 Starting captions consumer..."
uv run python -m apps.captions.consumer
