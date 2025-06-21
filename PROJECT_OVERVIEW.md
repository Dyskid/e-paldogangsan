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
backup/
  ├── categories.txt
  ├── claude command for phase1.txt
  ├── e-Paldogangsan Phase 1 MVP Specific.txt
  ├── mergedmalls.txt
  ├── Project Title e-Paldogangsan South.txt
  ├── scrapercommand.txt
scripts/
  ├── output/
  │   ├── batch-scrape/
  │   │   ├── batch-registration-summary.json
  │   │   ├── batch-scrape-summary.json
  │   │   ├── dangjin-farm-products.json
  │   │   ├── danpoong-mall-products.json
  │   │   ├── hampyeong-cheonji-products.json
  │   │   ├── hamyang-mall-products.json
  │   ├── debug/
  │   │   ├── ejeju-cat26-page1.html
  │   │   ├── ejeju-cat27-page1.html
  │   │   ├── ejeju-cat28-page1.html
  │   │   ├── ejeju-cat29-page1.html
  │   │   ├── ejeju-cat30-page1.html
  │   │   ├── ejeju-cat31-page1.html
  │   │   ├── ejeju-cat31008-page1.html
  │   │   ├── ejeju-cat32-page1.html
  │   │   ├── ontongdaejeon-product-1750420391361.html
  │   │   ├── ontongdaejeon-product-1750420393867.html
  │   │   ├── ontongdaejeon-product-1750420396332.html
  │   │   ├── ontongdaejeon-product-1750420399656.html
  │   │   ├── ontongdaejeon-product-1750420402178.html
  │   ├── retry-scrape/
  │   │   ├── jps-mall-products.json
  │   │   ├── retry-registration-summary.json
  │   │   ├── retry-scrape-summary.json
  │   ├── all-malls-analysis.json
  │   ├── all-malls-products.json
  │   ├── category-cleanup-report.json
  │   ├── category-products-analysis.json
  │   ├── chack3-homepage.html
  │   ├── chack3-mall-suggestion.json
  │   ├── chack3-products.json
  │   ├── chack3-registration-summary.json
  │   ├── chack3-scrape-summary.json
  │   ├── chack3-structure-analysis.json
  │   ├── chack3-verification-report.json
  │   ├── chamdalseong-analysis-final.json
  │   ├── chamds-analysis-final.json
  │   ├── chamds-analysis.json
  │   ├── chamds-detailed-analysis.json
  │   ├── chamds-food-registration-summary.json
  │   ├── chamds-food-verification-final.json
  │   ├── chamds-homepage.html
  │   ├── chamds-image-real-fix-summary.json
  │   ├── chamds-main-analysis.html
  │   ├── chamds-page-_product_list_html.html
  │   ├── chamds-products-_product_list.html.html
  │   ├── chamds-products.json
  │   ├── chamds-registration-summary.json
  │   ├── chamds-scrape-summary.json
  │   ├── chamds-structure-analysis.json
  │   ├── chamds-verification-report.json
  │   ├── donghae-analysis.json
  │   ├── donghae-homepage.html
  │   ├── donghae-product-1.html
  │   ├── donghae-product-sample.html
  │   ├── donghae-products.json
  │   ├── donghae-registration-summary.json
  │   ├── donghae-scrape-summary.json
  │   ├── donghae-verification-report.json
  │   ├── ejeju-mall-products-comprehensive.json
  │   ├── ejeju-mall-products.json
  │   ├── ejeju-mall-summary-comprehensive.json
  │   ├── ejeju-mall-summary.json
  │   ├── ejeju-registration-summary.json
  │   ├── ejeju-test-page.html
  │   ├── ejeju-verification-report.json
  │   ├── gangneung-analysis.json
  │   ├── gangneung-homepage.html
  │   ├── gangneung-product-1.html
  │   ├── gangneung-product-sample.html
  │   ├── gangneung-products.json
  │   ├── gangneung-registration-summary.json
  │   ├── gangneung-scrape-summary.json
  │   ├── gangneung-verification-report.json
  │   ├── gimhaemall-page.html
  │   ├── gimhaemall-real-products.json
  │   ├── gmsocial-all-products.json
  │   ├── gmsocial-analysis.json
  │   ├── gmsocial-category-scrape-summary.json
  │   ├── gmsocial-extracted-products.json
  │   ├── gmsocial-food-category.html
  │   ├── gmsocial-homepage.html
  │   ├── gmsocial-product-sample.html
  │   ├── gmsocial-registration-summary.json
  │   ├── gmsocial-test-food-category.html
  │   ├── gmsocial-verification-report.json
  │   ├── goseong-analysis.json
  │   ├── goseong-homepage.html
  │   ├── goseong-product-1.html
  │   ├── goseong-product-sample.html
  │   ├── goseong-products.json
  │   ├── goseong-registration-summary.json
  │   ├── goseong-scrape-summary.json
  │   ├── goseong-verification-report.json
  │   ├── gwdmall-analysis.json
  │   ├── gwdmall-homepage-content.html
  │   ├── gwdmall-homepage.html
  │   ├── gwdmall-products.json
  │   ├── gwdmall-registration-summary.json
  │   ├── gwdmall-scrape-summary.json
  │   ├── gwdmall-test-category.html
  │   ├── gwdmall-test-product.html
  │   ├── gwdmall-verification-report.json
  │   ├── gwdmall-working-products.json
  │   ├── gwdmall-working-summary.json
  │   ├── individual-products-verification-all-malls.json
  │   ├── integration-summary.json
  │   ├── jeju-image-fallback-summary.json
  │   ├── jeju-image-fix-summary.json
  │   ├── jeju-listing-titles.json
  │   ├── jeju-mall-all-products.json
  │   ├── jeju-mall-analysis.json
  │   ├── jeju-mall-api-response.json
  │   ├── jeju-mall-final-products.json
  │   ├── jeju-mall-page.html
  │   ├── jeju-mall-products-ajax.json
  │   ├── jeju-mall-products-complete.json
  │   ├── jeju-mall-products-sample.json
  │   ├── jeju-mall-products-summary.json
  │   ├── jeju-mall-products.json
  │   ├── jeju-mall-real-products.json
  │   ├── jeju-mall-real-summary.json
  │   ├── jeju-mall-scrape-errors.txt
  │   ├── jeju-mall-scrape-summary-full.json
  │   ├── jeju-mall-scrape-summary.json
  │   ├── jeju-mall-summary.json
  │   ├── jeju-mall-urls.txt
  │   ├── jeju-price-fix-summary.json
  │   ├── jeju-products-removal-summary.json
  │   ├── jeju-real-images-summary.json
  │   ├── jeju-real-titles.json
  │   ├── jeju-title-update-report.json
  │   ├── kkimchi-analysis.json
  │   ├── kkimchi-category-_index.php_cate_004.html
  │   ├── kkimchi-category-_index.php_cate_004001.html
  │   ├── kkimchi-category-_index.php_cate_005.html
  │   ├── kkimchi-category-_index.php_cate_005001.html
  │   ├── kkimchi-category-_index.php_cate_005002.html
  │   ├── kkimchi-category-_index.php_cate_005003.html
  │   ├── kkimchi-category-_index.php_cate_006.html
  │   ├── kkimchi-food-registration-summary.json
  │   ├── kkimchi-food-verification-final.json
  │   ├── kkimchi-homepage.html
  │   ├── kkimchi-products.json
  │   ├── kkimchi-registration-summary.json
  │   ├── kkimchi-scrape-summary.json
  │   ├── kkimchi-verification-report.json
  │   ├── ontongdaejeon-analysis.json
  │   ├── ontongdaejeon-cleaning-verification-report.json
  │   ├── ontongdaejeon-detail-100416837.html
  │   ├── ontongdaejeon-enhanced-all-products.json
  │   ├── ontongdaejeon-enhanced-food-products.json
  │   ├── ontongdaejeon-enhanced-summary.json
  │   ├── ontongdaejeon-final-summary.json
  │   ├── ontongdaejeon-food-products-with-prices.json
  │   ├── ontongdaejeon-food-products.json
  │   ├── ontongdaejeon-food-registration-summary.json
  │   ├── ontongdaejeon-food-scrape-summary.json
  │   ├── ontongdaejeon-homepage.html
  │   ├── ontongdaejeon-main-analysis.html
  │   ├── ontongdaejeon-price-structure-analysis.json
  │   ├── ontongdaejeon-price-test-results.json
  │   ├── ontongdaejeon-price-test-summary.json
  │   ├── ontongdaejeon-product-ids.json
  │   ├── ontongdaejeon-products-with-prices.json
  │   ├── ontongdaejeon-products.json
  │   ├── ontongdaejeon-registration-summary.json
  │   ├── ontongdaejeon-scrape-summary.json
  │   ├── ontongdaejeon-verification-report.json
  │   ├── ontongdaejeon-with-prices-registration-summary.json
  │   ├── ontongdaejeon-with-prices-summary.json
  │   ├── osansemall-category-debug.html
  │   ├── osansemall-homepage.html
  │   ├── osansemall-main-analysis.json
  │   ├── osansemall-products.json
  │   ├── osansemall-registration-summary.json
  │   ├── osansemall-sample-product.html
  │   ├── osansemall-scrape-summary.json
  │   ├── osansemall-structure-analysis.json
  │   ├── osansemall-verification-report.json
  │   ├── problematic-mall-products.json
  │   ├── products-backup-1750327814345.json
  │   ├── products-backup-1750500297722.json
  │   ├── products-backup-1750501203131.json
  │   ├── products-without-prices.txt
  │   ├── samcheok-analysis.json
  │   ├── samcheok-homepage.html
  │   ├── samcheok-product-1.html
  │   ├── samcheok-product-sample.html
  │   ├── samcheok-products.json
  │   ├── samcheok-registration-summary.json
  │   ├── samcheok-scrape-summary.json
  │   ├── samcheok-verification-report.json
  │   ├── sjlocal-analysis-report.md
  │   ├── sjlocal-homepage.html
  │   ├── sjlocal-product-analysis.json
  │   ├── sjlocal-product-page.html
  │   ├── sjlocal-products.json
  │   ├── sjlocal-scrape-summary.json
  │   ├── sjlocal-simple-analysis.json
  │   ├── unknown-mall-removal-summary.json
  │   ├── wemall-analysis.json
  │   ├── wemall-category-001.html
  │   ├── wemall-category-010.html
  │   ├── wemall-final-summary.json
  │   ├── wemall-food-filter-summary.json
  │   ├── wemall-food-products-final.json
  │   ├── wemall-food-registration-summary.json
  │   ├── wemall-food-verification-final.json
  │   ├── wemall-food-verification-report.json
  │   ├── wemall-homepage.html
  │   ├── wemall-individual-products-verification.json
  │   ├── wemall-products.json
  │   ├── wemall-registration-summary.json
  │   ├── wemall-scrape-summary.json
  │   ├── wemall-verification-report.json
  │   ├── wonju-analysis.json
  │   ├── wonju-homepage.html
  │   ├── wonju-products.json
  │   ├── wonju-registration-summary.json
  │   ├── wonju-scrape-summary.json
  │   ├── wonju-test-category.html
  │   ├── wonju-test-product.html
  │   ├── wonju-verification-report.json
  │   ├── yangju-analysis.json
  │   ├── yangju-careful-products.json
  │   ├── yangju-careful-summary.json
  │   ├── yangju-homepage-content.html
  │   ├── yangju-homepage.html
  │   ├── yangju-products.json
  │   ├── yangju-registration-summary.json
  │   ├── yangju-scrape-summary.json
  │   ├── yangju-verification-report.json
  ├── analyze-all-malls.ts
  ├── analyze-chack3-structure.ts
  ├── analyze-chamdalseong-smartstore.ts
  ├── analyze-chamds-detailed.ts
  ├── analyze-chamds-homepage.ts
  ├── analyze-chamds-structure.ts
  ├── analyze-donghae-structure.ts
  ├── analyze-ejeju-mall-structure.ts
  ├── analyze-gangneung-structure.ts
  ├── analyze-gimhaemall-structure.ts
  ├── analyze-gmsocial-structure.ts
  ├── analyze-goseong-structure.ts
  ├── analyze-gwdmall-structure.ts
  ├── analyze-jeju-mall-ajax.ts
  ├── analyze-jeju-mall-structure.ts
  ├── analyze-jeju-mall.ts
  ├── analyze-kkimchi-structure.ts
  ├── analyze-ontongdaejeon-price-structure.ts
  ├── analyze-ontongdaejeon-structure.ts
  ├── analyze-osansemall-main-page.ts
  ├── analyze-osansemall-structure.ts
  ├── analyze-samcheok-structure.ts
  ├── analyze-sjlocal-products.ts
  ├── analyze-sjlocal-simple.ts
  ├── analyze-sjlocal-structure.ts
  ├── analyze-smartstore-with-retry.ts
  ├── analyze-wemall-structure.ts
  ├── analyze-wonju-structure.ts
  ├── analyze-yangju-structure.ts
  ├── batch-scrape-all-malls.ts
  ├── check-jeju-titles.ts
  ├── check-mall-details.js
  ├── check-mall-structure.js
  ├── check-price-status.js
  ├── classify-products.ts
  ├── clean-and-verify-ontongdaejeon-products.ts
  ├── clean-category-products.ts
  ├── clean-extracted-titles.ts
  ├── clean-jeju-titles.ts
  ├── comprehensive-jeju-title-update.ts
  ├── create-jeju-products-dataset.ts
  ├── debug-osansemall-category.ts
  ├── enrich-jeju-products.ts
  ├── explore-chamds-categories.ts
  ├── explore-kkimchi-categories.ts
  ├── explore-kkimchi-shop.ts
  ├── explore-ontongdaejeon-categories.ts
  ├── extract-jeju-mall-urls.ts
  ├── extract-ontongdaejeon-prices-axios.ts
  ├── extract-ontongdaejeon-prices.ts
  ├── extract-real-jeju-titles.ts
  ├── fetch-real-jeju-images-axios.ts
  ├── fetch-real-jeju-images.ts
  ├── fetch-real-jeju-titles.ts
  ├── filter-wemall-food-products.ts
  ├── final-verification.ts
  ├── find-chamds-categories.ts
  ├── find-remaining-issue.ts
  ├── fix-chamds-images-real.ts
  ├── fix-final-generic-title.ts
  ├── fix-jeju-images-fallback.ts
  ├── fix-jeju-images.ts
  ├── fix-jeju-prices.ts
  ├── fix-priority-malls.ts
  ├── fix-specific-jeju-titles.ts
  ├── identify-category-products.ts
  ├── improve-scraped-titles.ts
  ├── integrate-final-jeju-products.ts
  ├── integrate-jeju-products.ts
  ├── list-problematic-products.js
  ├── ontongdaejeon-final-summary.ts
  ├── overview-helpers.ts
  ├── README.md
  ├── register-all-mall-products.ts
  ├── register-batch-products.ts
  ├── register-chack3-products.ts
  ├── register-chamds-food-products.ts
  ├── register-chamds-products.ts
  ├── register-donghae-products.ts
  ├── register-ejeju-products.ts
  ├── register-gangneung-products.ts
  ├── register-gmsocial-clean.ts
  ├── register-gmsocial-products.ts
  ├── register-goseong-products.ts
  ├── register-gwdmall-products.ts
  ├── register-kkimchi-food-products.ts
  ├── register-kkimchi-products.ts
  ├── register-ontongdaejeon-food-products.ts
  ├── register-ontongdaejeon-products-with-prices.ts
  ├── register-ontongdaejeon-products.ts
  ├── register-osansemall-products.ts
  ├── register-retry-products.ts
  ├── register-samcheok-products.ts
  ├── register-wemall-food-products.ts
  ├── register-wemall-products.ts
  ├── register-wonju-products.ts
  ├── register-yangju-products.ts
  ├── remove-failed-jeju-products.ts
  ├── remove-jejumall.ts
  ├── remove-unknown-mall-products.ts
  ├── retry-failed-malls.ts
  ├── scrape-all-jeju-products.ts
  ├── scrape-chack3-products.ts
  ├── scrape-chamds-comprehensive.ts
  ├── scrape-donghae-comprehensive.ts
  ├── scrape-ejeju-mall-accurate.ts
  ├── scrape-ejeju-mall-comprehensive.ts
  ├── scrape-ejeju-mall-simple.ts
  ├── scrape-ejeju-mall.ts
  ├── scrape-gangneung-comprehensive.ts
  ├── scrape-gimhaemall-comprehensive.ts
  ├── scrape-gimhaemall-real.ts
  ├── scrape-gmsocial-categories.ts
  ├── scrape-gmsocial-comprehensive.ts
  ├── scrape-gmsocial-robust.ts
  ├── scrape-goseong-comprehensive.ts
  ├── scrape-gwdmall-comprehensive.ts
  ├── scrape-gwdmall-working.ts
  ├── scrape-individual-jeju-titles.ts
  ├── scrape-jeju-listing-titles.ts
  ├── scrape-jeju-mall-accurate.ts
  ├── scrape-jeju-mall-ajax.ts
  ├── scrape-jeju-mall-final.ts
  ├── scrape-jeju-mall-real.ts
  ├── scrape-jeju-mall-simple.ts
  ├── scrape-jeju-mall.ts
  ├── scrape-jeju-products-from-urls.ts
  ├── scrape-kkimchi-comprehensive.ts
  ├── scrape-missing-jeju-titles.ts
  ├── scrape-ontongdaejeon-comprehensive.ts
  ├── scrape-ontongdaejeon-detailed.ts
  ├── scrape-ontongdaejeon-enhanced.ts
  ├── scrape-ontongdaejeon-fixed.ts
  ├── scrape-ontongdaejeon-food-products.ts
  ├── scrape-ontongdaejeon-with-prices.ts
  ├── scrape-osansemall-direct.ts
  ├── scrape-osansemall-products.ts
  ├── scrape-osansemall-real.ts
  ├── scrape-samcheok-comprehensive.ts
  ├── scrape-sjlocal-products.ts
  ├── scrape-wemall-comprehensive.ts
  ├── scrape-wemall-food-final.ts
  ├── scrape-wemall-priority.ts
  ├── scrape-wonju-comprehensive.ts
  ├── scrape-wonju-working.ts
  ├── scrape-yangju-careful.ts
  ├── scrape-yangju-comprehensive.ts
  ├── test-chamds-product-pages.ts
  ├── test-donghae-product.ts
  ├── test-ejeju-fetch.ts
  ├── test-gangneung-product.ts
  ├── test-gmsocial-access.ts
  ├── test-goseong-product.ts
  ├── test-gwdmall-page.ts
  ├── test-jeju-title-puppeteer.ts
  ├── test-jeju-title.ts
  ├── test-samcheok-product.ts
  ├── test-specific-url.ts
  ├── test-wemall-category.ts
  ├── test-wemall-food-category.ts
  ├── test-wonju-product.ts
  ├── test-yangju-page.ts
  ├── update-overview.ts
  ├── verify-chack3-registration.ts
  ├── verify-chamds-food-registration.ts
  ├── verify-chamds-registration.ts
  ├── verify-donghae-registration.ts
  ├── verify-ejeju-products.ts
  ├── verify-gangneung-registration.ts
  ├── verify-gmsocial-clean.ts
  ├── verify-gmsocial-registration.ts
  ├── verify-goseong-registration.ts
  ├── verify-gwdmall-registration.ts
  ├── verify-individual-products-all-malls.ts
  ├── verify-jejumall-removal.ts
  ├── verify-kkimchi-food-registration.ts
  ├── verify-kkimchi-registration.ts
  ├── verify-ontongdaejeon-food-registration.ts
  ├── verify-ontongdaejeon-registration.ts
  ├── verify-osansemall-registration.ts
  ├── verify-samcheok-registration.ts
  ├── verify-wemall-food-products.ts
  ├── verify-wemall-food-registration.ts
  ├── verify-wemall-individual-products.ts
  ├── verify-wemall-registration.ts
  ├── verify-wonju-registration.ts
  ├── verify-yangju-registration.ts
src/
  ├── app/
  │   ├── about/
  │   │   ├── page.tsx
  │   ├── api/
  │   │   ├── products/
  │   │   │   ├── route.ts
  │   │   ├── sync-products/
  │   │   │   ├── route.ts
  │   │   ├── track-click/
  │   │   │   ├── route.ts
  │   ├── contact/
  │   │   ├── page.tsx
  │   ├── privacy/
  │   │   ├── page.tsx
  │   ├── product/
  │   │   ├── [productId]/
  │   │   │   ├── page.tsx
  │   │   ├── \[productId\]/
  │   ├── products/
  │   │   ├── page.tsx
  │   ├── region/
  │   │   ├── [regionName]/
  │   │   │   ├── page.tsx
  │   │   │   ├── RegionPageClient.tsx
  │   │   ├── \[regionName\]/
  │   ├── search/
  │   │   ├── page.tsx
  │   ├── terms/
  │   │   ├── page.tsx
  │   ├── globals.css
  │   ├── layout.tsx
  │   ├── page.tsx
  ├── components/
  │   ├── FeaturedMalls.tsx
  │   ├── InteractiveMap.tsx
  │   ├── MallCard.tsx
  │   ├── ProductCard.tsx
  │   ├── ProductSearchBar.tsx
  │   ├── QuickFilters.tsx
  │   ├── SearchBar.tsx
  ├── data/
  │   ├── categories.json
  │   ├── category-mapping.json
  │   ├── malls.json
  │   ├── products-backup-1750328004702.json
  │   ├── products-sample.json
  │   ├── products.json
  │   ├── regions.json
  │   ├── tag-mapping.json
  ├── lib/
  │   ├── scrapers/
  │   │   ├── base-scraper.ts
  │   │   ├── generic-scraper.ts
  │   │   ├── scraper-registry.ts
  │   ├── cron-config.ts
  │   ├── data.ts
  │   ├── product-classifier.ts
  │   ├── product-sync.ts
  ├── types/
  │   ├── index.ts
CLAUDE.md/
CRON_SETUP.md/
jeju-mall-product-urls.txt/
next-env.d.ts/
next.config.js/
package-lock.json/
package.json/
postcss.config.js/
PROJECT_OVERVIEW.md/
tailwind.config.js/
tsconfig.json/
tsconfig.tsbuildinfo/
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

Total: **99 shopping malls** across 17 regions

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

Total: **815 products** with real data for featured malls

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

---

Last Updated: 2025-06-21
Version: 1.0.0
Git Branch: product-enrolling
Last Commit: 321bb3a fix: resolve product page build errors by normalizing inconsistent product data structures

### Project Statistics
- Total Files: 474
- Total Directories: 29
- Shopping Malls: 99
- Products: 815
- Regions: 17
- Categories: 10