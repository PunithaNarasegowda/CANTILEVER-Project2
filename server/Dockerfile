FROM node:18-alpine

WORKDIR /app

# Install only production dependencies
COPY server/package.json server/package-lock.json* ./
RUN npm install --production

# Copy server sources
COPY server ./

EXPOSE 4000

CMD ["node", "src/index.js"]
