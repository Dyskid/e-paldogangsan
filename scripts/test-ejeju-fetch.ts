import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

async function testFetch() {
  const url = 'https://mall.ejeju.net/goods/main.do?cate=1';
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      }
    });
    
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'ejeju-test-page.html'),
      response.data
    );
    
    console.log('HTML saved to output/ejeju-test-page.html');
    console.log('Response length:', response.data.length);
    
    // Look for product patterns
    const productPatterns = [
      /class="productimg"/g,
      /class="product"/g,
      /gno=(\d+)/g,
      /detail\.do/g,
      /가격/g,
      /원/g
    ];
    
    productPatterns.forEach(pattern => {
      const matches = response.data.match(pattern);
      console.log(`Pattern ${pattern}: ${matches ? matches.length : 0} matches`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFetch();