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
  if (src.startsWith('/')) return baseUrl + src;
  return baseUrl + '/' + src;
}

function categorizeProduct(title: string): { category: string; tags: string[] } {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('전복') || titleLower.includes('멸치') || titleLower.includes('다시마') || 
      titleLower.includes('미역') || titleLower.includes('곱창김') || titleLower.includes('어란') ||
      titleLower.includes('새우') || titleLower.includes('민어') || titleLower.includes('숭어')) {
    return { category: '수산물', tags: ['수산물', '전남', '진도', '해조류'] };
  }
  if (titleLower.includes('울금') || titleLower.includes('강황')) {
    return { category: '울금', tags: ['농산물', '전남', '진도', '울금'] };
  }
  if (titleLower.includes('구기자')) {
    return { category: '구기자', tags: ['농산물', '전남', '진도', '구기자'] };
  }
  if (titleLower.includes('쌀') || titleLower.includes('현미') || titleLower.includes('찹쌀') || titleLower.includes('흑미')) {
    return { category: '곡물', tags: ['농산물', '전남', '진도', '쌀'] };
  }
  if (titleLower.includes('한우') || titleLower.includes('소고기')) {
    return { category: '한우', tags: ['축산물', '전남', '진도', '한우'] };
  }
  if (titleLower.includes('홍주') || titleLower.includes('전통주') || titleLower.includes('막걸리')) {
    return { category: '전통주', tags: ['가공식품', '전남', '진도', '전통주'] };
  }
  if (titleLower.includes('호박') || titleLower.includes('채소')) {
    return { category: '채소', tags: ['농산물', '전남', '진도', '채소'] };
  }
  if (titleLower.includes('꿀') || titleLower.includes('벌꿀')) {
    return { category: '꿀', tags: ['농산물', '전남', '진도', '꿀'] };
  }
  if (titleLower.includes('참기름') || titleLower.includes('참깨')) {
    return { category: '가공식품', tags: ['가공식품', '전남', '진도', '참기름'] };
  }
  if (titleLower.includes('선물세트') || titleLower.includes('세트')) {
    return { category: '선물세트', tags: ['선물세트', '전남', '진도'] };
  }
  
  return { category: '진도특산품', tags: ['농산물', '전남', '진도'] };
}

async function scrapeJindoArirangMall() {
  const baseUrl = 'https://jindoarirangmall.com';
  const products: Product[] = [];
  
  try {
    console.log('Scraping 진도아리랑몰...');
    
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
        if (!relativeUrl) return;
        
        const productUrl = relativeUrl.startsWith('http') ? relativeUrl : baseUrl + relativeUrl;
        
        // Get title from alt text or link text
        let title = $item.find('img').attr('alt') || '';
        if (!title) {
          title = linkElement.text().trim();
        }
        if (!title) return;
        
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
          id: `jindoarirang_${Date.now()}_${i}`,
          title: `${title} - 진도아리랑몰`,
          price,
          image: imageUrl,
          url: productUrl,
          category,
          tags,
          mall: '진도아리랑몰'
        };
        
        products.push(product);
        console.log(`Extracted: ${title} - ${price}`);
        
      } catch (error) {
        console.error(`Error processing product ${i}:`, error);
      }
    });
    
    // Try category pages for more products
    const categoryUrls = [
      '/product/list.html?cate_no=24', // 농산물
      '/product/list.html?cate_no=25', // 수산물
      '/product/list.html?cate_no=103', // 축산물
      '/product/list.html?cate_no=119', // 전통주
      '/product/list.html?cate_no=48', // 세트상품
      '/product/list.html?cate_no=116', // 친환경농산물
      '/product/list.html?cate_no=135' // 기타가공
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
            if (!relativeUrl) return;
            
            const productUrl = relativeUrl.startsWith('http') ? relativeUrl : baseUrl + relativeUrl;
            
            // Check if we already have this product
            if (products.some(p => p.url === productUrl)) return;
            
            let title = $item.find('img').attr('alt') || linkElement.text().trim();
            if (!title) return;
            
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
              id: `jindoarirang_${Date.now()}_${products.length}`,
              title: `${title} - 진도아리랑몰`,
              price,
              image: imageUrl,
              url: productUrl,
              category,
              tags,
              mall: '진도아리랑몰'
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
      mall: '진도아리랑몰',
      totalProducts: products.length,
      categories: Array.from(new Set(products.map(p => p.category))),
      sampleProducts: products.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        url: p.url
      }))
    };
    
    writeFileSync('./scripts/output/jindoarirang-products.json', JSON.stringify(products, null, 2));
    writeFileSync('./scripts/output/jindoarirang-scrape-summary.json', JSON.stringify(summary, null, 2));
    
    return products;
    
  } catch (error) {
    console.error('Error during scraping:', error);
    return [];
  }
}

scrapeJindoArirangMall().then(products => {
  console.log(`Scraping completed with ${products.length} products`);
}).catch(console.error);