import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeMgmallStructure() {
  console.log('🔍 Starting analysis of 문경몰 (https://mgmall.cyso.co.kr)...\n');

  const baseUrl = 'https://mgmall.cyso.co.kr';
  
  try {
    // Fetch the homepage
    console.log('📥 Fetching homepage...');
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Save homepage HTML for reference
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(outputDir, 'mgmall-homepage.html'), response.data);
    console.log('✅ Homepage saved for analysis');

    // Look for product links - CYSO platform typically uses shop/item.php?it_id=
    const productLinks = $('a[href*="shop/item.php?it_id="]');
    console.log(`🔗 Found ${productLinks.length} product links on homepage`);

    // Extract categories and navigation
    const categories: string[] = [];
    
    // Check common category selectors
    $('a[href*="category"], .category, .menu a, nav a, .gnb a').each((_, element) => {
      const text = $(element).text().trim();
      const href = $(element).attr('href');
      if (text && text.length > 0 && text.length < 50) {
        categories.push(`${text} (${href})`);
      }
    });

    // Look for specific category pages
    $('a[href*="category"], a[href*="cate"], a[href*="goods"]').each((_, element) => {
      const text = $(element).text().trim();
      const href = $(element).attr('href');
      if (text && text.length > 0 && text.length < 30) {
        categories.push(`${text} (${href})`);
      }
    });

    console.log(`📂 Found ${categories.length} potential categories`);

    // Get a sample product URL for testing
    let sampleProductUrl = '';
    if (productLinks.length > 0) {
      const href = $(productLinks[0]).attr('href');
      sampleProductUrl = href?.startsWith('http') ? href : `${baseUrl}${href?.startsWith('/') ? href : '/' + href}`;
    }

    // Check if this follows CYSO platform pattern (like other malls we've seen)
    const isCysoPlatform = productLinks.length > 0 && sampleProductUrl.includes('shop/item.php?it_id=');

    // Look for search functionality
    const hasSearch = $('input[name*="search"], input[type="search"]').length > 0;

    // Analysis summary
    const analysis = {
      mallName: '문경몰',
      baseUrl,
      platform: isCysoPlatform ? 'CYSO (Same as 사이소/상주몰/청도몰/영주장날/청송몰/영양온심마켓/울릉도몰/봉화장터/예천장터)' : 'Unknown/Custom',
      productUrlPattern: isCysoPlatform ? 'shop/item.php?it_id=' : 'Unknown',
      categoriesFound: Array.from(new Set(categories)).slice(0, 15), // Remove duplicates and limit
      productsOnHomepage: productLinks.length,
      sampleProductUrl,
      hasSearch,
      analysisDate: new Date().toISOString()
    };

    console.log('\n📊 Analysis Results:');
    console.log('===================');
    console.log(`🏪 Mall Name: ${analysis.mallName}`);
    console.log(`🌐 Base URL: ${analysis.baseUrl}`);
    console.log(`⚙️ Platform: ${analysis.platform}`);
    console.log(`🔗 Product URL Pattern: ${analysis.productUrlPattern}`);
    console.log(`📦 Products on Homepage: ${analysis.productsOnHomepage}`);
    console.log(`🔍 Has Search: ${analysis.hasSearch}`);
    console.log(`📂 Sample Categories: ${analysis.categoriesFound.slice(0, 5).join(', ')}`);
    console.log(`🔗 Sample Product URL: ${analysis.sampleProductUrl}`);

    // Save analysis results
    const analysisPath = path.join(outputDir, 'mgmall-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
    console.log(`\n💾 Analysis saved: ${analysisPath}`);

    return analysis;

  } catch (error) {
    console.error('❌ Error analyzing 문경몰:', error);
    throw error;
  }
}

// Run analysis
analyzeMgmallStructure()
  .then(() => {
    console.log('\n✅ 문경몰 structure analysis completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });