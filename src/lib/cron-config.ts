// Cron job configuration for periodic product sync
// See CRON_SETUP.md for deployment instructions

export const SYNC_SCHEDULE = '0 */6 * * *'; // Every 6 hours
export const SYNC_TIMEOUT = 600000; // 10 minutes
export const MAX_CONCURRENT_SCRAPERS = 3; // Limit concurrent mall scraping