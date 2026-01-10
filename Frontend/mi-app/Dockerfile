# 1️⃣ Imagen base
FROM node:20-alpine

# 2️⃣ Directorio de trabajo
WORKDIR /app

# 3️⃣ Copiamos SOLO package.json primero (optimiza cache)
COPY package*.json ./

# 4️⃣ Instalamos dependencias 
RUN npm install

# 5️⃣ Copiamos el resto del proyecto
COPY . .

# 6️⃣ Exponemos el puerto de Vite
EXPOSE 5173

# 7️⃣ Ejecutamos Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]