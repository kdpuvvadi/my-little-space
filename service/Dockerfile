# Build on Debian trixie slim
FROM debian:trixie-slim AS build
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg python3 make g++ \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build \
  && npm prune --omit=dev

# Runtime — Debian trixie slim
FROM debian:trixie-slim
WORKDIR /app

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV DATABASE_PATH=/data/meta.sqlite
ENV PORT=3847

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data \
  && chmod 755 /data

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Must stay root: Railway volume mounts are owned by root (docs.railway.com/volumes).
USER root
EXPOSE 3847
VOLUME ["/data"]
CMD ["node", "dist/index.js"]
