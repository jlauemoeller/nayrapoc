# Single-stage image for the nayra demo deployment.
#
# Deliberately NOT a Next.js `output: "standalone"` image: the hourly demo reset
# runs `drizzle-kit migrate` + the tsx reset scripts *inside* the running
# container, so we need the full source, scripts/, drizzle/ and devDependencies
# at runtime. Image size is irrelevant for a single-instance demo.
FROM node:22-alpine

WORKDIR /app

# corepack ships with Node; pin the same pnpm the repo uses.
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Install deps first for layer caching. Keep devDependencies — drizzle-kit and
# tsx are needed at runtime for migrate + reset.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# `next build` evaluates the api/auth/[...nextauth] route at module load, which
# reads NEXTAUTH_SECRET (and the email vars). These throwaway values exist only
# to get the build to complete; real values are injected at runtime by compose.
ENV NEXTAUTH_SECRET=build-time-placeholder \
    NEXTAUTH_URL=http://localhost:3000 \
    EMAIL_SERVER_USER=build \
    EMAIL_SERVER_PASSWORD=build \
    EMAIL_SERVER_HOST=build \
    EMAIL_SERVER_PORT=587 \
    EMAIL_FROM=build@example.com
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
