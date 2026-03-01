# Use official Bun image as base
FROM oven/bun:latest AS build
WORKDIR /app

# Copy package descriptors first to leverage Docker cache
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Run tests during build phase
RUN bun test

# Create slim production image
FROM oven/bun:slim AS production
WORKDIR /app

# Run as non-root user
USER bun

# Copy built artifacts/source from the build stage
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

# Command defined in AGENT.md
CMD ["bun", "run", "src/app/index.ts"]
