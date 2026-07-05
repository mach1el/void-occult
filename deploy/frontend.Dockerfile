FROM node:24-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig*.json vite.config.ts ./
COPY src ./src
COPY pages ./pages
RUN npm run build

FROM nginx:alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
