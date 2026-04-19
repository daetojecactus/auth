# --- Stage 1: Install dependencies ---
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/client/package.json apps/client/package.json

RUN pnpm install --frozen-lockfile

# --- Stage 2: Build ---
FROM deps AS build
COPY apps/server apps/server
RUN cd apps/server && pnpm exec prisma generate && pnpm run build

# --- Stage 3: Production dependencies ---
FROM deps AS prod-deps
RUN pnpm install --frozen-lockfile --prod

# --- Stage 4: Production image ---
FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/server/package.json ./apps/server/package.json

WORKDIR /app/apps/server

EXPOSE 4000

CMD ["node", "dist/main.js"]
