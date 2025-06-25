import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

async function testYeosumallAccess() {
  try {
    console.log('Testing different access methods for yeosumall.co.kr...');
    
    const attempts = [
      'http://www.yeosumall.co.kr/',
      'https://www.yeosumall.co.kr/',
      'http://yeosumall.co.kr/',
      'https://yeosumall.co.kr/',
      'http://www.yeosumall.co.kr/main/',
      'http://www.yeosumall.co.kr/index.php'
    ];
    
    for (const url of attempts) {
      try {
        console.log(`\nTrying: ${url}`);
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
          },
          timeout: 15000,
          maxRedirects: 5,
          validateStatus: (status) => status < 500 // Accept redirects and client errors
        });
        
        console.log(`Status: ${response.status}`);
        console.log(`Content length: ${response.data.length}`);
        
        // Check if it's the server capacity exceeded page
        if (response.data.includes('서버 용량을 초과') || response.data.includes('서버용량')) {
          console.log('❌ Server capacity exceeded message detected');
          continue;
        }
        
        // Check if it contains actual website content
        const $ = cheerio.load(response.data);
        const title = $('title').text();
        const hasNavigation = $('nav, .menu, .gnb, .category').length > 0;
        const hasProducts = $('[class*="product"], [class*="goods"], [class*="item"]').length > 0;
        
        console.log(`Title: ${title}`);
        console.log(`Has navigation: ${hasNavigation}`);
        console.log(`Has products: ${hasProducts}`);
        
        if (hasNavigation || hasProducts || title.includes('여수몰')) {
          console.log('✅ Found actual website content!');
          
          // Save the working content
          await fs.writeFile('scripts/output/yeosumall-working-page.html', response.data);
          
          // Quick analysis
          const links = new Set<string>();
          $('a[href]').each((_, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();
            if (href && text && !href.includes('javascript:')) {
              links.add(`${text}: ${href}`);
            }
          });
          
          console.log('\nFound links:');
          Array.from(links).slice(0, 10).forEach(link => console.log(`  ${link}`));
          
          return {
            url,
            working: true,
            content: response.data
          };
        }
        
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
      }
    }
    
    console.log('\n❌ All access attempts failed or returned server capacity messages');
    return null;
    
  } catch (error) {
    console.error('Error in access test:', error);
    return null;
  }
}

testYeosumallAccess();