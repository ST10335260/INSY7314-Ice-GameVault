# ---- GameVault API image ----
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies (reproducible via package-lock.json)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# Run as the unprivileged "node" user, never as root
RUN mkdir -p logs && chown -R node:node /app
USER node

EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
