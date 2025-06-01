# E-Paldogangsan Project Overview

## 📋 Table of Contents
1. [Project Introduction](#project-introduction)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Data Architecture](#data-architecture)
5. [Key Components](#key-components)
6. [API Endpoints](#api-endpoints)
7. [Pages and Routes](#pages-and-routes)
8. [Data Flow](#data-flow)
9. [Deployment](#deployment)
10. [Development Guide](#development-guide)

## 🎯 Project Introduction

**E-Paldogangsan (e-팔도강산)** is a comprehensive web portal that aggregates and showcases local government shopping malls across South Korea. The name "Paldogangsan" (팔도강산) refers to the eight provinces and beautiful mountains of Korea, representing the entire Korean peninsula.

### Purpose
- Centralize access to 100+ local government shopping malls
- Promote regional products and local economies
- Provide easy discovery of specialty products from all Korean regions
- Support local farmers, fishermen, and small businesses

### Key Features
- Interactive map of South Korea for region-based browsing
- Comprehensive product search across all malls
- Category-based filtering (agricultural, seafood, processed foods, etc.)
- Direct links to original shopping mall products
- Mobile-responsive design

## 🛠 Technology Stack

### Frontend
- **Next.js 14.2.3** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Fuse.js** - Client-side fuzzy search

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **File-based data storage** - JSON files for data persistence

### Development Tools
- **ESLint** - Code linting
- **Node.js** - Runtime environment
- **npm** - Package management

### Deployment
- **Vercel** - Hosting and deployment platform

## 📁 Project Structure

```
e-paldogangsan/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── api/                  # API endpoints
│   │   │   ├── products/         # Product data API
│   │   │   ├── sync-products/    # Product synchronization
│   │   │   └── track-click/      # Click tracking
│   │   ├── about/               # About page
│   │   ├── contact/             # Contact page
│   │   ├── privacy/             # Privacy policy
│   │   ├── products/            # All products page
│   │   ├── region/              # Region-specific pages
│   │   │   └── [regionName]/    # Dynamic region routes
│   │   ├── search/              # Search results page
│   │   ├── terms/               # Terms of service
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Homepage
│   │   └── globals.css          # Global styles
│   │
│   ├── components/              # Reusable components
│   │   ├── FeaturedMalls.tsx    # Featured malls carousel
│   │   ├── InteractiveMap.tsx   # Korea SVG map
│   │   ├── MallCard.tsx         # Mall display card
│   │   ├── ProductCard.tsx      # Product display card
│   │   ├── QuickFilters.tsx     # Category filters
│   │   └── SearchBar.tsx        # Search with autocomplete
│   │
│   ├── data/                    # Static data files
│   │   ├── categories.json      # Product categories
│   │   ├── malls.json          # 100 shopping malls
│   │   ├── products.json       # 451 products
│   │   ├── regions.json        # 17 Korean regions
│   │   └── tag-mapping.json    # Tag categorization
│   │
│   ├── lib/                     # Utility functions
│   │   ├── data.ts             # Data access functions
│   │   ├── product-sync.ts     # Product sync service
│   │   ├── cron-config.ts      # Cron job configuration
│   │   └── scrapers/           # Web scraping utilities
│   │       ├── base-scraper.ts
│   │       ├── generic-scraper.ts
│   │       └── scraper-registry.ts
│   │
│   └── types/                   # TypeScript definitions
│       └── index.ts            # Shared type definitions
│
├── backup/                      # Data backups
│   ├── mergedmalls.txt         # Consolidated mall list
│   └── products-sample.json    # Sample product data
│
├── public/                      # Static assets
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies
├── CLAUDE.md                   # AI assistant instructions
├── CRON_SETUP.md              # Cron job documentation
└── PROJECT_OVERVIEW.md         # This file
```

## 🗄 Data Architecture

### 1. Malls Data (`malls.json`)
```typescript
{
  id: string;           // Unique identifier (e.g., "mall_1_온서울마켓")
  name: string;         // Korean name
  url: string;          // Mall website URL
  region: string;       // Korean region name (서울, 부산, etc.)
  tags: string[];       // Categories/features
  featured: boolean;    // Featured status
  isNew: boolean;       // New mall indicator
  clickCount: number;   // Popularity metric
  lastVerified: string; // Date last checked
  district?: string;    // Optional sub-region
}
```

Total: **100 shopping malls** across 17 regions

### 2. Products Data (`products.json`)
```typescript
{
  id: string;              // Unique identifier
  name: string;            // Product name
  description: string;     // Product description
  price: string;           // Current price (Korean format)
  originalPrice?: string;  // Original price if discounted
  imageUrl: string;        // Product image URL
  productUrl: string;      // Link to product page
  mallId: string;          // Associated mall ID
  mallName: string;        // Mall name for display
  category: string;        // Product category
  tags: string[];          // Search tags
  inStock: boolean;        // Availability status
  lastUpdated: string;     // Last update timestamp
  createdAt: string;       // Creation timestamp
}
```

Total: **451 products** with real data for featured malls

### 3. Regions Data (`regions.json`)
```typescript
{
  id: string;           // Region identifier (e.g., "seoul")
  name_ko: string;      // Korean name (서울)
  name_en: string;      // English name
  description_ko: string; // Korean description
  mall_count: number;   // Number of malls
  highlight_text: string; // Featured text
}
```

17 regions covering all of South Korea:
- Metropolitan cities: Seoul, Busan, Daegu, Incheon, Gwangju, Daejeon, Ulsan, Sejong
- Provinces: Gyeonggi, Gangwon, Chungbuk, Chungnam, Jeonbuk, Jeonnam, Gyeongbuk, Gyeongnam, Jeju

### 4. Categories Data (`categories.json`)
```typescript
{
  id: string;        // Category identifier
  name: string;      // Korean name
  slug: string;      // URL-friendly name
  icon?: string;     // Optional icon
}
```

10 main categories:
- agricultural (농산물)
- seafood (수산물)
- livestock (축산물)
- processed (가공식품)
- health (건강식품)
- traditional (전통식품)
- specialty (지역특산품)
- eco_friendly (친환경인증)
- crafts (공예품)
- other (기타)

## 🧩 Key Components

### 1. InteractiveMap Component
- SVG-based map of South Korea
- Clickable regions with hover effects
- Mobile-responsive with auto-scroll
- Region-based mall filtering
- Visual feedback for selection

### 2. SearchBar Component
- Real-time search with Fuse.js
- Autocomplete suggestions
- Keyboard navigation support
- Search across mall names, tags, and regions
- Configurable placeholder text

### 3. ProductCard Component
- Product image with fallback
- Price display with discount indicator
- Category badges with color coding
- Mall attribution
- Click-through to original product
- Stock status indicator

### 4. MallCard Component
- Mall information display
- Tag visualization
- Click tracking integration
- Featured/New badges
- Region indication

### 5. QuickFilters Component
- Category-based filtering
- Visual filter pills
- Multi-select capability
- Result count display

## 🔌 API Endpoints

### 1. GET `/api/products`
Fetches product data with optional filtering

Query parameters:
- `category` - Filter by category
- `mallId` - Filter by specific mall
- `search` - Search query
- `limit` - Limit results

Response:
```json
{
  "products": [...],
  "total": 451,
  "timestamp": "2025-06-01T..."
}
```

### 2. POST `/api/sync-products`
Synchronizes products from mall websites (requires auth)

Headers:
- `Authorization: Bearer {SYNC_API_KEY}`

Response:
```json
{
  "success": true,
  "message": "Synced 6 malls",
  "timestamp": "2025-06-01T..."
}
```

### 3. POST `/api/track-click`
Records mall click events for analytics

Body:
```json
{
  "mallId": "mall_1_온서울마켓"
}
```

## 📄 Pages and Routes

### Static Pages
- `/` - Homepage with map and featured malls
- `/about` - About the platform
- `/contact` - Contact information
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/products` - All products grid view
- `/search` - Search results page

### Dynamic Routes
- `/region/[regionName]` - Region-specific mall listings
  - Examples: `/region/seoul`, `/region/busan`, `/region/gangwon`
  - Shows all malls and products from that region

## 🔄 Data Flow

### 1. Homepage Flow
```
User lands on homepage
  ↓
InteractiveMap loads with regions data
  ↓
User clicks region or uses search
  ↓
Navigation to region page or search results
```

### 2. Product Discovery Flow
```
User browses products
  ↓
Filters by category/region/search
  ↓
Views product details
  ↓
Clicks through to original mall
  ↓
Click tracked via API
```

### 3. Data Sync Flow
```
Cron job triggers sync API
  ↓
Scraper fetches mall products
  ↓
Products updated in JSON file
  ↓
Changes reflected on next request
```

## 🚀 Deployment

### Vercel Deployment
The project is configured for Vercel deployment with:
- Automatic builds on push to `pre-production` branch
- Environment variables for API keys
- Static generation for optimal performance
- Edge runtime for API routes

### Environment Variables
```env
SYNC_API_KEY=your_sync_api_key_here
```

### Build Configuration
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## 👨‍💻 Development Guide

### Setup
```bash
# Clone repository
git clone https://github.com/Dyskid/e-paldogangsan.git

# Install dependencies
npm install

# Run development server
npm run dev
```

### Key Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New Malls
1. Update `src/data/malls.json` with mall information
2. Add products to `src/data/products.json`
3. Update region counts in `src/data/regions.json`
4. Optionally add scraper configuration

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Tailwind CSS for styling
- Async/await for asynchronous code
- ESLint rules enforced

### Git Workflow
- Main branch: `main`
- Development branch: `pre-production`
- Feature branches from `pre-production`
- Pull requests for code review

## 📝 Notes

### Data Sources
- Mall list consolidated from government sources
- Product data scraped from individual mall websites
- Regular updates via cron jobs (when configured)

### Future Enhancements
- User accounts and favorites
- Price tracking and alerts
- Advanced filtering options
- Mall reviews and ratings
- Mobile app development
- Real-time inventory updates

### Performance Considerations
- Static generation for all pages where possible
- Image optimization with Next.js Image component
- Client-side search for instant results
- Lazy loading for product grids
- CDN distribution via Vercel

---

Last Updated: 2025-06-01
Version: 1.0.0