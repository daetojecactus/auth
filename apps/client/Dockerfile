# --- Stage 1: Install dependencies ---
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json

RUN pnpm install --frozen-lockfile

# --- Stage 2: Build ---
FROM deps AS build

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY apps/client apps/client
RUN cd apps/client && pnpm run build

# --- Stage 3: Production image ---
FROM node:24-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/apps/client/.next/standalone ./
COPY --from=build /app/apps/client/.next/static ./.next/static
COPY --from=build /app/apps/client/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
