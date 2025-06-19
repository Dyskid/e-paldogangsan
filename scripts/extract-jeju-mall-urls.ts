#!/usr/bin/env tsx

/**
 * Script to extract and save Jeju Mall product URLs
 * URL Pattern: https://mall.ejeju.net/goods/detail.do?gno=XXX&cate=YYY
 */

import fs from 'fs';
import path from 'path';

// Define the main categories discovered
const MAIN_CATEGORIES = [
  { code: '1', name: '제주 농산품', nameEn: 'Agricultural Products' },
  { code: '2', name: '제주 수산품', nameEn: 'Seafood' },
  { code: '1671', name: '제주 축산품', nameEn: 'Livestock Products' },
  { code: '4', name: '제주 가공식품', nameEn: 'Processed Foods' },
  { code: '6', name: '제주 화장품', nameEn: 'Cosmetics' },
  { code: '31069', name: '제주 공예품', nameEn: 'Crafts' },
  { code: '1854', name: '제주 생활용품', nameEn: 'Daily Necessities' },
  { code: '31115', name: '반려동물용품', nameEn: 'Pet Supplies' },
  { code: '31154', name: '제주-경기 상생관', nameEn: 'Jeju-Gyeonggi Hall' }
];

// Product URLs collected from various sources
const COLLECTED_PRODUCT_URLS = {
  homepage: {
    '나들이 간식': [
      'https://mall.ejeju.net/goods/detail.do?gno=10492&cate=31040',
      'https://mall.ejeju.net/goods/detail.do?gno=30516&cate=31043',
      'https://mall.ejeju.net/goods/detail.do?gno=30470&cate=45',
      'https://mall.ejeju.net/goods/detail.do?gno=30294&cate=31042'
    ],
    '청정 제주의 선물': [
      'https://mall.ejeju.net/goods/detail.do?gno=11138&cate=31017',
      'https://mall.ejeju.net/goods/detail.do?gno=30350&cate=1672',
      'https://mall.ejeju.net/goods/detail.do?gno=30353&cate=1672'
    ],
    '한라봉 특가': [
      'https://mall.ejeju.net/goods/detail.do?gno=30393&cate=31004',
      'https://mall.ejeju.net/goods/detail.do?gno=11226&cate=1789',
      'https://mall.ejeju.net/goods/detail.do?gno=11386&cate=31004'
    ]
  },
  categories: {
    '제주 수산품 - 옥돔': [
      'https://mall.ejeju.net/goods/detail.do?gno=30403&cate=31',
      'https://mall.ejeju.net/goods/detail.do?gno=30402&cate=31',
      'https://mall.ejeju.net/goods/detail.do?gno=30401&cate=31',
      'https://mall.ejeju.net/goods/detail.do?gno=30398&cate=31',
      'https://mall.ejeju.net/goods/detail.do?gno=30397&cate=31',
      'https://mall.ejeju.net/goods/detail.do?gno=30396&cate=31'
    ],
    '제주 농산품': [
      'https://mall.ejeju.net/goods/detail.do?gno=30321&cate=26',
      'https://mall.ejeju.net/goods/detail.do?gno=11321&cate=31008',
      'https://mall.ejeju.net/goods/detail.do?gno=30293&cate=31004'
    ],
    '제주 가공식품': [
      'https://mall.ejeju.net/goods/detail.do?gno=30561&cate=31065',
      'https://mall.ejeju.net/goods/detail.do?gno=30560&cate=31049',
      'https://mall.ejeju.net/goods/detail.do?gno=30559&cate=31049',
      'https://mall.ejeju.net/goods/detail.do?gno=30558&cate=45',
      'https://mall.ejeju.net/goods/detail.do?gno=30557&cate=45'
    ],
    '제주 화장품': [
      'https://mall.ejeju.net/goods/detail.do?gno=30515&cate=31066',
      'https://mall.ejeju.net/goods/detail.do?gno=30514&cate=31066',
      'https://mall.ejeju.net/goods/detail.do?gno=30513&cate=31066'
    ]
  }
};

// Extract unique product URLs
function extractUniqueUrls(): Set<string> {
  const allUrls = new Set<string>();
  
  // Add homepage URLs
  Object.values(COLLECTED_PRODUCT_URLS.homepage).forEach(urls => {
    urls.forEach(url => allUrls.add(url));
  });
  
  // Add category URLs
  Object.values(COLLECTED_PRODUCT_URLS.categories).forEach(urls => {
    urls.forEach(url => allUrls.add(url));
  });
  
  return allUrls;
}

// Parse product URL to extract gno and cate
function parseProductUrl(url: string): { gno: string; cate: string } | null {
  const match = url.match(/gno=(\d+)&cate=(\d+)/);
  if (match) {
    return { gno: match[1], cate: match[2] };
  }
  return null;
}

// Generate summary report
function generateReport(urls: Set<string>): string {
  const report: string[] = [];
  
  report.push('# Jeju Mall Product URLs Report');
  report.push(`# Generated on: ${new Date().toISOString().split('T')[0]}`);
  report.push(`# Total Unique Products: ${urls.size}`);
  report.push('# URL Pattern: https://mall.ejeju.net/goods/detail.do?gno=XXX&cate=YYY\n');
  
  // Analyze by category
  const categoryMap = new Map<string, string[]>();
  
  urls.forEach(url => {
    const parsed = parseProductUrl(url);
    if (parsed) {
      const cate = parsed.cate;
      if (!categoryMap.has(cate)) {
        categoryMap.set(cate, []);
      }
      categoryMap.get(cate)!.push(url);
    }
  });
  
  report.push('## Products by Category Code\n');
  
  Array.from(categoryMap.entries())
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([cate, urls]) => {
      report.push(`### Category ${cate} (${urls.length} products)`);
      urls.forEach(url => report.push(url));
      report.push('');
    });
  
  report.push('## All Unique Product URLs\n');
  Array.from(urls).sort().forEach(url => report.push(url));
  
  return report.join('\n');
}

// Main function
function main() {
  console.log('Extracting Jeju Mall product URLs...');
  
  const uniqueUrls = extractUniqueUrls();
  console.log(`Found ${uniqueUrls.size} unique product URLs`);
  
  // Generate report
  const report = generateReport(uniqueUrls);
  
  // Save to file
  const outputPath = path.join(__dirname, '..', 'jeju-mall-products-report.txt');
  fs.writeFileSync(outputPath, report);
  
  console.log(`Report saved to: ${outputPath}`);
  
  // Also save a simple list of URLs
  const urlListPath = path.join(__dirname, '..', 'jeju-mall-urls-list.txt');
  fs.writeFileSync(urlListPath, Array.from(uniqueUrls).sort().join('\n'));
  
  console.log(`URL list saved to: ${urlListPath}`);
  
  // Print summary
  console.log('\nSummary:');
  console.log(`- Total unique products: ${uniqueUrls.size}`);
  console.log('- Categories discovered:');
  MAIN_CATEGORIES.forEach(cat => {
    console.log(`  - ${cat.name} (${cat.nameEn}): cate=${cat.code}`);
  });
}

// Run the script
main();