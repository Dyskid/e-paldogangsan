import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

interface Product {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  image: string;
  url: string;
  category: string;
  mall: string;
  region: string;
  tags: string[];
  description?: string;
  inStock: boolean;
}

async function scrapeJCMallComprehensive() {
  console.log('🚀 Starting comprehensive JC Mall scraping...');
  
  const baseUrl = 'https://jcmall.net';
  const products: Product[] = [];
  const scrapedIds = new Set<string>();

  // Common headers
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  try {
    // First, get all product URLs by scraping the homepage and category pages
    console.log('📋 Step 1: Collecting all product URLs...');
    
    const productUrls = new Set<string>();
    
    // Get homepage first
    console.log('🏠 Scraping homepage...');
    const homeResponse = await axios.get(baseUrl, { timeout: 10000, headers });
    const $home = cheerio.load(homeResponse.data);
    
    // Extract product URLs from homepage
    $home('a[href*="/product/detail.html?product_no="]').each((i, el) => {
      const href = $home(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
        productUrls.add(fullUrl);
      }
    });

    // Also collect category-based product URLs
    $home('a[href*="/product/"]').each((i, el) => {
      const href = $home(el).attr('href');
      if (href && href.includes('/product/') && href.includes('/category/')) {
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
        productUrls.add(fullUrl);
      }
    });

    console.log(`📦 Found ${productUrls.size} product URLs from homepage`);

    // Try to scrape category pages for more products
    const categories = [24, 25, 26, 27, 28, 43, 49, 51, 98, 115]; // Common category numbers found in analysis
    
    for (const catNo of categories) {
      try {
        console.log(`🏷️ Scraping category ${catNo}...`);
        const catUrl = `${baseUrl}/product/list.html?cate_no=${catNo}`;
        const catResponse = await axios.get(catUrl, { timeout: 10000, headers });
        const $cat = cheerio.load(catResponse.data);
        
        // Extract product URLs from category page
        $cat('a[href*="/product/detail.html?product_no="]').each((i, el) => {
          const href = $cat(el).attr('href');
          if (href) {
            const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
            productUrls.add(fullUrl);
          }
        });

        $cat('a[href*="/product/"]').each((i, el) => {
          const href = $cat(el).attr('href');
          if (href && href.includes('/product/') && href.includes('/category/')) {
            const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
            productUrls.add(fullUrl);
          }
        });
        
        // Small delay between category requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`⚠️ Could not scrape category ${catNo}`);
      }
    }

    console.log(`📦 Total unique product URLs found: ${productUrls.size}`);

    // Convert to array and get unique product numbers
    const uniqueUrls = Array.from(productUrls);
    const productNumbers = new Set<string>();
    
    uniqueUrls.forEach(url => {
      const match = url.match(/product_no=(\d+)/);
      if (match) {
        productNumbers.add(match[1]);
      }
    });

    console.log(`🔢 Unique product numbers: ${productNumbers.size}`);

    // Step 2: Scrape individual products
    console.log('\n📋 Step 2: Scraping individual products...');
    
    let processedCount = 0;
    const totalProducts = productNumbers.size;

    for (const productNo of Array.from(productNumbers)) {
      try {
        processedCount++;
        console.log(`\n📦 Processing product ${processedCount}/${totalProducts}: ${productNo}`);

        if (scrapedIds.has(productNo)) {
          console.log('⏭️ Already scraped, skipping...');
          continue;
        }

        const productUrl = `${baseUrl}/product/detail.html?product_no=${productNo}`;
        const response = await axios.get(productUrl, {
          timeout: 15000,
          headers,
          validateStatus: (status) => status < 500 // Accept 4xx but not 5xx
        });

        if (response.status >= 400) {
          console.log(`⚠️ HTTP ${response.status} for product ${productNo}`);
          continue;
        }

        const $ = cheerio.load(response.data);

        // Extract product information
        let title = '';

        // Try different title selectors
        const titleSelectors = ['h2', 'h1', '.product-name', '.product_name', '.prdName'];
        for (const selector of titleSelectors) {
          const element = $(selector).first();
          if (element.length > 0) {
            const text = element.text().trim();
            if (text && text.length > 2 && !text.includes('좋아요')) {
              title = text;
              break;
            }
          }
        }

        if (!title) {
          console.log('❌ No title found, skipping...');
          continue;
        }

        // Extract price from meta tags (most reliable)
        let price = '';
        const priceMetaContent = $('meta[property="product:price:amount"]').attr('content');
        const salePriceMetaContent = $('meta[property="product:sale_price:amount"]').attr('content');
        
        if (salePriceMetaContent) {
          price = salePriceMetaContent;
        } else if (priceMetaContent) {
          price = priceMetaContent;
        }

        if (!price) {
          console.log('❌ No price found, skipping...');
          continue;
        }

        // Format price
        const numericPrice = parseInt(price);
        const formattedPrice = `${numericPrice.toLocaleString()}원`;

        // Extract image
        let image = '';
        const imgSelectors = [
          '.thumbnail img',
          'img[src*="product"]',
          '.product-image img',
          '.main-image img'
        ];

        for (const selector of imgSelectors) {
          const element = $(selector).first();
          if (element.length > 0) {
            const src = element.attr('src');
            if (src) {
              image = src.startsWith('http') ? src : `https:${src}`;
              break;
            }
          }
        }

        if (!image) {
          console.log('⚠️ No image found');
        }

        // Determine category from title
        let category = '농특산품';
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('쌀') || titleLower.includes('현미') || titleLower.includes('찹쌀')) {
          category = '쌀/곡류';
        } else if (titleLower.includes('한우') || titleLower.includes('정육') || titleLower.includes('불고기')) {
          category = '정육류';
        } else if (titleLower.includes('된장') || titleLower.includes('고추장') || titleLower.includes('청국장') || titleLower.includes('간장')) {
          category = '발효식품';
        } else if (titleLower.includes('들기름') || titleLower.includes('참기름') || titleLower.includes('참깨')) {
          category = '기름/참깨';
        } else if (titleLower.includes('수박') || titleLower.includes('매실')) {
          category = '과일류';
        } else if (titleLower.includes('빵') || titleLower.includes('과자')) {
          category = '가공식품';
        } else if (titleLower.includes('인삼') || titleLower.includes('홍삼') || titleLower.includes('흑삼')) {
          category = '인삼/홍삼';
        } else if (titleLower.includes('화훼') || titleLower.includes('꽃')) {
          category = '원예/화훼';
        }

        // Generate appropriate tags
        const tags = ['진천특산품', '충북특산품'];
        
        if (titleLower.includes('생거진천')) tags.push('생거진천');
        if (titleLower.includes('유기농') || titleLower.includes('친환경')) tags.push('친환경');
        if (titleLower.includes('전통')) tags.push('전통');
        if (titleLower.includes('수제')) tags.push('수제');
        if (titleLower.includes('국내산')) tags.push('국내산');
        if (titleLower.includes('농협')) tags.push('농협');
        if (titleLower.includes('특허')) tags.push('특허');
        if (titleLower.includes('브랜드')) tags.push('브랜드');

        const product: Product = {
          id: `jcmall_${productNo}`,
          title: title,
          price: formattedPrice,
          image: image,
          url: productUrl,
          category: category,
          mall: '진천몰',
          region: '충청북도',
          tags: tags,
          inStock: true
        };

        products.push(product);
        scrapedIds.add(productNo);

        console.log(`✅ Successfully scraped: ${title}`);
        console.log(`   💰 Price: ${formattedPrice}`);
        console.log(`   🏷️ Category: ${category}`);
        console.log(`   📸 Image: ${image ? 'Found' : 'Missing'}`);

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        console.error(`❌ Error scraping product ${productNo}:`, error.message);
        continue;
      }
    }

    console.log(`\n🎉 Scraping completed! Total products: ${products.length}`);

    // Save results
    const summary = {
      timestamp: new Date().toISOString(),
      totalProducts: products.length,
      mall: '진천몰',
      region: '충청북도',
      categories: [...new Set(products.map(p => p.category))],
      averagePrice: products.length > 0 ? Math.round(products.reduce((sum, p) => sum + parseInt(p.price.replace(/[^\d]/g, '')), 0) / products.length) : 0,
      priceRange: {
        min: products.length > 0 ? Math.min(...products.map(p => parseInt(p.price.replace(/[^\d]/g, '')))) : 0,
        max: products.length > 0 ? Math.max(...products.map(p => parseInt(p.price.replace(/[^\d]/g, '')))) : 0
      }
    };

    // Save products
    fs.writeFileSync(
      '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/jcmall-products.json',
      JSON.stringify(products, null, 2)
    );

    // Save summary
    fs.writeFileSync(
      '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/jcmall-scrape-summary.json',
      JSON.stringify(summary, null, 2)
    );

    console.log(`💾 Products saved to: jcmall-products.json`);
    console.log(`📊 Summary saved to: jcmall-scrape-summary.json`);

    return { products, summary };

  } catch (error: any) {
    console.error('❌ Fatal error during scraping:', error.message);
    throw error;
  }
}

// Run the scraper
scrapeJCMallComprehensive().catch(console.error);