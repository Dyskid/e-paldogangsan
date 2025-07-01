import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import * as https from 'https';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function analyzeOntongDaejeonStructure() {
  console.log('🔍 Analyzing Ontong Daejeon mall structure for price extraction...');
  
  const baseUrl = 'https://ontongdaejeon.ezwel.com';
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  
  const analysis = {
    timestamp: new Date().toISOString(),
    baseUrl,
    pages: [],
    productStructure: {},
    pricePatterns: [],
    findings: []
  };

  try {
    // 1. Analyze main page
    console.log('📋 Analyzing main page...');
    const mainResponse = await axios.get(`${baseUrl}/onnuri/main`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      },
      httpsAgent,
      timeout: 30000
    });

    const $ = cheerio.load(mainResponse.data);

    // Save HTML for inspection
    writeFileSync('./scripts/output/ontongdaejeon-main-analysis.html', mainResponse.data);

    // Look for product containers
    const productContainers = $('.goods_list li, .goods_4ea li, [class*="goods"] li');
    console.log(`Found ${productContainers.length} product containers on main page`);

    // Analyze product structure
    const productStructure = {
      containers: productContainers.length,
      selectors: [],
      priceElements: [],
      linkPatterns: []
    };

    productContainers.each((i, elem) => {
      const $elem = $(elem);
      
      // Look for product links
      const links = $elem.find('a[href*="goodsCd="], [onclick*="fn_goGoodsDetail"]');
      links.each((j, link) => {
        const href = $(link).attr('href');
        const onclick = $(link).attr('onclick');
        if (href && href.includes('goodsCd=')) {
          productStructure.linkPatterns.push(href);
        }
        if (onclick && onclick.includes('fn_goGoodsDetail')) {
          productStructure.linkPatterns.push(onclick);
        }
      });

      // Look for price elements
      const priceElements = $elem.find('.price, .cost, [class*="price"], dd.price, span:contains("원"), strong:contains("원")');
      priceElements.each((j, priceElem) => {
        const text = $(priceElem).text().trim();
        const className = $(priceElem).attr('class') || '';
        if (text.includes('원')) {
          productStructure.priceElements.push({
            selector: priceElem.tagName + (className ? '.' + className : ''),
            text: text,
            html: $(priceElem).html()
          });
        }
      });
    });

    analysis.productStructure = productStructure;

    // 2. Try to access a specific product page
    console.log('📦 Analyzing product detail page...');
    
    // Extract a product ID from the main page
    let testProductId = '';
    productContainers.each((i, elem) => {
      const $elem = $(elem);
      const onclickElem = $elem.find('[onclick*="fn_goGoodsDetail"]');
      if (onclickElem.length > 0 && !testProductId) {
        const onclick = onclickElem.attr('onclick');
        const match = onclick?.match(/fn_goGoodsDetail\('(\d+)'/);
        if (match) {
          testProductId = match[1];
        }
      }
    });

    if (testProductId) {
      console.log(`Testing product detail page with ID: ${testProductId}`);
      const detailUrl = `${baseUrl}/onnuri/mall/goodsDetail?goodsCd=${testProductId}`;
      
      try {
        const detailResponse = await axios.get(detailUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Referer': `${baseUrl}/onnuri/main`
          },
          httpsAgent,
          timeout: 30000
        });

        const $detail = cheerio.load(detailResponse.data);
        
        // Save detail page for inspection
        writeFileSync(`./scripts/output/ontongdaejeon-detail-${testProductId}.html`, detailResponse.data);

        // Look for price patterns in detail page
        const detailPriceElements = $detail('*').filter((i, elem) => {
          const text = $detail(elem).text();
          return text.includes('원') && /\d{1,3}(?:,\d{3})*원/.test(text);
        });

        console.log(`Found ${detailPriceElements.length} potential price elements in detail page`);

        detailPriceElements.each((i, elem) => {
          if (i < 10) { // Limit to first 10
            const $elem = $detail(elem);
            const text = $elem.text().trim();
            const className = $elem.attr('class') || '';
            const tagName = elem.tagName;
            
            analysis.pricePatterns.push({
              tagName,
              className,
              text: text.substring(0, 100),
              selector: `${tagName}${className ? '.' + className.split(' ')[0] : ''}`
            });
          }
        });

        // Look for script tags with price data
        const scripts = $detail('script');
        scripts.each((i, script) => {
          const scriptContent = $detail(script).html() || '';
          if (scriptContent.includes('goodsAmt') || scriptContent.includes('price') || scriptContent.includes('원')) {
            analysis.findings.push({
              type: 'script',
              content: scriptContent.substring(0, 500) + '...'
            });
          }
        });

      } catch (detailError) {
        console.log(`⚠️ Could not access detail page: ${detailError.message}`);
        analysis.findings.push({
          type: 'error',
          message: `Detail page access failed: ${detailError.message}`
        });
      }
    }

    // 3. Look for category/listing pages
    console.log('📂 Looking for category pages...');
    const categoryLinks = $('a[href*="goodsList"], a[href*="category"], a[href*="ctgry"]');
    categoryLinks.each((i, link) => {
      const href = $(link).attr('href');
      const text = $(link).text().trim();
      if (href && text) {
        analysis.pages.push({
          type: 'category',
          url: href.startsWith('http') ? href : baseUrl + href,
          title: text
        });
      }
    });

    // 4. Check for AJAX endpoints
    console.log('🔄 Checking for AJAX patterns...');
    const scriptTags = $('script');
    scriptTags.each((i, script) => {
      const scriptContent = $(script).html() || '';
      if (scriptContent.includes('ajax') || scriptContent.includes('goodsList') || scriptContent.includes('productList')) {
        analysis.findings.push({
          type: 'ajax_pattern',
          content: scriptContent.substring(0, 300) + '...'
        });
      }
    });

  } catch (error) {
    console.error(`❌ Error analyzing structure: ${error.message}`);
    analysis.findings.push({
      type: 'error',
      message: error.message
    });
  }

  // Save analysis results
  writeFileSync('./scripts/output/ontongdaejeon-price-structure-analysis.json', JSON.stringify(analysis, null, 2));

  console.log('\n📊 Structure Analysis Summary:');
  console.log(`🏪 Product containers found: ${analysis.productStructure.containers || 0}`);
  console.log(`💰 Price patterns identified: ${analysis.pricePatterns.length}`);
  console.log(`📂 Category pages found: ${analysis.pages.length}`);
  console.log(`🔍 Findings recorded: ${analysis.findings.length}`);

  return analysis;
}

// Run the analysis
analyzeOntongDaejeonStructure()
  .then(() => console.log('\n✅ Structure analysis completed!'))
  .catch(console.error);