import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { getMallById } from '@/lib/data';
import productsData from '@/data/products.json';

export async function generateStaticParams() {
  const products = productsData as any[];
  return products.map((product) => ({
    productId: product.id,
  }));
}

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const products = productsData as any[];
  const rawProduct = products.find(p => p.id === params.productId);

  if (!rawProduct) {
    notFound();
  }

  // Normalize product structure for different data formats
  const product = {
    id: rawProduct.id,
    name: rawProduct.name || '',
    price: typeof rawProduct.price === 'string' ? 0 : (rawProduct.price || 0),
    originalPrice: rawProduct.originalPrice,
    image: rawProduct.image || rawProduct.imageUrl || '',
    category: rawProduct.category || '',
    region: rawProduct.region || '',
    url: rawProduct.url || rawProduct.productUrl || '',
    description: rawProduct.description || '',
    tags: rawProduct.tags || [],
    isFeatured: rawProduct.isFeatured || false,
    isNew: rawProduct.isNew || false,
  };

  // Handle both mall structure formats for backward compatibility
  const mallId = rawProduct.mall?.mallId || rawProduct.mallId;
  const mallName = rawProduct.mall?.mallName || rawProduct.mallName;
  const mallUrl = rawProduct.mall?.mallUrl || rawProduct.mallUrl;
  
  if (!mallId) {
    notFound();
  }
  
  const mall = getMallById(mallId);

  const categoryNames: Record<string, string> = {
    agricultural: '농산물',
    seafood: '수산물',
    livestock: '축산물',
    processed: '가공식품',
    health: '건강식품',
    traditional: '전통식품',
    specialty: '지역특산품',
    eco_friendly: '친환경인증',
    crafts: '공예품',
    other: '기타'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link href="/" className="text-gray-500 hover:text-gray-700">홈</Link></li>
            <li className="text-gray-400">/</li>
            <li><Link href="/products" className="text-gray-500 hover:text-gray-700">전체 상품</Link></li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                </div>
              )}
              {/* Removed inStock check as it's not in current data structure */}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {product.category}
                </span>
              </div>

              {product.description && (
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-4">
                  {product.originalPrice && product.originalPrice !== product.price && (
                    <span className="text-2xl text-gray-400 line-through">
                      {product.originalPrice?.toLocaleString()}원
                    </span>
                  )}
                  <span className="text-3xl font-bold text-gray-900">
                    {product.price === 0 ? '가격문의' : `${product.price.toLocaleString()}원`}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">판매처 정보</h3>
                  <div className="text-sm text-gray-600">
                    <p className="mb-1">쇼핑몰: <span className="font-medium text-gray-900">{mallName}</span></p>
                    <p>지역: <span className="font-medium text-gray-900">{product.region}</span></p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <svg className="inline-block w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    이 상품은 {mallName}에서 직접 판매합니다. 구매하기 버튼을 클릭하면 해당 쇼핑몰로 이동합니다.
                  </p>
                </div>

                <Link
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg text-center transition-colors"
                >
                  {mallName}에서 구매하기
                </Link>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">관련 태그</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">쇼핑몰 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{mallName}</h3>
              <p className="text-sm text-gray-600 mb-1">지역: {product.region}</p>
              <p className="text-sm text-gray-600 mb-1">카테고리: {product.category}</p>
              {product.isFeatured && (
                <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  추천 상품
                </span>
              )}
              {product.isNew && (
                <span className="inline-block mt-2 ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  신상품
                </span>
              )}
            </div>
            <div className="text-right">
              <Link
                href={mallUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-600 hover:text-blue-800 font-medium"
              >
                쇼핑몰 홈페이지 방문 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}