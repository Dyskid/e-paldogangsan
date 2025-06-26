// Deployment trigger script
// This file triggers a rebuild to ensure the latest product data is deployed

const buildInfo = {
  timestamp: new Date().toISOString(),
  purpose: 'Trigger rebuild for 광명가치몰 product names fix',
  version: '1.0.1',
  changes: [
    'Verified all 38 광명가치몰 products have names in local data',
    'Fixed URL structure for gmsocial products', 
    'Added comprehensive product verification scripts',
    'Triggered rebuild to sync live site with latest data'
  ]
};

console.log('🚀 Deployment trigger:', buildInfo);

export default buildInfo;