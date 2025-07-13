const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeGwangjuKimchiMall() {
    const products = [];
    const baseUrl = 'https://www.k-kimchi.kr';
    
    // Categories to scrape
    const categories = [
        { url: '/index.php?cate=001001', name: '포기김치' },
        { url: '/index.php?cate=001002', name: '숙성김치' },
        { url: '/index.php?cate=001003', name: '별미김치' },
        { url: '/index.php?cate=001004', name: '명인김치' },
        { url: '/index.php?cate=001005', name: '밑반찬' },
        { url: '/index.php?cate=001006', name: '선물세트' }
    ];
    
    for (const category of categories) {
        try {
            console.log(`Scraping category: ${category.name}...`);
            const response = await axios.get(`${baseUrl}${category.url}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            const $ = cheerio.load(response.data);
            
            // Multiple possible product selectors
            const productSelectors = [
                '.prd_list li',
                '.product_list li',
                '.goods_list li',
                '.item_list li',
                'ul.prd_list > li',
                'div.goods_list_item'
            ];
            
            let productElements = null;
            for (const selector of productSelectors) {
                productElements = $(selector);
                if (productElements.length > 0) {
                    console.log(`Found ${productElements.length} products using selector: ${selector}`);
                    break;
                }
            }
            
            if (!productElements || productElements.length === 0) {
                console.log(`No products found in category ${category.name}`);
                continue;
            }
            
            productElements.each((index, element) => {
                const $el = $(element);
                
                // Extract product information
                const name = $el.find('.name, .prd_name, .goods_name, .item_name').text().trim() ||
                            $el.find('a').attr('title') ||
                            $el.find('img').attr('alt') || '';
                            
                const price = $el.find('.price, .consumer, .sell_price, .item_price').text().trim() ||
                             $el.find('.price_box').text().trim() || '';
                             
                const imageUrl = $el.find('img').attr('src') || '';
                const productLink = $el.find('a').attr('href') || '';
                
                const manufacturer = $el.find('.manufacturer, .brand').text().trim() || '광주김치몰';
                
                if (name && price) {
                    const product = {
                        mallId: 3,
                        mallName: '광주김치몰',
                        name: name,
                        price: price.replace(/[^0-9]/g, ''),
                        imageUrl: imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`,
                        productUrl: productLink.startsWith('http') ? productLink : `${baseUrl}${productLink}`,
                        category: category.name,
                        manufacturer: manufacturer,
                        scrapedAt: new Date().toISOString()
                    };
                    
                    products.push(product);
                }
            });
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`Error scraping category ${category.name}:`, error.message);
        }
    }
    
    console.log(`Total products scraped: ${products.length}`);
    return products;
}

// Test the scraper
scrapeGwangjuKimchiMall().then(products => {
    console.log('Sample products:', products.slice(0, 3));
    if (products.length > 0) {
        const fs = require('fs');
        fs.writeFileSync('/app/temporary/gwangju-kimchi-test-results.json', JSON.stringify(products, null, 2));
        console.log('Test results saved to gwangju-kimchi-test-results.json');
    }
}).catch(error => {
    console.error('Scraper failed:', error);
});