'use client';

import { Product } from '@/types';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const handleClick = async () => {
    try {
      const mallId = product.mallId || product.mall?.mallId;
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
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
      <a 
        href={product.url || product.productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        onClick={handleClick}
      >
        <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {(product.image || product.imageUrl) ? (
            <Image
              src={product.image || product.imageUrl || ''}
              alt={product.name || 'Product image'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300">
              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
          )}
          {product.featured && (
            <div className="absolute top-3 left-3">
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                추천
              </span>
            </div>
          )}
          {product.isNew && (
            <div className="absolute top-3 right-3">
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                NEW
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          {/* Product Name - Multiple Approaches for Maximum Compatibility */}
          <div className="mb-3 min-h-[3.5rem]">
            <h3 
              className="text-lg font-semibold text-gray-900 leading-relaxed group-hover:text-blue-600 transition-colors"
              style={{
                display: 'block',
                visibility: 'visible',
                wordBreak: 'break-word',
                overflow: 'hidden',
                maxHeight: '3.5rem',
                lineHeight: '1.75rem',
                color: '#111827',
                fontSize: '18px',
                fontWeight: '600'
              }}
              title={product.name || '상품명 없음'}
            >
              {product.name || '상품명 없음'}
            </h3>
            
            {/* Failsafe backup display */}
            <noscript>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                {product.name || '상품명 없음'}
              </div>
            </noscript>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium">
              {product.category}
            </span>
            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
              {product.mallName || product.mall?.mallName || '쇼핑몰'}
            </span>
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="flex items-end justify-between pt-2 border-t border-gray-50">
            <div className="flex flex-col">
              {product.originalPrice && product.originalPrice !== product.price && (
                <span className="text-sm text-gray-400 line-through mb-1">
                  {product.originalPrice?.toLocaleString()}원
                </span>
              )}
              <span className="text-xl font-bold text-gray-900">
                {(() => {
                  const price = product.price;
                  if (typeof price === 'string') {
                    return price;
                  }
                  return price === 0 ? '가격문의' : `${price.toLocaleString()}원`;
                })()}
              </span>
            </div>
            <div className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium group-hover:translate-x-1 transition-transform">
              상세보기
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}