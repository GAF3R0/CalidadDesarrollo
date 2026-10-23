# ============================================
# Dockerfile — Backend (Node.js / Express)
# ============================================
FROM node:20-alpine AS base

# Crear directorio de trabajo
WORKDIR /app

# Copiar solo los manifiestos primero (caché de capas de npm install)
COPY package.json package-lock.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar el resto del código fuente
COPY . .

# Crear directorio de uploads si no existe
RUN mkdir -p uploads

# Crear usuario no-root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Exponer el puerto del backend
EXPOSE 4001

# Comando de inicio
CMD ["node", "index.js"]
