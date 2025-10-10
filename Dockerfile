# Use official Node image
FROM node:20-alpine

# Create app dir
WORKDIR /usr/src/app

# Install curl for healthcheck and CA certificates
RUN apk add --no-cache curl

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the rest of the app
COPY . .

# Expose the port your app listens on
EXPOSE 3000

# Healthcheck (make sure you have a GET /health endpoint in index.js)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start your app
CMD ["node", "index.js"]