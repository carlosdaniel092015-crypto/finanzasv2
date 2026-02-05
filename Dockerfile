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
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY

# Run build with injected variables
RUN REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL \
    REACT_APP_SUPABASE_ANON_KEY=$REACT_APP_SUPABASE_ANON_KEY \
    npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build-stage /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
