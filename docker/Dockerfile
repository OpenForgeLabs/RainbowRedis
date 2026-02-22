FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

RUN --mount=type=secret,id=gh_packages_token \
    if [ -f /run/secrets/gh_packages_token ]; then \
      token="$(cat /run/secrets/gh_packages_token)"; \
      printf "@openforgelabs:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=%s\n" "$token" > /root/.npmrc; \
    fi

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/next.config.ts ./next.config.ts
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next

EXPOSE 4011
CMD ["pnpm", "start"]
