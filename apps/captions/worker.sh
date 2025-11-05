#!/bin/bash

# Must be run from verse root directory
cd "$(dirname "$0")/../.."

# Run the caption worker using the old working method
uv run python -m apps.captions.main dev
