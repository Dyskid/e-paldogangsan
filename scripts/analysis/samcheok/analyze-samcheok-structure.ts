import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface AnalysisResult {
  baseUrl: string;
  structure: {
    categories: Array<{
      name: string;
      url: string;
      productCount?: number;
    }>;
    productLinks: string[];
    productPattern: string;
  };
  samplePages: {
    homepage: string;
    categoryPages: string[];
    productPages: string[];
  };
}

async function analyzeSamcheokStructure() {
  console.log('🔍 Starting Samcheok Mall structure analysis...');
  
  const baseUrl = 'https://samcheok-mall.com';
  const analysis: AnalysisResult = {
    baseUrl,
    structure: {
      categories: [],
      productLinks: [],
      productPattern: ''
    },
    samplePages: {
      homepage: '',
      categoryPages: [],
      productPages: []
    }
  };

  try {
    // Fetch homepage
    console.log('📄 Fetching homepage...');
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    analysis.samplePages.homepage = response.data;

    console.log('🏠 Analyzing homepage structure...');

    // Look for navigation menu and categories
    const categorySelectors = [
      'nav a', '.nav a', '.menu a', '.category a',
      '.gnb a', '.lnb a', '#gnb a', '#lnb a',
      '.main-menu a', '.category-menu a', '.cate a'
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
            fullUrl = baseUrl + href;
          } else if (!href.startsWith('http')) {
            fullUrl = baseUrl + '/' + href;
          }
          
          categories.push({ name: text, url: fullUrl });
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
      '.product a', '.goods a', '.item a'
    ];

    let productLinks: string[] = [];
    
    for (const selector of productSelectors) {
      $(selector).each((i, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          let fullUrl = href;
          if (href.startsWith('/')) {
            fullUrl = baseUrl + href;
          } else if (!href.startsWith('http')) {
            fullUrl = baseUrl + '/' + href;
          }
          
          if (fullUrl.includes(baseUrl) && !productLinks.includes(fullUrl)) {
            productLinks.push(fullUrl);
          }
        }
      });
      
      if (productLinks.length > 0) {
        console.log(`✅ Found ${productLinks.length} product links using selector: ${selector}`);
        break;
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
        '/goods_view',
        '/product_view',
        '/view'
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

    // Remove duplicates and filter categories
    const uniqueCategories = categories
      .filter((cat, index, self) => 
        index === self.findIndex(c => c.url === cat.url) &&
        !cat.name.match(/^(home|홈|로그인|login|회원가입|join|고객센터|customer|contact|about)$/i) &&
        cat.url.includes(baseUrl)
      )
      .slice(0, 20); // Limit to 20 categories

    analysis.structure.categories = uniqueCategories;
    analysis.structure.productLinks = productLinks.slice(0, 50); // Limit to 50 product links

    console.log(`\n📊 Analysis Summary:`);
    console.log(`🏷️ Categories found: ${uniqueCategories.length}`);
    console.log(`🛍️ Product links found: ${productLinks.length}`);
    console.log(`🔗 Product pattern: ${analysis.structure.productPattern || 'Not detected'}`);

    // Try to fetch a sample category page
    if (uniqueCategories.length > 0) {
      try {
        console.log('\n📋 Fetching sample category page...');
        const categoryResponse = await axios.get(uniqueCategories[0].url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const analysisPath = path.join(outputDir, 'samcheok-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');

    // Save sample pages
    const homepagePath = path.join(outputDir, 'samcheok-homepage.html');
    fs.writeFileSync(homepagePath, analysis.samplePages.homepage, 'utf-8');

    if (analysis.samplePages.categoryPages.length > 0) {
      const categoryPath = path.join(outputDir, 'samcheok-category-sample.html');
      fs.writeFileSync(categoryPath, analysis.samplePages.categoryPages[0], 'utf-8');
    }

    if (analysis.samplePages.productPages.length > 0) {
      const productPath = path.join(outputDir, 'samcheok-product-sample.html');
      fs.writeFileSync(productPath, analysis.samplePages.productPages[0], 'utf-8');
    }

    console.log(`\n💾 Analysis saved to: ${analysisPath}`);
    console.log(`📄 Homepage saved to: ${homepagePath}`);

    return analysis;

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  }
}

// Run analysis
analyzeSamcheokStructure()
  .then((result) => {
    console.log('\n🎉 Samcheok Mall structure analysis completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review the saved HTML files to understand the page structure');
    console.log('2. Create a scraper based on the detected patterns');
    console.log('3. Test with sample product pages');
  })
  .catch((error) => {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  });