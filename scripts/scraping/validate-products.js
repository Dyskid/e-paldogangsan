#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

async function validateProducts(productsFile) {
  try {
    const data = await fs.readFile(productsFile, 'utf-8');
    const products = JSON.parse(data);
    
    console.log(`Validating ${products.length} products...`);
    
    const issues = [];
    const duplicates = new Map();
    const requiredFields = ['id', 'name', 'price', 'productUrl', 'mallId'];
    
    products.forEach((product, index) => {
      // Check required fields
      requiredFields.forEach(field => {
        if (!product[field]) {
          issues.push(`Product at index ${index} missing required field: ${field}`);
        }
      });
      
      // Check price is a valid number
      if (typeof product.price === 'string' || isNaN(product.price) || product.price <= 0) {
        issues.push(`Product at index ${index} (${product.name}) has invalid price: ${product.price}`);
      }
      
      // Check for duplicates
      if (duplicates.has(product.id)) {
        issues.push(`Duplicate product ID found: ${product.id}`);
      } else {
        duplicates.set(product.id, true);
      }
      
      // Check URL validity
      try {
        new URL(product.productUrl);
      } catch (error) {
        issues.push(`Product at index ${index} has invalid URL: ${product.productUrl}`);
      }
      
      // Check image URL if present
      if (product.imageUrl) {
        try {
          new URL(product.imageUrl);
        } catch (error) {
          issues.push(`Product at index ${index} has invalid image URL: ${product.imageUrl}`);
        }
      }
    });
    
    // Summary
    console.log('\n=== Validation Summary ===');
    console.log(`Total products: ${products.length}`);
    console.log(`Unique products: ${duplicates.size}`);
    console.log(`Issues found: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log('\n=== Issues ===');
      issues.slice(0, 20).forEach(issue => console.log(`- ${issue}`));
      if (issues.length > 20) {
        console.log(`... and ${issues.length - 20} more issues`);
      }
      
      // Save issues to file
      const issuesFile = productsFile.replace('.json', '-validation-issues.txt');
      await fs.writeFile(issuesFile, issues.join('\n'));
      console.log(`\nFull issue list saved to: ${issuesFile}`);
      
      process.exit(1);
    } else {
      console.log('\n✓ All products passed validation!');
    }
    
  } catch (error) {
    console.error('Validation failed:', error.message);
    process.exit(1);
  }
}

// Check command line arguments
if (process.argv.length < 3) {
  console.error('Usage: node validate-products.js <products.json>');
  process.exit(1);
}

const productsFile = process.argv[2];
validateProducts(productsFile);