#!/bin/sh
# Generate env-config.js from environment variables at container startup
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_ID: "${VITE_SUPABASE_ANON_ID}"
};
EOF

echo "✅ Generated env-config.js with runtime environment variables"
