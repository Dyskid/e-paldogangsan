# Cron Job Setup for Product Synchronization

This document explains how to set up automatic product synchronization for the e-Paldogangsan platform.

## Deployment Options

### 1. Vercel Cron Jobs (Recommended for Vercel deployment)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/sync-products",
    "schedule": "0 */6 * * *"
  }]
}
```

### 2. GitHub Actions (Alternative)

Create `.github/workflows/sync-products.yml`:
```yaml
name: Sync Products
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger product sync
        run: |
          curl -X POST https://your-domain.com/api/sync-products \
            -H "Authorization: Bearer ${{ secrets.SYNC_API_KEY }}"
```

### 3. External Cron Service (e.g., cron-job.org, EasyCron)

- **URL**: https://your-domain.com/api/sync-products
- **Method**: POST
- **Headers**: Authorization: Bearer YOUR_SYNC_API_KEY
- **Schedule**: Every 6 hours

### 4. Self-hosted (Node.js cron)

Install node-cron and add to your server:
```javascript
const cron = require('node-cron');

cron.schedule('0 */6 * * *', async () => {
  await fetch('https://your-domain.com/api/sync-products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SYNC_API_KEY}`
    }
  });
});
```

## Environment Variables Needed

- `SYNC_API_KEY`: A secure random string for API authentication

## Sync Schedule Options

- **Current**: Every 6 hours (`0 */6 * * *`)
- **Every 12 hours**: `0 */12 * * *`
- **Daily at 2 AM**: `0 2 * * *`
- **Every 3 hours**: `0 */3 * * *`

## Testing

To manually trigger a sync:
```bash
curl -X POST https://your-domain.com/api/sync-products \
  -H "Authorization: Bearer YOUR_SYNC_API_KEY"
```