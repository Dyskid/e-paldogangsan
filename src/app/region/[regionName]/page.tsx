'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import QuickFilters from '@/components/QuickFilters';
import { MallGrid } from '@/components/MallCard';
import MallCard from '@/components/MallCard';
import { getMalls, getRegions, getCategories, getMallsByRegion, getRegionById } from '@/lib/data';
import { Mall } from '@/types';

export default function RegionPage() {
  const params = useParams();
  const regionName = params.regionName as string;
  
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'featured' | 'alphabetical' | 'popularity' | 'newest'>('featured');
  
  const regions = getRegions();
  const categories = getCategories();
  const region = getRegionById(regionName);
  
  if (!region) {
    notFound();
  }

  const allRegionMalls = getMallsByRegion(regionName);
  
  // Filter malls based on selected categories
  const filteredMalls = selectedFilters.length > 0
    ? allRegionMalls.filter(mall => {
        const selectedCategoryNames = selectedFilters.map(filterId => {
          const category = categories.find(c => c.id === filterId);
          return category?.name_ko;
        }).filter(Boolean);
        
        return mall.tags.some(tag => selectedCategoryNames.includes(tag));
      })
    : allRegionMalls;

  // Sort malls
  const sortedMalls = [...filteredMalls].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.name.localeCompare(b.name, 'ko');
      case 'popularity':
        return b.clickCount - a.clickCount;
      case 'newest':
        return new Date(b.lastVerified).getTime() - new Date(a.lastVerified).getTime();
      default: // featured
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.clickCount - a.clickCount;
    }
  });

  const handleSearch = (query: string, results: Mall[]) => {
    // Filter results to only include malls from this region
    const regionResults = results.filter(mall => mall.region === regionName);
    // Handle the filtered search results as needed
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-primary transition-colors duration-200">
              홈
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-800">{region.name_ko}</span>
          </nav>

          {/* Region Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {region.name_ko}
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              {region.description_ko}
            </p>
            <p className="text-primary font-medium">
              {region.highlight_text}
            </p>
            <div className="mt-4 text-sm text-gray-500">
              총 {allRegionMalls.length}개의 쇼핑몰
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar
              malls={allRegionMalls}
              placeholder={`${region.name_ko} 쇼핑몰 검색...`}
              onSearch={handleSearch}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              {/* Back to Map */}
              <div className="mb-6">
                <Link
                  href="/"
                  className="flex items-center text-primary hover:text-blue-700 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  지도로 돌아가기
                </Link>
              </div>

              {/* Category Filters */}
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
                    { value: 'featured', label: '추천순' },
                    { value: 'popularity', label: '인기순' },
                    { value: 'newest', label: '최신순' },
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

              {/* Region Stats */}
              <hr className="my-6" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">지역 정보</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">전체 쇼핑몰</span>
                    <span className="font-medium">{allRegionMalls.length}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">추천 쇼핑몰</span>
                    <span className="font-medium">
                      {allRegionMalls.filter(m => m.featured).length}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">신규 쇼핑몰</span>
                    <span className="font-medium">
                      {allRegionMalls.filter(m => m.isNew).length}개
                    </span>
                  </div>
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
                  {region.name_ko} 쇼핑몰
                </h2>
                <p className="text-gray-600">
                  {selectedFilters.length > 0 
                    ? `필터 적용: ${sortedMalls.length}개 쇼핑몰`
                    : `총 ${sortedMalls.length}개 쇼핑몰`
                  }
                </p>
              </div>
            </div>

            {/* Mall Grid */}
            {sortedMalls.length > 0 ? (
              <MallGrid>
                {sortedMalls.map((mall) => (
                  <MallCard
                    key={mall.id}
                    mall={mall}
                    region={region}
                  />
                ))}
              </MallGrid>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {selectedFilters.length > 0 
                    ? '선택한 카테고리의 쇼핑몰이 없습니다'
                    : '등록된 쇼핑몰이 없습니다'
                  }
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedFilters.length > 0 
                    ? '다른 카테고리를 선택해보거나 필터를 초기화해보세요'
                    : '곧 새로운 쇼핑몰이 추가될 예정입니다'
                  }
                </p>
                {selectedFilters.length > 0 && (
                  <button
                    onClick={() => setSelectedFilters([])}
                    className="text-primary hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            )}

            {/* Mobile: Swipeable hint */}
            <div className="md:hidden mt-8 text-center text-sm text-gray-500">
              💡 카드를 좌우로 스와이프하여 더 많은 정보를 확인하세요
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static paths for all regions
export async function generateStaticParams() {
  const regions = getRegions();
  return regions.map((region) => ({
    regionName: region.id,
  }));
}