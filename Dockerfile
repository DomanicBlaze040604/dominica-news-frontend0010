# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create necessary directories with proper permissions
RUN mkdir -p /tmp/logs /tmp/uploads && \
    chown -R nodejs:nodejs /tmp/logs /tmp/uploads

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY dist/ ./dist/
COPY start-production.js ./
COPY .env.production ./

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV ENABLE_FILE_LOGGING=false
ENV LOG_DIRECTORY=/tmp/logs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]