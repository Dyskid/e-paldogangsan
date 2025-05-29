'use client';

import { useState } from 'react';
import { Category } from '@/types';

interface QuickFiltersProps {
  categories: Category[];
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
  className?: string;
}

export default function QuickFilters({ 
  categories, 
  selectedFilters, 
  onFilterChange, 
  className = "" 
}: QuickFiltersProps) {
  const toggleFilter = (categoryId: string) => {
    const newFilters = selectedFilters.includes(categoryId)
      ? selectedFilters.filter(f => f !== categoryId)
      : [...selectedFilters, categoryId];
    
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange([]);
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">카테고리</h3>
        {selectedFilters.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors duration-200 underline"
          >
            전체 해제
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 md:gap-3">
        {categories.map((category) => {
          const isSelected = selectedFilters.includes(category.id);
          
          return (
            <button
              key={category.id}
              onClick={() => toggleFilter(category.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 
                border-2 min-w-0 flex-shrink-0
                ${isSelected 
                  ? 'border-primary bg-primary text-white shadow-md transform scale-105' 
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
              style={{
                ...(isSelected && {
                  backgroundColor: category.color_theme,
                  borderColor: category.color_theme,
                })
              }}
            >
              <span className="flex items-center gap-2">
                {getCategoryIcon(category.id)}
                {category.name_ko}
              </span>
            </button>
          );
        })}
      </div>

      {selectedFilters.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-medium">선택된 카테고리:</span>{' '}
            {selectedFilters.map(filterId => {
              const category = categories.find(c => c.id === filterId);
              return category?.name_ko;
            }).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to get category icons
function getCategoryIcon(categoryId: string) {
  const iconClass = "w-4 h-4";
  
  switch (categoryId) {
    case 'fruits':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2C6.686 3.5 5 7 5 10c0 4.418 3.582 8 8 8s8-3.582 8-8c0-3-1.686-6.5-5-8-1 1-3.5 1-6 0z"/>
        </svg>
      );
    case 'vegetables':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 8V2H7v6H2l8 8 8-8h-5zM9 4h2v4H9V4z"/>
        </svg>
      );
    case 'seafood':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 18L2 8h3l3 6 2-3 2 3 3-6h3l-8 10z"/>
        </svg>
      );
    case 'processed':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1zm1 2v8h12V6H4z"/>
        </svg>
      );
    case 'grains':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2C8 4 6 6 6 10s2 6 4 8c2-2 4-4 4-8s-2-6-4-8z"/>
        </svg>
      );
    case 'specialty':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z"/>
        </svg>
      );
  }
}