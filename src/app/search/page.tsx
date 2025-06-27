'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Fuse from 'fuse.js';
import SearchBar from '@/components/SearchBar';
import QuickFilters from '@/components/QuickFilters';
import { MallGrid } from '@/components/MallCard';
import MallCard from '@/components/MallCard';
import { getMalls, getRegions, getCategories } from '@/lib/data';
import { Mall } from '@/types';

const ITEMS_PER_PAGE = 12;

const fuseOptions = {
  keys: ['name', 'tags', 'region'],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 1,
};

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'alphabetical' | 'popularity'>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState<Mall[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const malls = getMalls();
  const regions = getRegions();
  const categories = getCategories();
  const fuse = new Fuse(malls, fuseOptions);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    performSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const performSearch = (searchQuery: string = query) => {
    setIsLoading(true);
    
    let searchResults: Mall[] = [];
    
    if (searchQuery.trim()) {
      searchResults = fuse.search(searchQuery).map(result => result.item);
    } else {
      searchResults = [...malls];
    }

    // Apply category filters
    if (selectedFilters.length > 0) {
      const selectedCategoryNames = selectedFilters.map(filterId => {
        const category = categories.find(c => c.id === filterId);
        return category?.name_ko;
      }).filter(Boolean);

      searchResults = searchResults.filter(mall =>
        mall.tags.some(tag => selectedCategoryNames.includes(tag))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'alphabetical':
        searchResults.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        break;
      case 'date':
        searchResults.sort((a, b) => 
          new Date(b.lastVerified).getTime() - new Date(a.lastVerified).getTime()
        );
        break;
      case 'popularity':
        searchResults.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.name.localeCompare(b.name, 'ko');
        });
        break;
      default: // relevance
        // Already sorted by Fuse.js relevance if there's a query
        if (!searchQuery.trim()) {
          // If no query, sort by featured first, then alphabetically
          searchResults.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return a.name.localeCompare(b.name, 'ko');
          });
        }
        break;
    }

    setResults(searchResults);
    setCurrentPage(1);
    setIsLoading(false);
  };

  useEffect(() => {
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters, sortBy]);

  const handleSearch = (searchQuery: string, searchResults: Mall[]) => {
    setQuery(searchQuery);
    setResults(searchResults);
    setCurrentPage(1);
  };

  const getRegionForMall = (mall: Mall) => {
    return regions.find(region => region.id === mall.region);
  };

  // Pagination
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedResults = results.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              쇼핑몰 검색
            </h1>
            <SearchBar
              malls={malls}
              placeholder="쇼핑몰이나 상품을 검색해보세요..."
              showSuggestions={true}
              onSearch={handleSearch}
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <QuickFilters
                categories={categories}
                selectedFilters={selectedFilters}
                onFilterChange={setSelectedFilters}
              />
              
              <hr className="my-6" />
              
              {/* Sort Options */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">정렬</h3>
                <div className="space-y-2">
                  {[
                    { value: 'relevance', label: '관련도순' },
                    { value: 'popularity', label: '인기순' },
                    { value: 'date', label: '최신순' },
                    { value: 'alphabetical', label: '가나다순' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="sortBy"
                        value={option.value}
                        checked={sortBy === option.value}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="mr-3 text-primary focus:ring-primary"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Summary */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {query ? `"${query}" 검색 결과` : '전체 쇼핑몰'}
                </h2>
                <p className="text-gray-600">
                  총 {results.length.toLocaleString()}개의 쇼핑몰
                </p>
              </div>
              
              {selectedFilters.length > 0 && (
                <div className="text-sm text-gray-500">
                  필터 적용됨: {selectedFilters.length}개
                </div>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Results */}
            {!isLoading && (
              <>
                {paginatedResults.length > 0 ? (
                  <MallGrid className="mb-8">
                    {paginatedResults.map((mall) => (
                      <MallCard
                        key={mall.id}
                        mall={mall}
                        region={getRegionForMall(mall)}
                      />
                    ))}
                  </MallGrid>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      검색 결과가 없습니다
                    </h3>
                    <p className="text-gray-500 mb-4">
                      다른 검색어를 시도해보거나 필터를 조정해보세요
                    </p>
                    <div className="space-x-4">
                      <button
                        onClick={() => {
                          setQuery('');
                          setSelectedFilters([]);
                          performSearch('');
                        }}
                        className="text-primary hover:text-blue-700 font-medium transition-colors duration-200"
                      >
                        전체 쇼핑몰 보기
                      </button>
                      <button
                        onClick={() => setSelectedFilters([])}
                        className="text-gray-500 hover:text-gray-700 font-medium transition-colors duration-200"
                      >
                        필터 초기화
                      </button>
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                            currentPage === page
                              ? 'bg-primary text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="px-4 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}