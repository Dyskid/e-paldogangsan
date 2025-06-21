'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { Product } from '@/types';
import { getAllCategories, getCategoryInfo } from '@/lib/product-classifier';

interface ProductSearchBarProps {
  products?: Product[];
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  onSearch?: (query: string, results: Product[], selectedCategory?: string) => void;
}

const fuseOptions = {
  keys: ['name', 'description', 'tags', 'mall.mallName', 'category'],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

export default function ProductSearchBar({ 
  products = [], 
  placeholder = "상품 검색...", 
  className = "",
  showSuggestions = true,
  onSearch 
}: ProductSearchBarProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = getAllCategories();
  const fuse = products.length > 0 ? new Fuse(products, fuseOptions) : null;

  useEffect(() => {
    if (query.trim().length >= 2 && fuse) {
      let filteredProducts = products;
      
      // Filter by category first if selected
      if (selectedCategory) {
        filteredProducts = products.filter(p => p.category === selectedCategory);
      }
      
      // Then apply text search
      const fuseFiltered = new Fuse(filteredProducts, fuseOptions);
      const results = fuseFiltered.search(query).map(result => result.item);
      setSuggestions(results.slice(0, 5));
      setShowDropdown(showSuggestions && results.length > 0);
    } else if (selectedCategory && !query) {
      // Show category filtered results when no query
      const filtered = products.filter(p => p.category === selectedCategory).slice(0, 5);
      setSuggestions(filtered);
      setShowDropdown(showSuggestions && filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
    setSelectedIndex(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedCategory, products, showSuggestions]);

  const handleSearch = (searchQuery: string = query) => {
    let results: Product[] = [];
    
    if (selectedCategory) {
      // Filter by category first
      const categoryFiltered = products.filter(p => p.category === selectedCategory);
      if (searchQuery.trim()) {
        const fuseFiltered = new Fuse(categoryFiltered, fuseOptions);
        results = fuseFiltered.search(searchQuery).map(result => result.item);
      } else {
        results = categoryFiltered;
      }
    } else if (searchQuery.trim()) {
      // Search all products
      results = fuse ? fuse.search(searchQuery).map(result => result.item) : [];
    }
    
    if (onSearch) {
      onSearch(searchQuery, results, selectedCategory);
    } else {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      router.push(`/products?${params.toString()}`);
    }
    
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (product: Product) => {
    setQuery(product.name);
    setShowDropdown(false);
    window.open(product.url, '_blank');
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-gray-800">
          {part}
        </mark>
      ) : part
    );
  };

  const getCategoryName = (categoryId: string) => {
    const category = getCategoryInfo(categoryId);
    return category?.name || categoryId;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full max-w-4xl ${className}`}>
      <div className="flex gap-2">
        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        >
          <option value="">모든 카테고리</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name} ({products.filter(p => p.category === category.id).length})
            </option>
          ))}
        </select>

        {/* Search Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => (query.trim().length >= 2 || selectedCategory) && setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full px-4 py-3 pl-12 pr-12 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
          
          <div className="absolute inset-y-0 left-0 flex items-center pl-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button
            onClick={() => handleSearch()}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary hover:text-blue-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </button>
        </div>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {suggestions.map((product, index) => (
            <div
              key={product.id}
              onClick={() => handleSuggestionClick(product)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150 ${
                index === selectedIndex ? 'bg-blue-50 border-primary/20' : ''
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                {product.image && (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">
                    {highlightMatch(product.name, query)}
                  </h4>
                  {product.description && (
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {highlightMatch(product.description, query)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-primary">
                      {product.price === 0 ? '가격문의' : `${product.price.toLocaleString()}원`}
                    </span>
                    {product.originalPrice && product.originalPrice !== product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.originalPrice?.toLocaleString()}원
                      </span>
                    )}
                    <span className="text-xs text-gray-500">• {product.mall?.mallName || '쇼핑몰'}</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-md">
                      {product.category}
                    </span>
                    {product.isNew && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-md">
                        신상품
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-md">
                        추천
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => handleSearch()}
              className="text-sm text-primary hover:text-blue-700 font-medium transition-colors duration-200"
            >
              {selectedCategory ? 
                `"${getCategoryName(selectedCategory)}" 카테고리에서 ${query ? `"${query}" ` : ''}전체 검색 결과 보기 →` :
                `"${query}" 전체 검색 결과 보기 →`
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}