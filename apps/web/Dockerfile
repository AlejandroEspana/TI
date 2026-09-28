FROM node:20-alpine AS build

WORKDIR /app

# Copy root workspace configurations
COPY package.json package-lock.json* tsconfig.json ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/

# Install dependencies across monorepo
RUN npm install

# Copy web source code
COPY apps/web/ ./apps/web/

# Build static assets
WORKDIR /app/apps/web
RUN npm run build

# Nginx production stage
FROM nginx:alpine

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Custom nginx conf with dynamic DNS resolution to route /api to backend
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
