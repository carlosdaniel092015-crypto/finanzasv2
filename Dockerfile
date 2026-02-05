# Build stage
FROM node:20-alpine AS build-stage
WORKDIR /app

# Copy package files separately to leverage Docker layer caching
COPY package*.json ./

# Use npm ci for a more reliable and reproducible build
RUN npm ci

# Copy the rest of the application
COPY . .

# Pass build arguments for Supabase (moved here so they don't break dependency cache)
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY

# Set them as ENV for the build process (React will pick these up)
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_ANON_KEY=$REACT_APP_SUPABASE_ANON_KEY

RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build-stage /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
