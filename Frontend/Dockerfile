# ============================================
# Dockerfile — Frontend (React / Vite + Nginx)
# ============================================

# --- Etapa 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app

# Copiar manifiestos para caché de capas
COPY package.json package-lock.json ./

# Instalar todas las dependencias (incluyendo dev para build)
RUN npm ci

# Copiar código fuente
COPY . .

# Recibir la URL de la API como argumento de build
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Construir la app para producción
RUN npm run build

# --- Etapa 2: Servir con Nginx ---
FROM nginx:alpine AS production

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos generados por Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto de Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
