FROM node:20

# Dépendances pour compiler sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /lft-backend

# Install only production dependencies
COPY ./package*.json ./

# Installe sqlite3 avec compilation native
RUN npm install --build-from-source sqlite3

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 3000

# Use nodemon for development, which should already be in your package.json
CMD ["npx", "nodemon", "server.js"]