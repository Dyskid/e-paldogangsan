#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const TRACKING_FILE = path.join(__dirname, '../../mall-scraping-status.json');

async function updateStatus(mallId, status, updates = {}) {
  try {
    // Load existing tracking data
    let tracking = { malls: {} };
    try {
      const data = await fs.readFile(TRACKING_FILE, 'utf-8');
      tracking = JSON.parse(data);
    } catch (error) {
      console.log('Creating new tracking file');
    }
    
    // Initialize mall entry if it doesn't exist
    if (!tracking.malls[mallId]) {
      tracking.malls[mallId] = {
        mallId,
        name: updates.name || mallId,
        status: 'pending',
        analyzer_created: false,
        scraper_created: false,
        products_scraped: 0,
        products_registered: 0,
        last_updated: new Date().toISOString()
      };
    }
    
    // Update status and fields
    tracking.malls[mallId].status = status;
    tracking.malls[mallId].last_updated = new Date().toISOString();
    
    // Apply any additional updates
    Object.assign(tracking.malls[mallId], updates);
    
    // Save tracking data
    await fs.writeFile(TRACKING_FILE, JSON.stringify(tracking, null, 2));
    
    console.log(`Updated ${mallId} status to: ${status}`);
    
  } catch (error) {
    console.error('Failed to update status:', error);
    process.exit(1);
  }
}

// Parse command line arguments
if (process.argv.length < 4) {
  console.error('Usage: node update-status.js <mall_id> <status> [key=value ...]');
  console.error('Status: pending|analyzing|scraping|completed|failed');
  console.error('Example: node update-status.js mall_1 analyzing analyzer_created=true');
  process.exit(1);
}

const mallId = process.argv[2];
const status = process.argv[3];
const updates = {};

// Parse additional key=value pairs
for (let i = 4; i < process.argv.length; i++) {
  const [key, value] = process.argv[i].split('=');
  if (key && value) {
    // Convert boolean strings
    if (value === 'true') updates[key] = true;
    else if (value === 'false') updates[key] = false;
    else if (!isNaN(value)) updates[key] = Number(value);
    else updates[key] = value;
  }
}

updateStatus(mallId, status, updates);