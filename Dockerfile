FROM node:22-alpine

LABEL org.opencontainers.image.source=""
LABEL org.opencontainers.image.description="Demo Node.js app for automated multi-environment deployment pipeline"

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY src ./src

EXPOSE 3000

CMD ["npm", "start"]
