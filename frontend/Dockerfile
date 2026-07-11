# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install npm packages
RUN npm install

# Copy application files
COPY . .

# Expose Vite dev port
EXPOSE 3000

# Start Vite dev server
CMD ["npm", "run", "dev"]
