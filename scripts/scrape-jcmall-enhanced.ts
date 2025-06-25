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

async function scrapeJCMallEnhanced() {
  console.log('🚀 Starting enhanced JC Mall scraping...');
  
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
    // First, get all product URLs by directly trying different product IDs
    console.log('📋 Step 1: Finding products by ID range...');
    
    const productNumbers = new Set<string>();
    
    // Try a range of product IDs (common approach for this type of site)
    const maxId = 400; // Based on the highest ID we saw (391)
    const minId = 80;  // Based on the lowest ID we saw (86)
    
    for (let id = minId; id <= maxId; id++) {
      try {
        const testUrl = `${baseUrl}/product/detail.html?product_no=${id}`;
        const response = await axios.head(testUrl, {
          timeout: 5000,
          headers,
          validateStatus: (status) => status < 500
        });
        
        if (response.status === 200) {
          productNumbers.add(id.toString());
          console.log(`✅ Found product ID: ${id}`);
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        // Continue to next ID
      }
    }

    console.log(`🔢 Found ${productNumbers.size} valid product IDs`);

    // Also extract from the homepage for any we might have missed
    console.log('🏠 Also checking homepage for additional products...');
    const homeResponse = await axios.get(baseUrl, { timeout: 10000, headers });
    const $home = cheerio.load(homeResponse.data);
    
    // Extract product numbers from various URL patterns
    $home('a[href*="product"]').each((i, el) => {
      const href = $home(el).attr('href');
      if (href) {
        // Match product_no= pattern
        const productNoMatch = href.match(/product_no=(\d+)/);
        if (productNoMatch) {
          productNumbers.add(productNoMatch[1]);
        }
        
        // Match /product/name/ID/ pattern
        const productIdMatch = href.match(/\/product\/[^\/]+\/(\d+)\//);
        if (productIdMatch) {
          productNumbers.add(productIdMatch[1]);
        }
      }
    });

    console.log(`📦 Total unique product numbers: ${productNumbers.size}`);

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

        // If still no title, try to extract from page title
        if (!title) {
          const pageTitle = $('title').text();
          if (pageTitle && pageTitle.includes('[') && pageTitle.includes(']')) {
            const match = pageTitle.match(/\[([^\]]+)\]/);
            if (match) {
              title = match[1];
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

        // Also try to extract from JavaScript variables
        if (!price) {
          const scriptTags = $('script').map((i, el) => $(el).html()).get();
          for (const script of scriptTags) {
            if (script && script.includes('ec-data-price')) {
              const match = script.match(/ec-data-price="([^"]+)"/);
              if (match) {
                price = match[1];
                break;
              }
            }
          }
        }

        if (!price) {
          console.log('❌ No price found, skipping...');
          continue;
        }

        // Format price
        const numericPrice = parseInt(price);
        if (numericPrice <= 0) {
          console.log('❌ Invalid price, skipping...');
          continue;
        }
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
        await new Promise(resolve => setTimeout(resolve, 1500));

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
scrapeJCMallEnhanced().catch(console.error);