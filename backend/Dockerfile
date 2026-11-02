FROM node:24-alpine

WORKDIR /app

# Install system dependencies (none required beyond node)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY .env.example ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node_modules/.bin/tsx", "src/index.ts"]
