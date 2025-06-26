import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  title?: string;
  name?: string;
  price: number | string;
  imageUrl: string;
  productUrl: string;
  category: string;
  description: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  tags: string[];
}

async function convertTitleToNameOnly() {
  const productsPath = path.join(process.cwd(), 'src/data/products.json');
  
  try {
    console.log('📖 Reading products.json...');
    const productsData = fs.readFileSync(productsPath, 'utf-8');
    const products: Product[] = JSON.parse(productsData);
    
    console.log(`📊 Found ${products.length} products`);
    
    let convertedCount = 0;
    let titleRemovedCount = 0;
    
    // Convert all products to use only 'name' field
    const updatedProducts = products.map((product) => {
      const updatedProduct = { ...product };
      
      // Ensure name field exists - use title if name is missing
      if (!product.name && product.title) {
        updatedProduct.name = product.title;
        convertedCount++;
      } else if (!product.name && !product.title) {
        // Fallback to description or id if both are missing
        updatedProduct.name = product.description || product.id;
        convertedCount++;
      }
      // If both name and title exist, keep the name field (it should already be the same)
      
      // Always remove title field if it exists
      if ('title' in updatedProduct) {
        delete (updatedProduct as any).title;
        titleRemovedCount++;
      }
      
      return updatedProduct;
    });
    
    console.log(`✅ Converted ${convertedCount} products (title → name)`);
    console.log(`🗑️ Removed ${titleRemovedCount} title fields`);
    
    // Write updated products back to file
    console.log('💾 Writing updated products.json...');
    fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2));
    
    // Verify all products now have name field
    const productsWithoutName = updatedProducts.filter(p => !p.name);
    if (productsWithoutName.length > 0) {
      console.error(`❌ ERROR: ${productsWithoutName.length} products still missing name field`);
      console.error('First few products without name:');
      productsWithoutName.slice(0, 5).forEach(p => {
        console.error(`  - ${p.id} (mall: ${p.mallName})`);
      });
    } else {
      console.log('✅ All products now have name field');
    }
    
    // Verify no products have title field
    const productsWithTitle = updatedProducts.filter(p => (p as any).title);
    if (productsWithTitle.length > 0) {
      console.error(`❌ ERROR: ${productsWithTitle.length} products still have title field`);
    } else {
      console.log('✅ All title fields removed successfully');
    }
    
    console.log('🎉 Conversion completed successfully!');
    
  } catch (error) {
    console.error('❌ Error processing products:', error);
    process.exit(1);
  }
}

convertTitleToNameOnly();