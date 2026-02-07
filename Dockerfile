# Build stage
FROM node:20-alpine AS build-stage
WORKDIR /app

# Copy package files separately to leverage Docker layer caching
COPY package*.json ./

# Use npm install to handle potential lockfile sync issues
RUN npm install

# Copy the rest of the application
COPY . .

# Pass build arguments for Supabase during build only
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_ID

# Run build with injected variables
RUN VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_ID=$VITE_SUPABASE_ANON_ID \
    npm run build

# Production stage
FROM nginx:stable-alpine

# Copy built files
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy and setup env config generation script
COPY generate-env-config.sh /docker-entrypoint.d/01-generate-env.sh
RUN chmod +x /docker-entrypoint.d/01-generate-env.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
