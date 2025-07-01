// TypeScript interfaces for Naver SmartStore data structures

export interface SmartStoreProduct {
  id: string;
  name: string;
  salePrice: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl: string;
  detailImageUrls?: string[];
  benefitBadge?: {
    type: string;
    text: string;
  };
  reviewCount: number;
  reviewScore: number;
  purchaseCount?: number;
  recentPurchaseCount?: number;
  category: {
    id: string;
    name: string;
  };
  tags?: string[];
  seller: {
    id: string;
    name: string;
  };
  shippingFee?: {
    baseFee: number;
    freeCondition?: number;
  };
  stock?: {
    stockQuantity: number;
    stockStatus: 'AVAILABLE' | 'LOW_STOCK' | 'SOLD_OUT';
  };
}

export interface SmartStoreCategory {
  categoryId: string;
  categoryName: string;
  displayOrder: number;
  productCount: number;
  subCategories?: SmartStoreCategory[];
}

export interface SmartStoreInfo {
  storeId: string;
  storeName: string;
  storeUrl: string;
  description?: string;
  businessInfo?: {
    companyName: string;
    representativeName: string;
    businessNumber: string;
    address: string;
  };
}

export interface ProductListResponse {
  products: SmartStoreProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// Example implementation class
export class SmartStoreClient {
  private storeId: string;
  private baseUrl: string = 'https://smartstore.naver.com';

  constructor(storeId: string) {
    this.storeId = storeId;
  }

  /**
   * Fetch products from a category
   * Note: This is a mock implementation. Real implementation would need:
   * - Proper authentication if using Commerce API
   * - Rate limiting and error handling
   * - Proxy server to avoid CORS and rate limits
   */
  async getProducts(
    categoryId: string = 'ALL',
    options: {
      sortType?: 'POPULAR' | 'RECENT' | 'PRICE_ASC' | 'PRICE_DESC';
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ProductListResponse> {
    const { sortType = 'POPULAR', page = 1, pageSize = 40 } = options;

    // In real implementation, this would be an API call
    // For now, returning mock structure
    return {
      products: [],
      totalCount: 0,
      page,
      pageSize,
      hasNext: false
    };
  }

  /**
   * Get all categories for the store
   */
  async getCategories(): Promise<SmartStoreCategory[]> {
    // Mock implementation
    return [
      {
        categoryId: 'ALL',
        categoryName: '전체상품',
        displayOrder: 0,
        productCount: 150
      },
      {
        categoryId: '50000003',
        categoryName: '농산물',
        displayOrder: 1,
        productCount: 50,
        subCategories: [
          {
            categoryId: '50000003001',
            categoryName: '과일',
            displayOrder: 1,
            productCount: 20
          },
          {
            categoryId: '50000003002',
            categoryName: '채소',
            displayOrder: 2,
            productCount: 30
          }
        ]
      }
    ];
  }

  /**
   * Search products by keyword
   */
  async searchProducts(
    keyword: string,
    options: {
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ProductListResponse> {
    // Would implement search logic here
    return {
      products: [],
      totalCount: 0,
      page: options.page || 1,
      pageSize: options.pageSize || 40,
      hasNext: false
    };
  }
}

// Example usage with local data fallback
export class LocalSmartStoreAdapter {
  private localData: Map<string, SmartStoreProduct> = new Map();

  constructor(private client: SmartStoreClient) {}

  /**
   * Load products with local caching
   */
  async loadProducts(categoryId: string = 'ALL'): Promise<SmartStoreProduct[]> {
    try {
      // Try to fetch from API
      const response = await this.client.getProducts(categoryId);
      
      // Cache locally
      response.products.forEach(product => {
        this.localData.set(product.id, product);
      });

      return response.products;
    } catch (error) {
      console.error('Failed to fetch from API, using local data:', error);
      
      // Return cached data
      return Array.from(this.localData.values());
    }
  }

  /**
   * Get product by ID from cache
   */
  getProduct(productId: string): SmartStoreProduct | undefined {
    return this.localData.get(productId);
  }

  /**
   * Import products from JSON file (for manual updates)
   */
  importFromJSON(products: SmartStoreProduct[]): void {
    products.forEach(product => {
      this.localData.set(product.id, product);
    });
  }

  /**
   * Export current data to JSON
   */
  exportToJSON(): SmartStoreProduct[] {
    return Array.from(this.localData.values());
  }
}

// Helper function to format price in Korean Won
export function formatKRW(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(price);
}

// Helper to calculate shipping fee
export function calculateShippingFee(
  orderTotal: number,
  shippingInfo?: { baseFee: number; freeCondition?: number }
): number {
  if (!shippingInfo) return 0;
  
  const { baseFee, freeCondition } = shippingInfo;
  
  if (freeCondition && orderTotal >= freeCondition) {
    return 0;
  }
  
  return baseFee;
}