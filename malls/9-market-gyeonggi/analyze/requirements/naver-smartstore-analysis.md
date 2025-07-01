# Naver SmartStore Analysis for MarketGyeonggi (경기마켓)

## Summary
Due to aggressive rate limiting (HTTP 429 errors), direct web scraping of Naver SmartStore is challenging. However, based on research and API documentation, here's a comprehensive analysis of how Naver SmartStore works.

## 1. Store Identification

### Store URL Structure
- Desktop: `https://smartstore.naver.com/{store_id}`
- Mobile: `https://m.smartstore.naver.com/{store_id}`
- Alternative found: `https://smartstore.naver.com/dndnsang` (possibly related to 경기마켓)

### Finding Store ID
The store ID (also called channelNo) can typically be found in:
1. Page HTML: Look for `channelNo`, `storeId`, or `sellerId` in JavaScript variables
2. Meta tags: `<meta property="naver:smartstore:channelNo" content="{id}">`
3. API calls: Network requests to `/i/v1/stores/{storeId}`

## 2. Product Category Structure

Naver SmartStore uses a hierarchical category system:

```
Root Categories
├── 전체상품 (ALL) - All products
├── 농산물 - Agricultural products
├── 축산물 - Livestock products  
├── 수산물 - Seafood products
├── 가공식품 - Processed foods
├── 건강식품 - Health foods
└── 기타 - Others
```

Each category has:
- `categoryId`: Unique identifier
- `categoryName`: Display name
- `displayOrder`: Sort order
- `productCount`: Number of products

## 3. Product Loading Mechanism

### API Endpoints

#### Product List API
```
GET /i/v2/stores/{storeId}/categories/{categoryId}/products
Parameters:
- categoryId: Category ID or 'ALL' for all products
- sortType: POPULAR (인기순), RECENT (최신순), PRICE_ASC (낮은가격순), PRICE_DESC (높은가격순)
- page: Page number (1-based)
- pageSize: Items per page (default: 40, max: 80)
```

#### Category List API
```
GET /i/v1/stores/{storeId}/categories
Returns: Hierarchical category structure
```

#### Store Info API
```
GET /i/v1/stores/{storeId}
Returns: Store details, policies, shipping info
```

### Pagination
- Uses page-based pagination
- Default 40 items per page
- Total count provided in response
- Infinite scroll on mobile, traditional pagination on desktop

## 4. Product Data Structure

```json
{
  "id": "5976543210",                    // Product ID
  "name": "경기도 농산물 선물세트",        // Product name
  "salePrice": 35000,                     // Current price
  "originalPrice": 40000,                 // Original price (if discounted)
  "discountRate": 12,                     // Discount percentage
  "imageUrl": "https://...",              // Main product image
  "detailImageUrls": ["..."],             // Additional images
  "benefitBadge": {                       // Special badges
    "type": "FREE_DELIVERY",
    "text": "무료배송"
  },
  "reviewCount": 245,                     // Number of reviews
  "reviewScore": 4.8,                     // Average rating
  "purchaseCount": 1250,                  // Purchase count
  "recentPurchaseCount": 52,              // Recent purchases
  "category": {
    "id": "50000003",
    "name": "농산물"
  },
  "tags": ["유기농", "GAP인증", "경기도"],  // Product tags
  "seller": {
    "id": "marketgyeonggi",
    "name": "경기마켓"
  },
  "shippingFee": {
    "baseFee": 3000,
    "freeCondition": 30000              // Free shipping threshold
  },
  "stock": {
    "stockQuantity": 100,
    "stockStatus": "AVAILABLE"          // AVAILABLE, LOW_STOCK, SOLD_OUT
  }
}
```

## 5. Implementation Recommendations

### Option 1: Official Commerce API (Recommended)
1. Register at https://apicenter.commerce.naver.com
2. Create application and get API credentials
3. Use official SDKs for stable access
4. No rate limiting issues

### Option 2: Server-Side Proxy
1. Set up a proxy server with proper headers
2. Implement request throttling (1 req/sec)
3. Cache responses to minimize requests
4. Rotate user agents

### Option 3: Manual Data Entry
1. Manually collect product information
2. Create local JSON database
3. Periodic manual updates
4. Most reliable for small catalogs

### Option 4: Partnership Approach
1. Contact 경기마켓 directly
2. Request product data feed
3. Establish official data sharing agreement
4. Best for long-term integration

## 6. Technical Considerations

### Rate Limiting
- Aggressive bot detection (429 errors)
- Requires realistic browser behavior
- Cookie handling important
- Consider time-based throttling

### Data Updates
- Products update frequently
- Prices change daily
- Stock levels real-time
- Consider update frequency needs

### Legal Compliance
- Check Naver's Terms of Service
- Respect robots.txt
- Consider data usage rights
- Implement proper attribution

## 7. Alternative Data Sources

1. **Naver Shopping Search API**
   - Less restricted than SmartStore
   - Provides product search functionality
   - Requires API key

2. **Open API Platforms**
   - Government open data portals
   - 경기도 agricultural product APIs
   - Public procurement data

3. **Direct Integration**
   - Contact 경기도농수산진흥원
   - Official data partnership
   - Direct database access

## Conclusion

Due to rate limiting, the most practical approaches are:
1. Use official Commerce API with proper registration
2. Establish direct partnership with 경기마켓
3. Build a manual product database with periodic updates

The aggressive bot protection makes web scraping impractical for production use.