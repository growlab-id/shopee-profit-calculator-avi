# --- Tahap 1: Build ---
# Gunakan image Node.js versi LTS (Long Term Support) yang ringan (alpine)
FROM node:18-alpine AS builder

# Set working directory di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json terlebih dahulu
# Ini agar Docker bisa memanfaatkan cache layer jika tidak ada perubahan dependency
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy seluruh source code project ke dalam container
COPY . .

# Build project untuk production
RUN npm run build

# --- Tahap 2: Production ---
# Gunakan Nginx alpine yang sangat ringan untuk serving file statis
FROM nginx:alpine

# Copy hasil build dari tahap sebelumnya (folder /dist) ke folder html Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 (port default HTTP)
EXPOSE 80

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]