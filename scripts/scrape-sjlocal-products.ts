import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface SjlocalProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  region: string;
  url: string;
  description: string;
  tags: string[];
  stock?: string;
  market?: string;
  productGroup?: string;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchProducts(marketId: string, marketName: string) {
  try {
    const searchUrl = `https://www.sjlocal.or.kr/sj/search_product?market=${marketId}&code_key_3=&search=`;
    
    console.log(`🔍 Searching products for ${marketName}...`);
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.sjlocal.or.kr/sj/search_product',
      },
      timeout: 30000,
    });
    
    const $ = cheerio.load(response.data);
    const products: SjlocalProduct[] = [];
    
    // Look for product table rows
    $('#result-product tbody tr, .table tbody tr').each((index, elem) => {
      const $row = $(elem);
      const cells = $row.find('td');
      
      if (cells.length >= 5) {
        const category = $(cells[0]).text().trim();
        const market = $(cells[1]).text().trim();
        const productGroup = $(cells[2]).text().trim();
        const name = $(cells[3]).text().trim();
        const stock = $(cells[4]).text().trim();
        
        if (name && name !== '') {
          const product: SjlocalProduct = {
            id: `sjlocal-${marketId}-${index}`,
            name,
            price: 0, // Price not available in inventory table
            image: '', // No images in the inventory system
            category: productGroup || category || '농산물',
            region: '세종특별자치시',
            url: searchUrl,
            description: `${marketName} ${productGroup} ${name}`,
            tags: ['세종로컬푸드', '싱싱장터', marketName, category, productGroup].filter(Boolean),
            stock,
            market: marketName,
            productGroup
          };
          
          products.push(product);
        }
      }
    });
    
    console.log(`✅ Found ${products.length} products in ${marketName}`);
    return products;
    
  } catch (error) {
    console.error(`❌ Error searching products for ${marketName}:`, error);
    return [];
  }
}

async function scrapeSjlocalProducts() {
  console.log('🛒 Starting sjlocal product scraping...');
  
  const markets = [
    { id: '1', name: '도담점' },
    { id: '2', name: '아름점' },
    { id: '3', name: '새롬점' },
    { id: '4', name: '도도리파크' },
    { id: '5', name: '소담점' }
  ];
  
  const allProducts: SjlocalProduct[] = [];
  
  for (const market of markets) {
    const products = await searchProducts(market.id, market.name);
    allProducts.push(...products);
    
    // Delay between requests to be respectful
    await delay(2000);
  }
  
  // Try to search with specific keywords to get more products
  const searchKeywords = ['채소', '과일', '곡물', '육류', '계란', '쌀', '김치', '나물', '버섯'];
  
  for (const keyword of searchKeywords) {
    console.log(`🔍 Searching for keyword: ${keyword}`);
    
    for (const market of markets) {
      try {
        const searchUrl = `https://www.sjlocal.or.kr/sj/search_product?market=${market.id}&code_key_3=&search=${encodeURIComponent(keyword)}`;
        
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          },
          timeout: 30000,
        });
        
        const $ = cheerio.load(response.data);
        
        $('#result-product tbody tr, .table tbody tr').each((index, elem) => {
          const $row = $(elem);
          const cells = $row.find('td');
          
          if (cells.length >= 5) {
            const category = $(cells[0]).text().trim();
            const marketName = $(cells[1]).text().trim();
            const productGroup = $(cells[2]).text().trim();
            const name = $(cells[3]).text().trim();
            const stock = $(cells[4]).text().trim();
            
            if (name && name !== '') {
              // Check if product already exists
              const exists = allProducts.some(p => 
                p.name === name && p.market === marketName
              );
              
              if (!exists) {
                const product: SjlocalProduct = {
                  id: `sjlocal-${market.id}-${keyword}-${allProducts.length}`,
                  name,
                  price: 0, // Price not available
                  image: '', // No images available
                  category: productGroup || category || keyword || '농산물',
                  region: '세종특별자치시',
                  url: searchUrl,
                  description: `${marketName} ${productGroup} ${name}`,
                  tags: [
                    '세종로컬푸드', 
                    '싱싱장터', 
                    marketName, 
                    category, 
                    productGroup,
                    keyword,
                    '로컬푸드',
                    '직거래'
                  ].filter(Boolean),
                  stock,
                  market: marketName,
                  productGroup
                };
                
                allProducts.push(product);
              }
            }
          }
        });
        
        await delay(1000);
      } catch (error) {
        console.error(`Error searching ${keyword} in ${market.name}:`, error);
      }
    }
  }
  
  // Remove duplicates based on name and market
  const uniqueProducts = Array.from(
    new Map(allProducts.map(p => [`${p.name}-${p.market}`, p])).values()
  );
  
  console.log(`\n📊 Scraping Summary:`);
  console.log(`Total unique products found: ${uniqueProducts.length}`);
  
  // Group by market
  const productsByMarket = uniqueProducts.reduce((acc, product) => {
    const market = product.market || 'Unknown';
    if (!acc[market]) acc[market] = [];
    acc[market].push(product);
    return acc;
  }, {} as Record<string, SjlocalProduct[]>);
  
  console.log('\n📍 Products by market:');
  Object.entries(productsByMarket).forEach(([market, products]) => {
    console.log(`  ${market}: ${products.length} products`);
  });
  
  // Save products
  const outputPath = path.join(__dirname, 'output', 'sjlocal-products.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueProducts, null, 2));
  
  // Save summary
  const summary = {
    mallName: '세종로컬푸드 싱싱장터',
    totalProducts: uniqueProducts.length,
    productsWithPrice: uniqueProducts.filter(p => p.price > 0).length,
    productsWithImage: uniqueProducts.filter(p => p.image).length,
    productsByMarket: Object.entries(productsByMarket).map(([market, products]) => ({
      market,
      count: products.length
    })),
    categories: [...new Set(uniqueProducts.map(p => p.category))],
    scrapedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'output', 'sjlocal-scrape-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  return { products: uniqueProducts, summary };
}

// Run the scraper
scrapeSjlocalProducts()
  .then(({ summary }) => {
    console.log('\n✅ Scraping complete!');
    console.log(`📄 Products saved to: sjlocal-products.json`);
    console.log(`📊 Summary saved to: sjlocal-scrape-summary.json`);
  })
  .catch(error => {
    console.error('❌ Scraping failed:', error);
  });