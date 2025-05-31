import { Product, ProductSyncStatus } from '@/types';
import { createScraper } from './scrapers/scraper-registry';
import fs from 'fs/promises';
import path from 'path';

const PRODUCTS_FILE = path.join(process.cwd(), 'src/data/products.json');
const SYNC_STATUS_FILE = path.join(process.cwd(), 'src/data/sync-status.json');

export class ProductSyncService {
  private products: Map<string, Product> = new Map();
  private syncStatus: Map<string, ProductSyncStatus> = new Map();

  async loadData() {
    try {
      // Load existing products
      const productsData = await fs.readFile(PRODUCTS_FILE, 'utf-8');
      const productsArray: Product[] = JSON.parse(productsData);
      productsArray.forEach(product => {
        this.products.set(product.id, product);
      });
    } catch (error) {
      console.log('No existing products file found, starting fresh');
    }

    try {
      // Load sync status
      const statusData = await fs.readFile(SYNC_STATUS_FILE, 'utf-8');
      const statusArray: ProductSyncStatus[] = JSON.parse(statusData);
      statusArray.forEach(status => {
        this.syncStatus.set(status.mallId, status);
      });
    } catch (error) {
      console.log('No existing sync status file found, starting fresh');
    }
  }

  async saveData() {
    // Save products
    const productsArray = Array.from(this.products.values());
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(productsArray, null, 2));

    // Save sync status
    const statusArray = Array.from(this.syncStatus.values());
    await fs.writeFile(SYNC_STATUS_FILE, JSON.stringify(statusArray, null, 2));
  }

  async syncMall(mallId: string, mallName: string): Promise<ProductSyncStatus> {
    const scraper = createScraper(mallId);
    
    if (!scraper) {
      const status: ProductSyncStatus = {
        mallId,
        mallName,
        lastSyncTime: new Date().toISOString(),
        productCount: 0,
        status: 'failed',
        errorMessage: 'No scraper configuration available'
      };
      this.syncStatus.set(mallId, status);
      return status;
    }

    try {
      console.log(`Syncing products from ${mallName}...`);
      const newProducts = await scraper.scrapeProducts();
      
      // Remove old products from this mall
      for (const [id, product] of this.products.entries()) {
        if (product.mallId === mallId) {
          this.products.delete(id);
        }
      }

      // Add new products
      newProducts.forEach(product => {
        this.products.set(product.id, product);
      });

      const status: ProductSyncStatus = {
        mallId,
        mallName,
        lastSyncTime: new Date().toISOString(),
        productCount: newProducts.length,
        status: 'success'
      };
      
      this.syncStatus.set(mallId, status);
      console.log(`Successfully synced ${newProducts.length} products from ${mallName}`);
      return status;
    } catch (error) {
      const status: ProductSyncStatus = {
        mallId,
        mallName,
        lastSyncTime: new Date().toISOString(),
        productCount: 0,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      this.syncStatus.set(mallId, status);
      console.error(`Failed to sync ${mallName}:`, error);
      return status;
    }
  }

  async syncAllMalls(malls: Array<{id: string, name: string}>) {
    await this.loadData();

    for (const mall of malls) {
      await this.syncMall(mall.id, mall.name);
      // Add delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await this.saveData();
  }

  getProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getProductsByCategory(category: string): Product[] {
    return Array.from(this.products.values())
      .filter(product => product.category === category);
  }

  getProductsByMall(mallId: string): Product[] {
    return Array.from(this.products.values())
      .filter(product => product.mallId === mallId);
  }

  searchProducts(query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.products.values())
      .filter(product => 
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description?.toLowerCase().includes(lowerQuery) ||
        product.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
  }
}