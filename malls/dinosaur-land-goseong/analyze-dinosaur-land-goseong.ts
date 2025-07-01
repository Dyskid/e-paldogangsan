import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

interface AnalysisResult {
  baseUrl: string;
  mallName: string;
  timestamp: string;
  structure: {
    categories: Array<{
      name: string;
      url: string;
      productCount?: number;
    }>;
    productLinks: string[];
    productPattern: string;
    paginationType: string;
    requiresJavaScript: boolean;
  };
  samplePages: {
    homepage: string;
    categoryPages: string[];
    productPages: string[];
  };
  dataStructure: {
    productSelectors: string[];
    priceSelectors: string[];
    titleSelectors: string[];
    imageSelectors: string[];
  };
}

async function analyzeDinosaurLandStructure() {
  console.log('🔍 Starting Dinosaur Land (Goseong) Mall structure analysis...');
  
  const baseUrl = 'https://www.edinomall.com/shop/smain/index.php';
  const analysis: AnalysisResult = {
    baseUrl,
    mallName: '공룡나라 (고성)',
    timestamp: new Date().toISOString(),
    structure: {
      categories: [],
      productLinks: [],
      productPattern: '',
      paginationType: 'unknown',
      requiresJavaScript: false
    },
    samplePages: {
      homepage: '',
      categoryPages: [],
      productPages: []
    },
    dataStructure: {
      productSelectors: [],
      priceSelectors: [],
      titleSelectors: [],
      imageSelectors: []
    }
  };

  try {
    // First try with axios
    console.log('📄 Fetching homepage with axios...');
    let response;
    try {
      response = await axios.get(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        timeout: 30000,
        maxRedirects: 5
      });
      
      analysis.samplePages.homepage = response.data;
      console.log('✅ Homepage fetched successfully with axios');
    } catch (axiosError) {
      console.log('⚠️ Axios failed, trying with Puppeteer...');
      analysis.structure.requiresJavaScript = true;
      
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        await page.goto(baseUrl, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        analysis.samplePages.homepage = await page.content();
        console.log('✅ Homepage fetched successfully with Puppeteer');
      } finally {
        await browser.close();
      }
    }

    const $ = cheerio.load(analysis.samplePages.homepage);

    console.log('🏠 Analyzing homepage structure...');

    // Look for navigation menu and categories
    const categorySelectors = [
      '.category a', '.menu a', 'nav a', '.nav a',
      '.gnb a', '.lnb a', '#gnb a', '#lnb a',
      '.main-menu a', '.category-menu a', '.product-category a',
      'a[href*="category"]', 'a[href*="cat_cd"]', 'a[href*="cate"]'
    ];

    let categories: Array<{name: string, url: string}> = [];
    
    for (const selector of categorySelectors) {
      $(selector).each((i, elem) => {
        const $elem = $(elem);
        const href = $elem.attr('href');
        const text = $elem.text().trim();
        
        if (href && text && text.length > 0 && text.length < 50) {
          let fullUrl = href;
          if (href.startsWith('/')) {
            fullUrl = new URL(href, baseUrl).href;
          } else if (!href.startsWith('http')) {
            fullUrl = new URL(href, baseUrl).href;
          }
          
          // Filter out non-category links
          if (!href.includes('login') && !href.includes('join') && 
              !href.includes('mypage') && !href.includes('cart') &&
              !href.includes('board') && !href.includes('customer')) {
            categories.push({ name: text, url: fullUrl });
          }
        }
      });
      
      if (categories.length > 0) {
        console.log(`✅ Found ${categories.length} categories using selector: ${selector}`);
        break;
      }
    }

    // Look for product links on homepage
    const productSelectors = [
      'a[href*="/goods/"]', 'a[href*="/product/"]', 'a[href*="/item/"]',
      'a[href*="goods_view"]', 'a[href*="product_view"]', 'a[href*="view"]',
      'a[href*="no="]', 'a[href*="idx="]', 'a[href*="id="]',
      '.product a', '.goods a', '.item a', '.prd_item a'
    ];

    let productLinks: string[] = [];
    
    for (const selector of productSelectors) {
      $(selector).each((i, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          let fullUrl = href;
          if (href.startsWith('/')) {
            fullUrl = new URL(href, baseUrl).href;
          } else if (!href.startsWith('http')) {
            fullUrl = new URL(href, baseUrl).href;
          }
          
          // Check if it's likely a product link
          if (fullUrl.includes('edinomall.com') && 
              (href.includes('goods') || href.includes('product') || 
               href.includes('view') || href.includes('no=') || 
               href.includes('idx='))) {
            if (!productLinks.includes(fullUrl)) {
              productLinks.push(fullUrl);
            }
          }
        }
      });
      
      if (productLinks.length > 0) {
        console.log(`✅ Found ${productLinks.length} product links using selector: ${selector}`);
        analysis.dataStructure.productSelectors.push(selector);
      }
    }

    // Analyze product URL pattern
    if (productLinks.length > 0) {
      const sampleUrl = productLinks[0];
      console.log(`🔗 Sample product URL: ${sampleUrl}`);
      
      // Common patterns
      const patterns = [
        '/goods/view',
        '/product/view',
        '/goods_view.php',
        '/product_view.php',
        '/view.php',
        'no=',
        'idx=',
        'goods_no='
      ];
      
      let detectedPattern = '';
      for (const pattern of patterns) {
        if (sampleUrl.includes(pattern)) {
          detectedPattern = pattern;
          break;
        }
      }
      
      analysis.structure.productPattern = detectedPattern;
      console.log(`📝 Detected product pattern: ${detectedPattern}`);
    }

    // Look for pagination
    const paginationSelectors = [
      '.pagination', '.paging', '.page', '.pages',
      'a[href*="page="]', 'a[href*="p="]',
      '.page-link', '.page-number'
    ];

    for (const selector of paginationSelectors) {
      if ($(selector).length > 0) {
        analysis.structure.paginationType = 'standard';
        console.log(`📄 Pagination detected: ${selector}`);
        break;
      }
    }

    // Look for price selectors
    const priceSelectors = [
      '.price', '.product-price', '.item-price',
      '[class*="price"]', '[class*="cost"]',
      'span:contains("원")', 'div:contains("원")'
    ];

    for (const selector of priceSelectors) {
      if ($(selector).length > 0) {
        analysis.dataStructure.priceSelectors.push(selector);
      }
    }

    // Look for title selectors
    const titleSelectors = [
      '.product-name', '.product-title', '.item-name',
      '.goods-name', '.prd-name', '[class*="name"]',
      'h3', 'h4', '.title'
    ];

    for (const selector of titleSelectors) {
      if ($(selector).length > 0) {
        analysis.dataStructure.titleSelectors.push(selector);
      }
    }

    // Look for image selectors
    const imageSelectors = [
      '.product-image img', '.product-thumb img',
      '.item-image img', '.goods-image img',
      '[class*="thumb"] img', '[class*="image"] img'
    ];

    for (const selector of imageSelectors) {
      if ($(selector).length > 0) {
        analysis.dataStructure.imageSelectors.push(selector);
      }
    }

    // Remove duplicates and filter categories
    const uniqueCategories = categories
      .filter((cat, index, self) => 
        index === self.findIndex(c => c.url === cat.url)
      )
      .slice(0, 20); // Limit to 20 categories

    analysis.structure.categories = uniqueCategories;
    analysis.structure.productLinks = productLinks.slice(0, 50); // Limit to 50 product links

    console.log(`\n📊 Analysis Summary:`);
    console.log(`🏷️ Categories found: ${uniqueCategories.length}`);
    console.log(`🛍️ Product links found: ${productLinks.length}`);
    console.log(`🔗 Product pattern: ${analysis.structure.productPattern || 'Not detected'}`);
    console.log(`📄 Pagination type: ${analysis.structure.paginationType}`);
    console.log(`🖥️ Requires JavaScript: ${analysis.structure.requiresJavaScript}`);
    console.log(`💰 Price selectors: ${analysis.dataStructure.priceSelectors.length}`);
    console.log(`📝 Title selectors: ${analysis.dataStructure.titleSelectors.length}`);
    console.log(`🖼️ Image selectors: ${analysis.dataStructure.imageSelectors.length}`);

    // Try to fetch a sample category page
    if (uniqueCategories.length > 0) {
      try {
        console.log('\n📋 Fetching sample category page...');
        const categoryResponse = await axios.get(uniqueCategories[0].url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': baseUrl
          },
          timeout: 15000
        });
        
        analysis.samplePages.categoryPages.push(categoryResponse.data);
        console.log(`✅ Sample category page fetched: ${uniqueCategories[0].name}`);
      } catch (error) {
        console.log(`⚠️ Could not fetch category page: ${error}`);
      }
    }

    // Try to fetch a sample product page
    if (productLinks.length > 0) {
      try {
        console.log('🛍️ Fetching sample product page...');
        const productResponse = await axios.get(productLinks[0], {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': baseUrl
          },
          timeout: 15000
        });
        
        analysis.samplePages.productPages.push(productResponse.data);
        console.log(`✅ Sample product page fetched`);
      } catch (error) {
        console.log(`⚠️ Could not fetch product page: ${error}`);
      }
    }

    // Save analysis results
    const outputDir = path.join(__dirname);
    
    const analysisPath = path.join(outputDir, 'edinomall-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');

    // Save sample pages
    if (analysis.samplePages.homepage) {
      const homepagePath = path.join(outputDir, 'edinomall-homepage-axios.html');
      fs.writeFileSync(homepagePath, analysis.samplePages.homepage, 'utf-8');
    }

    if (analysis.samplePages.categoryPages.length > 0) {
      const categoryPath = path.join(outputDir, 'edinomall-category-sample.html');
      fs.writeFileSync(categoryPath, analysis.samplePages.categoryPages[0], 'utf-8');
    }

    if (analysis.samplePages.productPages.length > 0) {
      const productPath = path.join(outputDir, 'edinomall-product-sample.html');
      fs.writeFileSync(productPath, analysis.samplePages.productPages[0], 'utf-8');
    }

    console.log(`\n💾 Analysis saved to: ${analysisPath}`);
    console.log(`📄 Homepage saved`);

    return analysis;

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  }
}

// Run analysis
analyzeDinosaurLandStructure()
  .then((result) => {
    console.log('\n🎉 Dinosaur Land (Goseong) Mall structure analysis completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review the saved HTML files to understand the page structure');
    console.log('2. Check if JavaScript rendering is required');
    console.log('3. Create a scraper based on the detected patterns');
    console.log('4. Test with sample product pages');
  })
  .catch((error) => {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  });