const fs = require('fs');

function categorizeDanpoongProducts() {
  console.log('🔧 Improving category classification for 단풍미인 products...');
  
  // Read products
  const products = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));
  
  // Find 단풍미인 products
  const danpoongProducts = products.filter(p => p.mall === '단풍미인 (정읍)');
  console.log(`Found ${danpoongProducts.length} 단풍미인 products`);
  
  let improved = 0;
  
  // Update categories based on product names
  const updatedProducts = products.map(product => {
    if (product.mall !== '단풍미인 (정읍)') return product;
    
    const name = product.name.toLowerCase();
    let newCategory = product.category;
    
    // Rice and grains
    if (name.includes('쌀') || name.includes('현미') || name.includes('찹쌀') || name.includes('누룽지')) {
      newCategory = '곡류';
    }
    // Fruits
    else if (name.includes('오디') || name.includes('복숭아') || name.includes('사과') || name.includes('배') || 
             name.includes('포도') || name.includes('딸기') || name.includes('블루베리') || name.includes('베리') ||
             name.includes('레드향') || name.includes('감귤') || name.includes('곶감')) {
      newCategory = '과일';
    }
    // Vegetables and tubers
    else if (name.includes('마') || name.includes('감자') || name.includes('고구마') || name.includes('양파') ||
             name.includes('당근') || name.includes('배추') || name.includes('무') || name.includes('채소')) {
      newCategory = '채소';
    }
    // Traditional foods and sauces
    else if (name.includes('간장') || name.includes('된장') || name.includes('고추장') || name.includes('장류') ||
             name.includes('조청') || name.includes('엿') || name.includes('잼') || name.includes('청')) {
      newCategory = '전통식품';
    }
    // Porridge and health foods
    else if (name.includes('죽') || name.includes('건강') || name.includes('즙') || name.includes('차') ||
             name.includes('한방') || name.includes('발효')) {
      newCategory = '건강식품';
    }
    // Processed foods
    else if (name.includes('가공') || name.includes('건조') || name.includes('분말') || name.includes('환')) {
      newCategory = '가공식품';
    }
    
    if (newCategory !== product.category) {
      improved++;
    }
    
    return {
      ...product,
      category: newCategory
    };
  });
  
  // Save updated products
  fs.writeFileSync('src/data/products.json', JSON.stringify(updatedProducts, null, 2));
  
  console.log(`✅ Improved categorization for ${improved} products`);
  
  // Show new category distribution
  const danpoongUpdated = updatedProducts.filter(p => p.mall === '단풍미인 (정읍)');
  const categories = {};
  danpoongUpdated.forEach(product => {
    categories[product.category] = (categories[product.category] || 0) + 1;
  });
  
  console.log('\n📊 Updated category distribution:');
  Object.entries(categories).forEach(([category, count]) => {
    console.log(`${category}: ${count} products`);
  });
}

categorizeDanpoongProducts();