'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { Mall } from '@/types';

interface SearchBarProps {
  malls: Mall[];
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  onSearch?: (query: string, results: Mall[]) => void;
}

const fuseOptions = {
  keys: ['name', 'tags', 'region'],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

export default function SearchBar({ 
  malls, 
  placeholder = "쇼핑몰 검색...", 
  className = "",
  showSuggestions = true,
  onSearch 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Mall[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fuse = new Fuse(malls, fuseOptions);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const results = fuse.search(query).map(result => result.item);
      setSuggestions(results.slice(0, 5));
      setShowDropdown(showSuggestions && results.length > 0);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
    setSelectedIndex(-1);
  }, [query, malls, showSuggestions]);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      const results = fuse.search(searchQuery).map(result => result.item);
      
      if (onSearch) {
        onSearch(searchQuery, results);
      } else {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
      
      setShowDropdown(false);
      inputRef.current?.blur();
    }
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

  const handleSuggestionClick = (mall: Mall) => {
    setQuery(mall.name);
    setShowDropdown(false);
    handleSearch(mall.name);
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
    <div className={`relative w-full max-w-2xl ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && setShowDropdown(true)}
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

      {showDropdown && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.map((mall, index) => (
            <div
              key={mall.id}
              onClick={() => handleSuggestionClick(mall)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150 ${
                index === selectedIndex ? 'bg-blue-50 border-primary/20' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">
                    {highlightMatch(mall.name, query)}
                  </h4>
                  <p className="text-sm text-gray-600">{mall.region}</p>
                  <div className="flex gap-1 mt-1">
                    {mall.tags.slice(0, 2).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-3">
                  {mall.isNew && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                      새로운
                    </span>
                  )}
                  {mall.featured && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      인기
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => handleSearch()}
              className="text-sm text-primary hover:text-blue-700 font-medium transition-colors duration-200"
            >
              "{query}" 전체 검색 결과 보기 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}