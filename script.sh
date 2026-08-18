#!/bin/bash

# 1. Ask for your Tabitoken API key safely
read -sp "Enter your Tabitoken API key: " TABITOKEN_KEY
echo ""

# 2. Check if the key was provided
if [ -z "$TABITOKEN_KEY" ]; then
    echo "❌ Error: API key cannot be empty."
    exit 1
fi

# 3. Create the custom opencode.json config file in the current directory
echo "📝 Creating custom config file..."
cat << EOF > opencode.json
{
  "\$schema": "https://opencode.ai",
  "provider": {
    "openai-compatible": {
      "name": "Tabitoken",
      "options": {
        "baseURL": "https://tabitoken.com",
        "apiKey": "$TABITOKEN_KEY"
      }
    }
  }
}
EOF

echo "✅ opencode.json file created successfully!"

# 4. Launch OpenCode pointing directly to the new configuration
echo "🚀 Launching OpenCode agent with custom config..."
opencode --config ./opencode.json

