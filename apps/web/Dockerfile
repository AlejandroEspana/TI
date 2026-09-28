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

# Custom nginx conf to route /api to backend
RUN printf 'server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api/ {\n\
        proxy_pass http://api:8000/api/;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
