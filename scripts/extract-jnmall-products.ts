import fs from 'fs/promises';
import * as cheerio from 'cheerio';

async function extractJnmallProducts() {
  try {
    // Read the homepage HTML
    const html = await fs.readFile('scripts/output/jnmall-homepage.html', 'utf-8');
    
    // Look for product data in script tags
    const scriptMatch = html.match(/<script>self\.__next_f\.push\(\[1,"([^"]+)"\]\)<\/script>/g);
    
    if (scriptMatch) {
      console.log(`Found ${scriptMatch.length} script blocks`);
      
      const products: any[] = [];
      
      for (const script of scriptMatch) {
        // Extract the content
        const contentMatch = script.match(/<script>self\.__next_f\.push\(\[1,"(.+)"\]\)<\/script>/);
        if (contentMatch) {
          const content = contentMatch[1];
          
          // Unescape the content
          const unescaped = content.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          
          // Look for product data patterns
          const productMatches = unescaped.match(/"productSeq":\d+[^}]+}/g);
          
          if (productMatches) {
            console.log(`Found ${productMatches.length} product patterns in this script`);
            
            for (const match of productMatches) {
              try {
                // Try to extract product info
                const titleMatch = match.match(/"productName":"([^"]+)"/);
                const priceMatch = match.match(/"salesPrice":(\d+)/);
                const seqMatch = match.match(/"productSeq":(\d+)/);
                const imageMatch = unescaped.match(new RegExp(`product/${seqMatch?.[1]}_[^"]+`));
                
                if (titleMatch && priceMatch && seqMatch) {
                  const product = {
                    id: seqMatch[1],
                    title: titleMatch[1],
                    price: parseInt(priceMatch[1]),
                    image: imageMatch ? `https://obj-g-1.ktcloud.com/${imageMatch[0]}` : '',
                    url: `https://www.jnmall.kr/product/${seqMatch[1]}/detail`
                  };
                  
                  // Check if we already have this product
                  if (!products.find(p => p.id === product.id)) {
                    products.push(product);
                    console.log(`Product: ${product.title} - ${product.price}원`);
                  }
                }
              } catch (e) {
                // Continue on error
              }
            }
          }
        }
      }
      
      console.log(`\nTotal unique products found: ${products.length}`);
      
      // Save the products
      await fs.writeFile(
        'scripts/output/jnmall-extracted-products.json',
        JSON.stringify(products, null, 2)
      );
      
      // Also try to find more structured data
      const structuredDataMatch = html.match(/"products":\[([^\]]+)\]/);
      if (structuredDataMatch) {
        console.log('\nFound structured product data!');
        try {
          const productsJson = `[${structuredDataMatch[1]}]`;
          const structuredProducts = JSON.parse(productsJson);
          console.log(`Structured products: ${structuredProducts.length}`);
        } catch (e) {
          console.log('Failed to parse structured data');
        }
      }
      
    } else {
      console.log('No Next.js script blocks found');
    }
    
    // Also check for regular HTML product elements
    const $ = cheerio.load(html);
    
    console.log('\nLooking for product elements in HTML...');
    
    const htmlProducts: any[] = [];
    
    // Look for product containers
    $('.prd_list .item, .product-item, .goods-item').each((_, elem) => {
      const $elem = $(elem);
      
      const title = $elem.find('.prd_title, .product-name, .goods-name').text().trim();
      const priceText = $elem.find('.price_sale, .price, .sales-price').text().trim();
      const price = parseInt(priceText.replace(/[^0-9]/g, ''));
      const image = $elem.find('img').attr('src');
      
      if (title && price) {
        htmlProducts.push({
          title,
          price,
          image,
          source: 'html'
        });
      }
    });
    
    console.log(`Found ${htmlProducts.length} products in HTML`);
    
    if (htmlProducts.length > 0) {
      await fs.writeFile(
        'scripts/output/jnmall-html-products.json',
        JSON.stringify(htmlProducts, null, 2)
      );
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

extractJnmallProducts();