# Stage 1: Build static assets
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Pass VITE_API_URL during build time (can also default to empty to fall back to window.location origin/default in api.js)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve static assets with Nginx
FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration if needed, or default is fine for single page apps with hash routing/no routing
# For standard tab routing inside App.jsx, the default Nginx configuration works perfectly because there are no actual subpaths.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
