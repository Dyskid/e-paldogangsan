const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function analyzeMall() {
  const baseUrl = 'https://shinan1004mall.kr';
  const requirementsDir = path.join(__dirname, 'requirements');
  
  // Read homepage HTML
  const homepageHtml = fs.readFileSync(path.join(requirementsDir, 'homepage.html'), 'utf-8');
  const homepageDom = new JSDOM(homepageHtml);
  const homeDoc = homepageDom.window.document;
  
  // Read category HTML
  const categoryHtml = fs.readFileSync(path.join(requirementsDir, 'category_agricultural.html'), 'utf-8');
  const categoryDom = new JSDOM(categoryHtml);
  const categoryDoc = categoryDom.window.document;
  
  // Extract categories from homepage
  const categories = [];
  const categoryLinks = homeDoc.querySelectorAll('.xans-layout-category a[href*="cate_no="]');
  
  categoryLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const match = href.match(/cate_no=(\d+)/);
    if (match) {
      categories.push({
        id: match[1],
        name: link.textContent?.trim() || '',
        url: `${baseUrl}${href}`
      });
    }
  });
  
  // Extract sample products from category page
  const sampleProducts = [];
  const productItems = categoryDoc.querySelectorAll('li[id^="anchorBoxId_"]');
  
  productItems.forEach((item, index) => {
    if (index < 5) { // Get first 5 products as samples
      const id = item.id.replace('anchorBoxId_', '');
      const nameElement = item.querySelector('.name a');
      const priceElement = item.querySelector('.xans-product-listitem');
      const imageElement = item.querySelector('.thumbnail img');
      const linkElement = item.querySelector('.name a');
      
      if (nameElement && linkElement) {
        sampleProducts.push({
          id: id,
          name: nameElement.textContent?.trim() || '',
          price: priceElement?.textContent?.trim() || '',
          imageUrl: imageElement?.getAttribute('src') || '',
          detailUrl: `${baseUrl}${linkElement.getAttribute('href') || ''}`
        });
      }
    }
  });
  
  // Check for pagination
  const paginationElements = categoryDoc.querySelectorAll('.xans-product-normalpaging');
  const hasPagination = paginationElements.length > 0;
  
  // Detect platform - Cafe24 is clearly indicated in the HTML
  const isCafe24 = homepageHtml.includes('cafe24') || homepageHtml.includes('CAFE24');
  
  const analysis = {
    mallId: '51',
    mallName: '신안 1004몰',
    baseUrl: baseUrl,
    structure: {
      platform: 'Cafe24',
      hasJavaScriptRendering: true,
      hasPagination: hasPagination,
      hasInfiniteScroll: false
    },
    categories: categories.slice(0, 10), // Top 10 categories
    urlPatterns: {
      category: '/product/list.html?cate_no={categoryId}',
      product: '/product/{productName}/{productId}/category/{categoryId}/display/1/',
      pagination: '/product/list.html?cate_no={categoryId}&page={pageNumber}'
    },
    selectors: {
      productList: 'ul.prdList',
      productItem: 'li[id^="anchorBoxId_"]',
      productName: '.name a',
      productPrice: '.xans-product-listitem',
      productImage: '.thumbnail img',
      productLink: '.name a',
      pagination: '.xans-product-normalpaging',
      categoryMenu: '.xans-layout-category'
    },
    sampleProducts: sampleProducts,
    analysis: {
      totalCategories: categories.length,
      accessible: true,
      requiresJavaScript: false, // Basic product data is in HTML
      dataStructure: 'HTML with Cafe24 e-commerce structure',
      recommendedScrapeMethod: 'HTML parsing with CSS selectors'
    }
  };
  
  return analysis;
}

// Run the analysis
async function main() {
  try {
    console.log('Starting mall analysis...');
    const analysis = await analyzeMall();
    
    // Save analysis to JSON file
    const outputPath = path.join(__dirname, 'analysis-51.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    
    console.log('Analysis completed successfully!');
    console.log(`Results saved to: ${outputPath}`);
    console.log('\nSummary:');
    console.log(`- Mall: ${analysis.mallName}`);
    console.log(`- Platform: ${analysis.structure.platform}`);
    console.log(`- Categories found: ${analysis.analysis.totalCategories}`);
    console.log(`- Sample products extracted: ${analysis.sampleProducts.length}`);
    console.log(`- Requires JavaScript: ${analysis.analysis.requiresJavaScript}`);
    
  } catch (error) {
    console.error('Error during analysis:', error);
    process.exit(1);
  }
}

main();