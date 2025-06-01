import { Product } from '@/types';
import { classifyProduct } from '@/lib/product-classifier';
import fs from 'fs/promises';
import path from 'path';

const PRODUCTS_FILE = path.join(process.cwd(), 'src/data/products.json');

async function classifyAllProducts() {
  try {
    console.log('Loading products...');
    const productsData = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    const products: Product[] = JSON.parse(productsData);
    
    console.log(`Found ${products.length} products to classify`);
    
    let classifiedCount = 0;
    let unclassifiedCount = 0;
    const categoryStats: Record<string, number> = {};
    
    // Classify each product
    const classifiedProducts = products.map(product => {
      const classification = classifyProduct(product.name, product.description);
      
      if (classification) {
        // Update product with classification
        product.category = classification.mainCategory;
        product.subcategory = classification.subcategory;
        
        // Add category tag if not present
        if (!product.tags.includes(classification.mainCategory)) {
          product.tags.push(classification.mainCategory);
        }
        
        classifiedCount++;
        categoryStats[classification.mainCategory] = (categoryStats[classification.mainCategory] || 0) + 1;
        
        console.log(`✓ Classified "${product.name}" as ${classification.mainCategory}/${classification.subcategory} (confidence: ${(classification.confidence * 100).toFixed(1)}%)`);
      } else {
        // Default to 'other' category if classification fails
        if (!product.category) {
          product.category = 'other';
        }
        unclassifiedCount++;
        console.log(`✗ Could not classify "${product.name}"`);
      }
      
      return product;
    });
    
    // Save updated products
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(classifiedProducts, null, 2));
    
    // Print statistics
    console.log('\n=== Classification Results ===');
    console.log(`Total products: ${products.length}`);
    console.log(`Successfully classified: ${classifiedCount} (${((classifiedCount / products.length) * 100).toFixed(1)}%)`);
    console.log(`Could not classify: ${unclassifiedCount} (${((unclassifiedCount / products.length) * 100).toFixed(1)}%)`);
    
    console.log('\n=== Category Distribution ===');
    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`${category}: ${count} products (${((count / products.length) * 100).toFixed(1)}%)`);
      });
    
    console.log('\n✅ Classification complete! Products have been updated.');
    
  } catch (error) {
    console.error('Error classifying products:', error);
    process.exit(1);
  }
}

// Run the classification
classifyAllProducts();