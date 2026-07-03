# Trip Planner — one container runs everything: the built web app and the
# agent server on port 5200. Sign-in note: the guided Claude sign-in works
# fully in Docker (URL + paste-the-code). For the ChatGPT/Codex engine the
# OAuth callback can't reach into the container: log in once on the host
# (`npx codex login`) and mount ~/.codex (see docker-compose.yml).
FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV AGENT_HOST=0.0.0.0
EXPOSE 5200

CMD ["node", "server/index.mjs"]
