'use client';

import { Mall, Region } from '@/types';
import { useState } from 'react';

interface MallCardProps {
  mall: Mall;
  region?: Region;
  onVisit?: (mallId: string) => void;
}

export default function MallCard({ mall, region, onVisit }: MallCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleVisit = async () => {
    setIsLoading(true);
    
    if (onVisit) {
      await onVisit(mall.id);
    }
    
    // Track click
    try {
      await fetch('/api/track-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mallId: mall.id }),
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }
    
    // Open mall URL
    window.open(mall.url, '_blank', 'noopener,noreferrer');
    setIsLoading(false);
  };

  const formatClickCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden group">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3 flex-1">
            {mall.logo && (
              <div className="w-12 h-12 flex-shrink-0">
                <img 
                  src={mall.logo} 
                  alt={`${mall.name} 로고`}
                  className="w-full h-full object-contain rounded-md bg-gray-50 p-1"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800 group-hover:text-primary transition-colors duration-200">
                {mall.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {region?.name_ko || mall.region}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 items-end">
            {mall.isNew && (
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                새로운
              </span>
            )}
            {mall.featured && (
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                인기
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {mall.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md"
            >
              #{tag}
            </span>
          ))}
          {mall.tags.length > 3 && (
            <span className="text-gray-500 text-xs px-2 py-1">
              +{mall.tags.length - 3}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12l-3-3h6l-3 3z"/>
              </svg>
              {formatClickCount(mall.clickCount)} 방문
            </span>
          </div>

          <button
            onClick={handleVisit}
            disabled={isLoading}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                방문하기
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility component for mall grid layout
export function MallGrid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  );
}