#!/bin/sh
# Generate env-config.js from environment variables at container startup
# Supports both VITE_ and REACT_APP_ prefixes for Easypanel compatibility

# Get values with fallback logic
SUPABASE_URL="${VITE_SUPABASE_URL:-${REACT_APP_SUPABASE_URL}}"
SUPABASE_ANON_ID="${VITE_SUPABASE_ANON_ID:-${REACT_APP_SUPABASE_ANON_ID}}"

cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  VITE_SUPABASE_URL: "${SUPABASE_URL}",
  VITE_SUPABASE_ANON_ID: "${SUPABASE_ANON_ID}"
};
EOF

echo "✅ Generated env-config.js with runtime environment variables"
