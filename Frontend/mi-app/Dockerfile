FROM node:20-alpine

WORKDIR /app

# Instala deps primero (mejor cache)

COPY package*.json ./
RUN npm ciNo. 

# Copia el resto
COPY . .

EXPOSE 5173

# Importante: --host 0.0.0.0 para que se vea desde fuera del contenedor
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
