#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../../src/data/products.json');

async function registerProducts(mallId, scrapedFile) {
  try {
    // Load scraped products
    const scrapedData = await fs.readFile(scrapedFile, 'utf-8');
    const scrapedProducts = JSON.parse(scrapedData);
    
    console.log(`Loading ${scrapedProducts.length} products from ${mallId}...`);
    
    // Load existing products
    let existingProducts = [];
    try {
      const productsData = await fs.readFile(PRODUCTS_FILE, 'utf-8');
      existingProducts = JSON.parse(productsData);
    } catch (error) {
      console.log('No existing products file, creating new one');
    }
    
    // Create backup
    if (existingProducts.length > 0) {
      const backupFile = PRODUCTS_FILE.replace('.json', `-backup-${Date.now()}.json`);
      await fs.writeFile(backupFile, JSON.stringify(existingProducts, null, 2));
      console.log(`Created backup: ${backupFile}`);
    }
    
    // Remove old products from this mall
    const filteredProducts = existingProducts.filter(p => 
      p.mallId !== mallId && p.mall?.mallId !== mallId
    );
    const removedCount = existingProducts.length - filteredProducts.length;
    
    // Add new products
    const updatedProducts = [...filteredProducts, ...scrapedProducts];
    
    // Save updated products
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(updatedProducts, null, 2));
    
    console.log(`✓ Registered ${scrapedProducts.length} products (removed ${removedCount} old products)`);
    console.log(`Total products: ${updatedProducts.length}`);
    
    // Update tracking status
    await updateTrackingStatus(mallId, 'completed', scrapedProducts.length);
    
  } catch (error) {
    console.error(`Failed to register products for ${mallId}:`, error.message);
    await updateTrackingStatus(mallId, 'failed', 0, error.message);
    process.exit(1);
  }
}

async function updateTrackingStatus(mallId, status, productCount, error = null) {
  const trackingFile = path.join(__dirname, '../../mall-scraping-status.json');
  
  try {
    let tracking = {};
    try {
      const data = await fs.readFile(trackingFile, 'utf-8');
      tracking = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet
    }
    
    if (!tracking.malls) tracking.malls = {};
    
    if (!tracking.malls[mallId]) {
      tracking.malls[mallId] = {
        mallId,
        status: 'pending',
        analyzer_created: false,
        scraper_created: false,
        products_scraped: 0,
        products_registered: 0,
        last_updated: new Date().toISOString()
      };
    }
    
    tracking.malls[mallId].status = status;
    tracking.malls[mallId].products_registered = productCount;
    tracking.malls[mallId].last_updated = new Date().toISOString();
    if (error) {
      tracking.malls[mallId].error = error;
    }
    
    await fs.writeFile(trackingFile, JSON.stringify(tracking, null, 2));
  } catch (error) {
    console.error('Failed to update tracking status:', error);
  }
}

// Check command line arguments
if (process.argv.length < 4) {
  console.error('Usage: node register-products.js <mall_id> <scraped_products.json>');
  process.exit(1);
}

const mallId = process.argv[2];
const scrapedFile = process.argv[3];

registerProducts(mallId, scrapedFile);