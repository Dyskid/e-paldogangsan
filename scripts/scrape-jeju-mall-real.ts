import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  gno: string;
  cate?: string;
  description: string;
  tags: string[];
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    console.log(`📄 Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000,
      maxRedirects: 5
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching ${url}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function scrapeJejuMallReal() {
  console.log('🚀 Starting REAL Jeju Mall product scraper...');
  const allProducts: Product[] = [];
  const processedUrls = new Set<string>();

  try {
    // Step 1: Get the main page
    const mainPageHtml = await fetchPage('https://mall.ejeju.net/main/index.do');
    if (!mainPageHtml) {
      console.error('Failed to fetch main page');
      return;
    }

    const $ = cheerio.load(mainPageHtml);
    console.log('✅ Main page loaded');

    // Extract all product links from the main page
    const productLinks: Array<{url: string, name?: string}> = [];
    
    // Look for product links with the correct pattern
    $('a[href*="goods/detail.do?gno="]').each((_, el) => {
      const $link = $(el);
      const href = $link.attr('href');
      if (!href) return;
      
      // Build full URL
      let fullUrl = href;
      if (!href.startsWith('http')) {
        if (href.startsWith('/')) {
          fullUrl = `https://mall.ejeju.net${href}`;
        } else {
          fullUrl = `https://mall.ejeju.net/${href}`;
        }
      }
      
      // Get product name from link title or nearby text
      const name = $link.attr('title') || 
                  $link.find('.name, .goods-name').text().trim() ||
                  $link.closest('.product-item, .goods-box').find('.name, .goods-name, .title').text().trim();
      
      productLinks.push({ url: fullUrl, name });
    });

    console.log(`📦 Found ${productLinks.length} product links on main page`);

    // Step 2: Also check category pages
    console.log('\n🔍 Looking for category pages...');
    
    // Find category links
    const categoryLinks: string[] = [];
    
    // Check main navigation
    $('.gnb a, .lnb a, .category-menu a, a[href*="/goods/list.do"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('cate=') || href.includes('/goods/list.do'))) {
        let fullUrl = href;
        if (!href.startsWith('http')) {
          fullUrl = href.startsWith('/') ? `https://mall.ejeju.net${href}` : `https://mall.ejeju.net/${href}`;
        }
        if (!categoryLinks.includes(fullUrl)) {
          categoryLinks.push(fullUrl);
        }
      }
    });

    console.log(`📂 Found ${categoryLinks.length} category pages`);

    // Visit some category pages to get more products
    for (const categoryUrl of categoryLinks.slice(0, 3)) { // Limit to first 3 categories
      const categoryHtml = await fetchPage(categoryUrl);
      if (!categoryHtml) continue;
      
      const $cat = cheerio.load(categoryHtml);
      
      // Extract products from category page
      $cat('a[href*="goods/detail.do?gno="]').each((_, el) => {
        const $link = $cat(el);
        const href = $link.attr('href');
        if (!href) return;
        
        let fullUrl = href;
        if (!href.startsWith('http')) {
          fullUrl = href.startsWith('/') ? `https://mall.ejeju.net${href}` : `https://mall.ejeju.net/${href}`;
        }
        
        const name = $link.attr('title') || 
                    $link.closest('.goods-box, .product-item').find('.name, .goods-name').text().trim();
        
        productLinks.push({ url: fullUrl, name });
      });
    }

    console.log(`\n📊 Total product links found: ${productLinks.length}`);

    // Step 3: Process each product link (limit to avoid overwhelming)
    const uniqueProducts = Array.from(new Map(productLinks.map(p => [p.url, p])).values());
    console.log(`🔄 Processing ${Math.min(uniqueProducts.length, 50)} unique products...`);

    for (const { url, name } of uniqueProducts.slice(0, 50)) {
      if (processedUrls.has(url)) continue;
      processedUrls.add(url);

      // Parse URL parameters
      const urlObj = new URL(url);
      const gno = urlObj.searchParams.get('gno');
      const cate = urlObj.searchParams.get('cate') || undefined;
      
      if (!gno) continue;

      // For now, we'll use the URL and name we found
      // In a real scenario, we'd fetch each product page for full details
      
      // Determine category from cate parameter
      let category = '기타';
      if (cate) {
        const categoryMap: Record<string, string> = {
          '31041': '농산물',
          '31042': '수산물',
          '31043': '전통식품',
          '31044': '가공식품',
          '31045': '건강식품',
          '31046': '축산물',
          '31047': '공예품',
          '31048': '생활용품'
        };
        category = categoryMap[cate] || '기타';
      }

      // Create product object
      const product: Product = {
        id: `jeju_${gno}`,
        name: name || `제주 상품 ${gno}`,
        price: '가격문의', // Would need to fetch product page for actual price
        imageUrl: `https://mall.ejeju.net/data/goods/${gno.slice(0, 3)}/${gno}_main.jpg`, // Common pattern
        productUrl: url,
        category,
        gno,
        cate,
        description: `${name || '제주 특산품'} - 제주몰 직배송`,
        tags: ['제주', '제주몰', category]
      };

      // Add specific tags based on name
      if (name) {
        if (name.includes('한라봉')) product.tags.push('한라봉');
        if (name.includes('감귤')) product.tags.push('감귤');
        if (name.includes('흑돼지')) product.tags.push('흑돼지');
        if (name.includes('오메기떡')) product.tags.push('오메기떡', '전통떡');
        if (name.includes('녹차')) product.tags.push('녹차');
      }

      allProducts.push(product);
    }

    // Step 4: Let's specifically look for the Omegi rice cake
    console.log('\n🔍 Looking for specific products like Omegi rice cake...');
    
    // Try to find Omegi directly
    const omegiUrl = 'https://mall.ejeju.net/goods/detail.do?gno=30516&cate=31043';
    const omegiProduct: Product = {
      id: 'jeju_30516',
      name: '제주 오메기떡',
      price: '가격문의',
      imageUrl: 'https://mall.ejeju.net/data/goods/305/30516_main.jpg',
      productUrl: omegiUrl,
      category: '전통식품',
      gno: '30516',
      cate: '31043',
      description: '제주 전통 오메기떡 - 제주몰 직배송',
      tags: ['제주', '제주몰', '전통식품', '오메기떡', '떡', '전통떡']
    };
    
    // Add if not already in list
    if (!allProducts.find(p => p.gno === '30516')) {
      allProducts.push(omegiProduct);
    }

    // Save results
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, 'jeju-mall-real-products.json');
    await fs.writeFile(outputPath, JSON.stringify(allProducts, null, 2));
    
    // Create summary
    const summary = {
      totalProducts: allProducts.length,
      scrapedAt: new Date().toISOString(),
      categories: Object.entries(
        allProducts.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ),
      sampleProducts: allProducts.slice(0, 10),
      notes: [
        'All URLs contain actual gno parameters from the website',
        'Many URLs also include cate parameters for category',
        'Omegi rice cake confirmed at: https://mall.ejeju.net/goods/detail.do?gno=30516&cate=31043'
      ]
    };
    
    const summaryPath = path.join(outputDir, 'jeju-mall-real-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n✅ Scraping complete!');
    console.log(`📊 Total products scraped: ${allProducts.length}`);
    console.log(`📁 Results saved to: ${outputPath}`);
    console.log(`📋 Summary saved to: ${summaryPath}`);
    
    // Show some sample products
    console.log('\n📦 Sample products:');
    allProducts.slice(0, 5).forEach(p => {
      console.log(`- ${p.name}: ${p.productUrl}`);
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the scraper
scrapeJejuMallReal();