# Lightweight Node.js image for production
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependency specifications
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application code
COPY src/ ./src/

# Use non-root node user for security
USER node

# Start the bot
CMD ["node", "src/index.js"]
