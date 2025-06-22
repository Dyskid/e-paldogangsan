import fs from 'fs/promises';
import path from 'path';

const PRODUCTS_FILE = path.join(__dirname, '..', 'src', 'data', 'products.json');
const OUTPUT_DIR = path.join(__dirname, 'output');

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  region: string;
  url: string;
  description: string;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  mall: {
    mallId: string;
    mallName: string;
    mallUrl: string;
    region: string;
  };
}

interface VerificationResult {
  totalProducts: number;
  yangguProducts: number;
  dataQuality: {
    hasValidTitle: number;
    hasValidPrice: number;
    hasValidImage: number;
    hasValidUrl: number;
    hasValidCategory: number;
    hasValidMall: number;
  };
  categoryBreakdown: Record<string, number>;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  issues: Array<{
    productId: string;
    productName: string;
    issue: string;
  }>;
}

async function ensureOutputDir() {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  }
}

async function loadProducts(): Promise<Product[]> {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('products.json 파일을 읽을 수 없습니다:', error.message);
    throw error;
  }
}

function validateProduct(product: Product): string[] {
  const issues: string[] = [];
  
  if (!product.name || product.name.trim().length === 0) {
    issues.push('제품명이 없음');
  }
  
  if (!product.price || product.price <= 0) {
    issues.push('유효하지 않은 가격');
  }
  
  if (!product.image || !product.image.startsWith('http')) {
    issues.push('유효하지 않은 이미지 URL');
  }
  
  if (!product.url || !product.url.startsWith('http')) {
    issues.push('유효하지 않은 상품 URL');
  }
  
  if (!product.category || product.category.trim().length === 0) {
    issues.push('카테고리가 없음');
  }
  
  const mallId = product.mall?.mallId || (product as any).mallId;
  const mallName = product.mall?.mallName || (product as any).mallName;
  if (!mallId || !mallName) {
    issues.push('쇼핑몰 정보가 불완전함');
  }
  
  return issues;
}

async function main() {
  try {
    await ensureOutputDir();
    
    console.log('🔍 양구몰 상품 등록 검증 시작...');
    
    // Load all products
    const allProducts = await loadProducts();
    console.log(`📦 총 상품 수: ${allProducts.length}개`);
    
    // Filter Yanggu products - handle both mall structures
    const yangguProducts = allProducts.filter(p => {
      const mallId = p.mall?.mallId || (p as any).mallId;
      return mallId === 'yanggu';
    });
    console.log(`🏪 양구몰 상품 수: ${yangguProducts.length}개`);
    
    // Initialize verification result
    const result: VerificationResult = {
      totalProducts: allProducts.length,
      yangguProducts: yangguProducts.length,
      dataQuality: {
        hasValidTitle: 0,
        hasValidPrice: 0,
        hasValidImage: 0,
        hasValidUrl: 0,
        hasValidCategory: 0,
        hasValidMall: 0
      },
      categoryBreakdown: {},
      priceRange: {
        min: Infinity,
        max: 0,
        average: 0
      },
      issues: []
    };
    
    console.log('\\n🔍 데이터 품질 검증 중...');
    
    let totalPrice = 0;
    
    for (const product of yangguProducts) {
      // Validate each field
      if (product.name && product.name.trim().length > 0) {
        result.dataQuality.hasValidTitle++;
      }
      
      if (product.price && product.price > 0) {
        result.dataQuality.hasValidPrice++;
        totalPrice += product.price;
        result.priceRange.min = Math.min(result.priceRange.min, product.price);
        result.priceRange.max = Math.max(result.priceRange.max, product.price);
      }
      
      if (product.image && product.image.startsWith('http')) {
        result.dataQuality.hasValidImage++;
      }
      
      if (product.url && product.url.startsWith('http')) {
        result.dataQuality.hasValidUrl++;
      }
      
      if (product.category && product.category.trim().length > 0) {
        result.dataQuality.hasValidCategory++;
        // Count by category
        result.categoryBreakdown[product.category] = (result.categoryBreakdown[product.category] || 0) + 1;
      }
      
      const mallId = product.mall?.mallId || (product as any).mallId;
      const mallName = product.mall?.mallName || (product as any).mallName;
      if (mallId && mallName) {
        result.dataQuality.hasValidMall++;
      }
      
      // Check for issues
      const issues = validateProduct(product);
      if (issues.length > 0) {
        result.issues.push({
          productId: product.id,
          productName: product.name || 'Unknown',
          issue: issues.join(', ')
        });
      }
    }
    
    // Calculate average price
    if (yangguProducts.length > 0) {
      result.priceRange.average = Math.round(totalPrice / yangguProducts.length);
    }
    
    // Fix min price if no valid prices found
    if (result.priceRange.min === Infinity) {
      result.priceRange.min = 0;
    }
    
    // Save verification result
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'yanggu-verification-report.json'),
      JSON.stringify(result, null, 2)
    );
    
    // Display results
    console.log('\\n📊 검증 결과:');
    console.log(`\\n✅ 데이터 품질:`);
    console.log(`  유효한 제품명: ${result.dataQuality.hasValidTitle}/${yangguProducts.length} (${Math.round(result.dataQuality.hasValidTitle / yangguProducts.length * 100)}%)`);
    console.log(`  유효한 가격: ${result.dataQuality.hasValidPrice}/${yangguProducts.length} (${Math.round(result.dataQuality.hasValidPrice / yangguProducts.length * 100)}%)`);
    console.log(`  유효한 이미지: ${result.dataQuality.hasValidImage}/${yangguProducts.length} (${Math.round(result.dataQuality.hasValidImage / yangguProducts.length * 100)}%)`);
    console.log(`  유효한 URL: ${result.dataQuality.hasValidUrl}/${yangguProducts.length} (${Math.round(result.dataQuality.hasValidUrl / yangguProducts.length * 100)}%)`);
    console.log(`  유효한 카테고리: ${result.dataQuality.hasValidCategory}/${yangguProducts.length} (${Math.round(result.dataQuality.hasValidCategory / yangguProducts.length * 100)}%)`);
    console.log(`  유효한 쇼핑몰 정보: ${result.dataQuality.hasValidMall}/${yangguProducts.length} (${Math.round(result.dataQuality.hasValidMall / yangguProducts.length * 100)}%)`);
    
    console.log(`\\n💰 가격 범위:`);
    console.log(`  최저가: ${result.priceRange.min.toLocaleString()}원`);
    console.log(`  최고가: ${result.priceRange.max.toLocaleString()}원`);
    console.log(`  평균가: ${result.priceRange.average.toLocaleString()}원`);
    
    console.log(`\\n📋 카테고리별 상품 수:`);
    Object.entries(result.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count}개`);
      });
    
    if (result.issues.length > 0) {
      console.log(`\\n⚠️ 발견된 문제 (${result.issues.length}개):`);
      result.issues.slice(0, 5).forEach(issue => {
        console.log(`  - ${issue.productName}: ${issue.issue}`);
      });
      if (result.issues.length > 5) {
        console.log(`  ... 외 ${result.issues.length - 5}개 더`);
      }
    } else {
      console.log(`\\n✅ 데이터 품질 문제 없음!`);
    }
    
    // Overall score
    const totalChecks = Object.values(result.dataQuality).reduce((sum, count) => sum + count, 0);
    const maxPossibleScore = yangguProducts.length * 6; // 6 checks per product
    const qualityScore = Math.round((totalChecks / maxPossibleScore) * 100);
    
    console.log(`\\n🎯 전체 데이터 품질 점수: ${qualityScore}%`);
    
    if (qualityScore >= 95) {
      console.log('🌟 우수한 데이터 품질입니다!');
    } else if (qualityScore >= 90) {
      console.log('✅ 양호한 데이터 품질입니다.');
    } else if (qualityScore >= 80) {
      console.log('⚠️ 개선이 필요한 데이터 품질입니다.');
    } else {
      console.log('❌ 데이터 품질에 문제가 있습니다.');
    }
    
    console.log('\\n✅ 검증 완료! yanggu-verification-report.json 파일을 확인하세요.');
    
    return result;
    
  } catch (error) {
    console.error('❌ 검증 실패:', error);
    throw error;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default main;