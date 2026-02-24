# =============================================
# Stage 1: Build the React Frontend
# =============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Install dependencies
COPY client/package*.json ./
RUN npm install

# Copy source and build
COPY client/ ./
RUN npm run build

# =============================================
# Stage 2: Production Server
# =============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy server source
COPY server/ ./

# Copy built frontend into server's public folder
# The server will serve the frontend statically
COPY --from=frontend-builder /app/client/dist ./public

# Create uploads directory
RUN mkdir -p uploads

# Expose the server port
EXPOSE 3000

# Start the server
CMD ["node", "src/index.js"]
