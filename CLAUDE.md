# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Current Project State
This is currently a simple Node.js web server that needs to be transformed into the e-Paldogangsan Next.js TypeScript project.

**Simple Node.js Server (current)**:
```bash
# Start the server
npm start
```

**e-Paldogangsan Project (to be implemented)**:
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

## High-Level Architecture

### Current State
- Simple HTTP server (`server.js`) serving HTML directly on port 3000
- Vercel deployment configuration ready
- Project specification documents outlining the e-Paldogangsan portal requirements

### Target Architecture (e-Paldogangsan)
A Next.js 14 application for discovering South Korean local government shopping malls:

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Search**: Fuse.js (Phase 1), later Meilisearch (Phase 2+)
- **Data Storage**: JSON files initially, no database in Phase 1

### Phase 1 MVP Structure (2-3 weeks)
Key pages and routes to implement:
- `/` - Homepage with interactive SVG map of South Korea
- `/search` - Search page with filtering and results
- `/region/[regionName]` - Region-specific mall listings
- `/about`, `/contact`, `/terms`, `/privacy` - Static pages
- `/api/track-click` - API route for click tracking

### Data Structures
**Mall Data**:
```typescript
{
  id: string,
  name: string,
  url: string,
  region: string,
  tags: string[],
  featured: boolean,
  isNew: boolean,
  clickCount: number,
  lastVerified: string
}
```

**Region Data**:
```typescript
{
  id: string,
  name_ko: string,
  name_en: string,
  description_ko: string,
  mall_count: number,
  highlight_text: string
}
```

### Key Components to Implement
1. **InteractiveMap** - SVG map with region interaction
2. **MallCard** - Display individual mall information
3. **SearchBar** - Fuse.js powered search
4. **QuickFilters** - Category and tag filtering
5. **FeaturedMalls** - Carousel for featured malls

### Performance Requirements
- Page load time < 3 seconds
- Lighthouse score 90+
- Mobile responsive design
- Static generation for all pages where possible

## Development Workflow Preferences

When transforming this project to the e-Paldogangsan Next.js application:
1. Set up Next.js 14 with TypeScript and Tailwind CSS
2. Create the required directory structure under `/app`
3. Implement data structures in `/data` directory
4. Build components incrementally, starting with the map
5. Use Fuse.js for client-side search initially
6. Ensure mobile responsiveness throughout
7. Follow Korean government aesthetic guidelines (clean, official look)

if you generate files which are not explicitically ordered save it in a folder named temporary
use sudo to prevent permission denied
