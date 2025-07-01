const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function analyzeSmartStore() {
    console.log('Starting Puppeteer analysis...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });
    
    try {
        const page = await browser.newPage();
        
        // Set realistic viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Enable request interception to capture API calls
        await page.setRequestInterception(true);
        
        const apiCalls = [];
        const resources = [];
        
        page.on('request', (request) => {
            const url = request.url();
            
            // Capture API calls
            if (url.includes('/api/') || url.includes('/i/v') || url.includes('ajax')) {
                apiCalls.push({
                    url: url,
                    method: request.method(),
                    headers: request.headers()
                });
            }
            
            request.continue();
        });
        
        page.on('response', async (response) => {
            const url = response.url();
            
            // Capture JSON responses
            if (response.headers()['content-type']?.includes('application/json')) {
                try {
                    const json = await response.json();
                    resources.push({
                        url: url,
                        type: 'json',
                        data: json
                    });
                } catch (e) {
                    // Not valid JSON
                }
            }
        });
        
        console.log('Navigating to SmartStore...');
        await page.goto('https://smartstore.naver.com/marketgyeonggi', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Extract store information from the page
        const storeInfo = await page.evaluate(() => {
            const info = {
                storeId: null,
                storeName: null,
                categories: [],
                products: [],
                dataVariables: {}
            };
            
            // Look for store ID in various places
            if (window.STORE_ID) info.storeId = window.STORE_ID;
            if (window.channelNo) info.storeId = window.channelNo;
            
            // Check for global data variables
            const windowKeys = Object.keys(window);
            windowKeys.forEach(key => {
                if (key.startsWith('__') && key.endsWith('__')) {
                    try {
                        info.dataVariables[key] = window[key];
                    } catch (e) {
                        // Can't serialize
                    }
                }
            });
            
            // Extract store name
            const storeNameEl = document.querySelector('.store-name, .shop-name, h1');
            if (storeNameEl) info.storeName = storeNameEl.textContent.trim();
            
            // Extract categories
            const categoryEls = document.querySelectorAll('.category-item, .menu-item, nav a');
            categoryEls.forEach(el => {
                const text = el.textContent.trim();
                if (text && !info.categories.includes(text)) {
                    info.categories.push(text);
                }
            });
            
            // Extract product information
            const productEls = document.querySelectorAll('[class*="product"], [class*="item"], [data-product]');
            productEls.forEach((el, index) => {
                if (index < 5) { // First 5 products only
                    const product = {
                        name: el.querySelector('[class*="name"], h3, h4')?.textContent?.trim(),
                        price: el.querySelector('[class*="price"]')?.textContent?.trim(),
                        image: el.querySelector('img')?.src,
                        link: el.querySelector('a')?.href
                    };
                    if (product.name) info.products.push(product);
                }
            });
            
            return info;
        });
        
        // Save page HTML
        const html = await page.content();
        await fs.writeFile('smartstore-puppeteer.html', html);
        
        // Take screenshot
        await page.screenshot({ path: 'smartstore-screenshot.png', fullPage: true });
        
        // Compile analysis results
        const analysis = {
            timestamp: new Date().toISOString(),
            url: page.url(),
            storeInfo: storeInfo,
            apiCalls: apiCalls,
            jsonResources: resources,
            cookies: await page.cookies()
        };
        
        await fs.writeFile('smartstore-puppeteer-analysis.json', JSON.stringify(analysis, null, 2));
        
        console.log('Analysis complete!');
        console.log('Store Info:', storeInfo);
        console.log('API Calls found:', apiCalls.length);
        console.log('JSON Resources found:', resources.length);
        
    } catch (error) {
        console.error('Error during analysis:', error);
    } finally {
        await browser.close();
    }
}

// Check if puppeteer is installed
try {
    require.resolve('puppeteer');
    analyzeSmartStore();
} catch (e) {
    console.log('Puppeteer not installed. Install with: npm install puppeteer');
}