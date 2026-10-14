# deps
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# build
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
COPY drizzle ./drizzle
RUN npm run build

# prod-deps
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# minimal runtime image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./
# SQL migrations applied on startup via `npm start` (node dist/db/migrate.js).
COPY drizzle ./drizzle
# swagger-jsdoc reads route source files at runtime (apis: ["./src/routes/*.ts"]),
# so the source is required for the API docs to populate.
COPY src ./src
EXPOSE 3000
CMD ["npm", "start"]
