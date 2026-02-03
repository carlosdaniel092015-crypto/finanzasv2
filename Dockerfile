# Build stage
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install

# Pass build arguments for Supabase
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY

# Set them as ENV for the build process
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_ANON_KEY=$REACT_APP_SUPABASE_ANON_KEY

COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build-stage /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
