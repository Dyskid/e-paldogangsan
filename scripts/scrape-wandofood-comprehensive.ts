import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  category: string;
  tags: string[];
  mall: string;
}

function cleanTitle(title: string): string {
  return title
    .replace(/상품명\s*:\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanPrice(priceText: string): string {
  const match = priceText.match(/[\d,]+/);
  return match ? match[0] + '원' : '';
}

function extractImageUrl(src: string, baseUrl: string): string {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  if (src.startsWith('/')) return baseUrl + src;
  return baseUrl + '/' + src;
}

function categorizeProduct(title: string): { category: string; tags: string[] } {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('전복') || titleLower.includes('활전복')) {
    return { category: '완도전복', tags: ['수산물', '전남', '완도', '전복'] };
  }
  if (titleLower.includes('미역') || titleLower.includes('다시마') || titleLower.includes('톳') || 
      titleLower.includes('파래') || titleLower.includes('매생이')) {
    return { category: '해조류', tags: ['수산물', '전남', '완도', '해조류'] };
  }
  if (titleLower.includes('김') && (titleLower.includes('곱창') || titleLower.includes('구이') || titleLower.includes('파래김'))) {
    return { category: '김', tags: ['수산물', '전남', '완도', '김'] };
  }
  if (titleLower.includes('멸치') || titleLower.includes('장어') || titleLower.includes('도미') || 
      titleLower.includes('한치') || titleLower.includes('밴댕이')) {
    return { category: '수산물', tags: ['수산물', '전남', '완도'] };
  }
  if (titleLower.includes('황칠') || titleLower.includes('모링가')) {
    return { category: '농산물', tags: ['농산물', '전남', '완도', '황칠'] };
  }
  if (titleLower.includes('전복죽') || titleLower.includes('전복장') || titleLower.includes('쌀국수') || 
      titleLower.includes('볶음밥') || titleLower.includes('국물팩')) {
    return { category: '간편식품', tags: ['가공식품', '전남', '완도', '간편식'] };
  }
  if (titleLower.includes('선물세트') || titleLower.includes('세트')) {
    return { category: '선물세트', tags: ['선물세트', '전남', '완도'] };
  }
  if (titleLower.includes('자반')) {
    return { category: '해조류', tags: ['수산물', '전남', '완도', '자반'] };
  }
  
  return { category: '완도특산품', tags: ['농산물', '전남', '완도'] };
}

async function scrapeWandoFood() {
  const baseUrl = 'https://wandofood.go.kr';
  const products: Product[] = [];
  
  try {
    console.log('Scraping 완도군이숍...');
    
    // Get homepage
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract products from homepage
    console.log('Extracting products from homepage...');
    
    const homepageProducts = $('.xans-record-');
    console.log(`Found ${homepageProducts.length} potential products on homepage`);
    
    homepageProducts.each((i, element) => {
      try {
        const $item = $(element);
        
        // Get product link
        const linkElement = $item.find('a').first();
        const relativeUrl = linkElement.attr('href');
        if (!relativeUrl || !relativeUrl.includes('/product/')) return;
        
        const productUrl = relativeUrl.startsWith('http') ? relativeUrl : baseUrl + relativeUrl;
        
        // Get title from alt text or link text
        let title = $item.find('img').attr('alt') || '';
        if (!title) {
          title = linkElement.text().trim();
        }
        if (!title || title.includes('##name##')) return;
        
        title = cleanTitle(title);
        if (title.length < 3) return;
        
        // Get image
        const imgElement = $item.find('img').first();
        const imageSrc = imgElement.attr('src') || '';
        const imageUrl = extractImageUrl(imageSrc, baseUrl);
        
        // Get price - look for common price selectors
        let price = '';
        const priceSelectors = [
          '.xans-record- span:contains("원")',
          '.price',
          'span:contains("원")',
          'strong:contains("원")',
          '[class*="price"]',
          'li:contains("원")'
        ];
        
        for (const selector of priceSelectors) {
          const priceElement = $item.find(selector).first();
          if (priceElement.length > 0) {
            const priceText = priceElement.text().trim();
            if (priceText.includes('원')) {
              price = cleanPrice(priceText);
              break;
            }
          }
        }
        
        if (!price) {
          // Try to get price from product text content
          const allText = $item.text();
          const priceMatch = allText.match(/[\d,]+원/);
          if (priceMatch) {
            price = priceMatch[0];
          }
        }
        
        if (!price) {
          console.log(`No price found for: ${title}`);
          return; // Skip products without prices
        }
        
        const { category, tags } = categorizeProduct(title);
        
        const product: Product = {
          id: `wandofood_${Date.now()}_${i}`,
          title: `${title} - 완도군이숍`,
          price,
          image: imageUrl,
          url: productUrl,
          category,
          tags,
          mall: '완도군이숍'
        };
        
        products.push(product);
        console.log(`Extracted: ${title} - ${price}`);
        
      } catch (error) {
        console.error(`Error processing product ${i}:`, error);
      }
    });
    
    // Try category pages for more products
    const categoryUrls = [
      '/category/완도전복/744/', // 완도전복
      '/category/해조류/745/', // 해조류
      '/category/수산물/746/', // 수산물
      '/category/농산물/747/', // 농산물
      '/category/간편식품/801/', // 간편식품
      '/category/소상공인-선물꾸러미/806/' // 선물세트
    ];
    
    for (const categoryUrl of categoryUrls) {
      try {
        console.log(`Scraping category: ${categoryUrl}`);
        const categoryResponse = await axios.get(baseUrl + categoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });
        
        const $cat = cheerio.load(categoryResponse.data);
        const categoryProducts = $cat('.xans-record-');
        
        categoryProducts.each((i, element) => {
          try {
            const $item = $cat(element);
            
            const linkElement = $item.find('a').first();
            const relativeUrl = linkElement.attr('href');
            if (!relativeUrl || !relativeUrl.includes('/product/')) return;
            
            const productUrl = relativeUrl.startsWith('http') ? relativeUrl : baseUrl + relativeUrl;
            
            // Check if we already have this product
            if (products.some(p => p.url === productUrl)) return;
            
            let title = $item.find('img').attr('alt') || linkElement.text().trim();
            if (!title || title.includes('##name##')) return;
            
            title = cleanTitle(title);
            if (title.length < 3) return;
            
            const imgElement = $item.find('img').first();
            const imageSrc = imgElement.attr('src') || '';
            const imageUrl = extractImageUrl(imageSrc, baseUrl);
            
            let price = '';
            const priceSelectors = [
              '.xans-record- span:contains("원")',
              '.price',
              'span:contains("원")',
              'strong:contains("원")',
              '[class*="price"]',
              'li:contains("원")'
            ];
            
            for (const selector of priceSelectors) {
              const priceElement = $item.find(selector).first();
              if (priceElement.length > 0) {
                const priceText = priceElement.text().trim();
                if (priceText.includes('원')) {
                  price = cleanPrice(priceText);
                  break;
                }
              }
            }
            
            if (!price) {
              const allText = $item.text();
              const priceMatch = allText.match(/[\d,]+원/);
              if (priceMatch) {
                price = priceMatch[0];
              }
            }
            
            if (!price) return;
            
            const { category, tags } = categorizeProduct(title);
            
            const product: Product = {
              id: `wandofood_${Date.now()}_${products.length}`,
              title: `${title} - 완도군이숍`,
              price,
              image: imageUrl,
              url: productUrl,
              category,
              tags,
              mall: '완도군이숍'
            };
            
            products.push(product);
            console.log(`Category product: ${title} - ${price}`);
            
          } catch (error) {
            console.error(`Error processing category product:`, error);
          }
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error scraping category ${categoryUrl}:`, error);
      }
    }
    
    console.log(`\nScraping completed!`);
    console.log(`Total products extracted: ${products.length}`);
    
    // Save results
    const summary = {
      timestamp: new Date().toISOString(),
      mall: '완도군이숍',
      totalProducts: products.length,
      categories: Array.from(new Set(products.map(p => p.category))),
      sampleProducts: products.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        url: p.url
      }))
    };
    
    writeFileSync('./scripts/output/wandofood-products.json', JSON.stringify(products, null, 2));
    writeFileSync('./scripts/output/wandofood-scrape-summary.json', JSON.stringify(summary, null, 2));
    
    return products;
    
  } catch (error) {
    console.error('Error during scraping:', error);
    return [];
  }
}

scrapeWandoFood().then(products => {
  console.log(`Scraping completed with ${products.length} products`);
}).catch(console.error);