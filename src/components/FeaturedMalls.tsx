'use client';

import { useState, useEffect, useRef } from 'react';
import { Mall, Region } from '@/types';
import MallCard from './MallCard';

interface FeaturedMallsProps {
  malls: Mall[];
  regions: Region[];
  className?: string;
  autoScroll?: boolean;
  autoScrollInterval?: number;
}

export default function FeaturedMalls({ 
  malls, 
  regions, 
  className = "",
  autoScroll = true,
  autoScrollInterval = 5000 
}: FeaturedMallsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(autoScroll);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const featuredMalls = malls.filter(mall => mall.featured);
  const totalSlides = Math.ceil(featuredMalls.length / 3); // 3 malls per slide on desktop

  useEffect(() => {
    if (isAutoScrolling && totalSlides > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % totalSlides);
      }, autoScrollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoScrolling, totalSlides, autoScrollInterval]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoScrolling(false);
    
    // Resume auto-scroll after 10 seconds of inactivity
    setTimeout(() => {
      setIsAutoScrolling(autoScroll);
    }, 10000);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? totalSlides - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % totalSlides;
    goToSlide(newIndex);
  };

  const getRegionForMall = (mall: Mall) => {
    return regions.find(region => region.id === mall.region);
  };

  if (featuredMalls.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">추천 쇼핑몰이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">추천 쇼핑몰</h2>
          <p className="text-lg text-gray-600">각 지역의 대표 온라인 쇼핑몰을 만나보세요</p>
        </div>
        
        {totalSlides > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              aria-label="이전 슬라이드"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={goToNext}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              aria-label="다음 슬라이드"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div 
        ref={containerRef}
        className="overflow-hidden rounded-lg"
        onMouseEnter={() => setIsAutoScrolling(false)}
        onMouseLeave={() => setIsAutoScrolling(autoScroll)}
      >
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {Array.from({ length: totalSlides }).map((_, slideIndex) => (
            <div 
              key={slideIndex}
              className="w-full flex-shrink-0"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-1">
                {featuredMalls
                  .slice(slideIndex * 3, (slideIndex + 1) * 3)
                  .map((mall) => (
                    <MallCard
                      key={mall.id}
                      mall={mall}
                      region={getRegionForMall(mall)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-primary scale-110' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`슬라이드 ${index + 1}로 이동`}
            />
          ))}
        </div>
      )}

      {/* Mobile: Show scroll indicators */}
      <div className="md:hidden flex justify-between items-center mt-4 text-sm text-gray-500">
        <span>
          {currentIndex + 1} / {totalSlides}
        </span>
        <span>
          총 {featuredMalls.length}개 추천 쇼핑몰
        </span>
      </div>

      {/* Auto-scroll status indicator */}
      {autoScroll && (
        <div className="absolute top-4 right-4 hidden lg:block">
          <div className={`w-2 h-2 rounded-full ${isAutoScrolling ? 'bg-green-400' : 'bg-gray-400'} transition-colors duration-200`} />
        </div>
      )}
    </div>
  );
}