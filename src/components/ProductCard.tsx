'use client';

import { Product } from '@/types';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Debug logging for gmsocial products
  if (product.id && product.id.startsWith('gmsocial_')) {
    console.log('🔍 GMSocial Product Debug:', {
      id: product.id,
      name: product.name,
      nameType: typeof product.name,
      nameLength: product.name?.length,
      price: product.price,
      priceType: typeof product.price
    });
  }
  const handleClick = async () => {
    try {
      const mallId = product.mall?.mallId || (product as any).mallId;
      if (mallId) {
        await fetch('/api/track-click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mallId }),
        });
      }
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  };

  const categoryColors: Record<string, string> = {
    agricultural: 'bg-green-100 text-green-800',
    seafood: 'bg-blue-100 text-blue-800',
    livestock: 'bg-amber-100 text-amber-800',
    processed: 'bg-orange-100 text-orange-800',
    health: 'bg-green-100 text-green-800',
    traditional: 'bg-purple-100 text-purple-800',
    specialty: 'bg-pink-100 text-pink-800',
    eco_friendly: 'bg-emerald-100 text-emerald-800',
    crafts: 'bg-gray-100 text-gray-800',
    other: 'bg-gray-100 text-gray-600'
  };

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
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <a 
        href={product.url || (product as any).productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        onClick={handleClick}
      >
        <div className="relative h-48 bg-gray-100">
          {(product.image || (product as any).imageUrl) ? (
            <Image
              src={product.image || (product as any).imageUrl}
              alt={product.name}
              fill
              className="object-cover rounded-t-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
          )}
          {/* Removed inStock check as it's not in current data structure */}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-medium line-clamp-2 flex-1">{product.name || '상품명 없음'}</h3>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
              {product.category}
            </span>
            <span className="text-xs text-gray-500">{product.mall?.mallName || (product as any).mallName || '쇼핑몰'}</span>
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          <div className="flex items-end justify-between">
            <div>
              {product.originalPrice && product.originalPrice !== product.price && (
                <span className="text-sm text-gray-400 line-through mr-2">
                  {product.originalPrice?.toLocaleString()}원
                </span>
              )}
              <span className="text-lg font-bold text-gray-900">
                {(() => {
                  const price = product.price || (product as any).price;
                  if (typeof price === 'string') {
                    return price;
                  }
                  return price === 0 ? '가격문의' : `${price.toLocaleString()}원`;
                })()}
              </span>
            </div>
            <span className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              상세보기
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}