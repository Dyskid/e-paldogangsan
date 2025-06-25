import fs from 'fs';
import path from 'path';

const productsPath = path.join(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

let fixedCount = 0;
const issues: string[] = [];

// Fix products
const fixedProducts = products.map((product: any) => {
  // Check if this is a 광명가치몰 product
  if (product.mallName === '광명가치몰' || product.mallId === 'gmsocial') {
    let fixed = false;
    
    // Ensure name field exists and is not empty
    if (!product.name || product.name === '' || product.name === null || product.name === undefined) {
      if (product.title && product.title !== '') {
        product.name = product.title;
        fixed = true;
        issues.push(`Fixed missing name for ${product.id}: copied from title`);
      } else {
        issues.push(`WARNING: ${product.id} has no title or name!`);
      }
    }
    
    // Ensure title field exists and is not empty
    if (!product.title || product.title === '' || product.title === null || product.title === undefined) {
      if (product.name && product.name !== '') {
        product.title = product.name;
        fixed = true;
        issues.push(`Fixed missing title for ${product.id}: copied from name`);
      }
    }
    
    // Ensure name is a string and trimmed
    if (product.name && typeof product.name === 'string') {
      const trimmedName = product.name.trim();
      if (trimmedName !== product.name) {
        product.name = trimmedName;
        fixed = true;
        issues.push(`Trimmed name for ${product.id}`);
      }
    }
    
    // Ensure title is a string and trimmed
    if (product.title && typeof product.title === 'string') {
      const trimmedTitle = product.title.trim();
      if (trimmedTitle !== product.title) {
        product.title = trimmedTitle;
        fixed = true;
        issues.push(`Trimmed title for ${product.id}`);
      }
    }
    
    if (fixed) {
      fixedCount++;
    }
  }
  
  return product;
});

// Write the fixed products back
fs.writeFileSync(productsPath, JSON.stringify(fixedProducts, null, 2));

console.log(`Fixed ${fixedCount} 광명가치몰 products`);

if (issues.length > 0) {
  console.log('\nIssues found and fixed:');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
}

// Final verification
const gmsocialProducts = fixedProducts.filter((product: any) => 
  product.mallName === '광명가치몰' || product.mallId === 'gmsocial'
);

console.log(`\nFinal verification:`);
console.log(`Total 광명가치몰 products: ${gmsocialProducts.length}`);

const stillProblematic = gmsocialProducts.filter((product: any) => 
  !product.name || product.name === '' || product.name === null || product.name === undefined ||
  !product.title || product.title === '' || product.title === null || product.title === undefined
);

console.log(`Products still missing name or title: ${stillProblematic.length}`);

if (stillProblematic.length > 0) {
  console.log('\nProblematic products:');
  stillProblematic.forEach((product: any) => {
    console.log(`- ${product.id}: name="${product.name}" title="${product.title}"`);
  });
} else {
  console.log('✅ All 광명가치몰 products have proper name and title fields!');
}