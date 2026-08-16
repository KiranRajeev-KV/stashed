#!/usr/bin/env just

# Show available recipes
default:
    @just --list --unsorted

# Install dependencies
install:
    pnpm install

# Start the dev server (SPA + Worker via the Cloudflare Vite plugin)
dev:
    pnpm dev

# Type-check all TypeScript projects
typecheck:
    pnpm exec tsc -b

# Build for production
build:
    pnpm build

# Preview the production build locally
preview:
    pnpm preview

# Lint with Oxlint
lint:
    pnpm lint

# Format with Prettier (writes)
format:
    pnpm format

# Check formatting without writing
format-check:
    pnpm format:check

# Run all quality checks before committing
check: lint format-check typecheck
    pnpm build

# Regenerate wrangler types -> worker-configuration.d.ts
types:
    pnpm cf-typegen

# Login to Cloudflare
login:
    pnpm exec wrangler login

# Build + deploy to Cloudflare
deploy: build
    pnpm exec wrangler deploy

# Generate Drizzle migrations from the schema
db-generate:
    pnpm db:generate

# Apply migrations to the local D1 database
db-local:
    pnpm db:local

# Apply migrations to the remote D1 database
db-remote:
    pnpm db:remote

# Run raw SQL on the local DB: just db-query "SELECT * FROM notes;"
db-query SQL:
    pnpm exec wrangler d1 execute stashed-db --local --command "{{ SQL }}"

# Wipe local D1 state and re-apply migrations from scratch
db-reset: _wipe-local-db db-local

_wipe-local-db:
    @rm -rf .wrangler/state/v3/d1

# Remove generated/build artifacts (dist, wrangler state, tsbuildinfo)
clean:
    @rm -rf dist .wrangler node_modules/.tmp .tanstack/tmp
    @find . -path ./node_modules -prune -o -name "*.tsbuildinfo" -print -exec rm {} +

# Remove build artifacts AND node_modules
clean-all: clean
    @rm -rf node_modules

# Full rebuild from nothing
fresh: clean-all install
