# tamagotmi

A production-quality full-stack web application for managing a personal Tamagotchi collection and maintaining an editable Tamagotchi wiki/database.

## Features

- **My Collection** — Grid/list views with NIB/IOB badges, favorites, filters, and expandable "Show more info"
- **Add Device** — Creatable device type and shell comboboxes with photo upload
- **Device Library** — Canonical database organized by family (Vintage, Connection, Modern, Classic Remakes)
- **Shell Catalog** — Visual shell database with ownership indicators and wishlist
- **Wiki** — Rich encyclopedia pages with TOC, infobox, TipTap editor, revision history
- **Global Search** — Fuzzy search across devices, shells, collection, and wiki (⌘K)
- **Admin** — Device management, TamaShell import preview, duplicate merge tools
- **Export** — CSV/JSON collection export

## Tech Stack

- Next.js 16, TypeScript, React, Tailwind CSS
- PostgreSQL, Prisma ORM
- NextAuth (credentials)
- TipTap rich-text editor
- Zod, React Hook Form, Fuse.js

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Vercel: enable Neon storage vars for Production, Preview, AND Development
# (Build step needs them if pages query the database at build time)

# Run migrations and seed
npx prisma migrate dev
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Account

- Email: `demo@tamagotmi.app`
- Password: `demo1234`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm test` | Run tests |
| `npm run db:seed` | Seed database |
| `npm run db:migrate` | Run migrations |

## Architecture

The data model separates three core entities:

1. **DeviceModel** — e.g. "Tamagotchi Connection Version 1"
2. **Shell** — e.g. "Blue Waves" (belongs to a DeviceModel)
3. **OwnedDevice** — Your physical copy (links to model + optional shell)

Wiki pages, revisions, citations, and device properties support a growing collector database without schema migrations for every attribute.

## License

Private project.
