'use client';

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Region, Mall } from '@/types';
import MallCard from './MallCard';
import AllMallsDisplay from './AllMallsDisplay';

const KoreaMap = dynamic(
  () => import('./KoreaMapWrapper'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg" />
  }
);

interface InteractiveMapProps {
  regions: Region[];
  malls: Mall[];
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ regions, malls }) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);

  const regionDataMap = new Map(regions.map(r => [r.id, r]));

  // Create a mapping from English IDs to Korean names used in mall data
  const regionIdToKoreanMap: { [key: string]: string } = {
    'seoul': '서울',
    'busan': '부산',
    'daegu': '대구',
    'incheon': '인천',
    'gwangju': '광주',
    'daejeon': '대전',
    'ulsan': '울산',
    'sejong': '세종',
    'gyeonggi': '경기',
    'gangwon': '강원',
    'chungbuk': '충북',
    'chungnam': '충남',
    'jeonbuk': '전북',
    'jeonnam': '전남',
    'gyeongbuk': '경북',
    'gyeongnam': '경남',
    'jeju': '제주'
  };

  const selectedRegion = selectedRegionId ? regionDataMap.get(selectedRegionId) || null : null;
  const hoveredRegion = hoveredRegionId ? regionDataMap.get(hoveredRegionId) || null : null;

  const filteredMalls = useMemo(() => {
    if (!selectedRegionId) return [];
    return malls.filter(mall => mall.region === regionIdToKoreanMap[selectedRegionId]);
  }, [selectedRegionId, malls]);

  const getMallCount = useCallback((regionId: string) => {
    const koreanRegionName = regionIdToKoreanMap[regionId];
    return malls.filter(mall => mall.region === koreanRegionName).length;
  }, [malls]);

  const getRegionColor = (regionId: string) => {
    const mallCount = getMallCount(regionId);
    if (mallCount === 0) return '#f3f4f6';
    if (mallCount <= 5) return '#dbeafe';
    if (mallCount <= 10) return '#93c5fd';
    if (mallCount <= 20) return '#60a5fa';
    return '#3b82f6';
  };

  const handleClick = useCallback((regionCode: string) => {
    setSelectedRegionId(prev => prev === regionCode ? null : regionCode);
  }, []);

  const handleMouseEnter = useCallback((regionCode: string) => {
    setHoveredRegionId(regionCode);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredRegionId(null);
  }, []);

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="relative">
          <KoreaMap
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            fillColor={(regionCode: string) => getRegionColor(regionCode)}
            strokeColor="#9ca3af"
            strokeWidth={1}
            hoverColor="#fbbf24"
            selectedColor="#f59e0b"
            selectedRegion={selectedRegionId}
            getMallCount={getMallCount}
          />
          
          {hoveredRegion && (
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur rounded-md shadow-lg p-3 pointer-events-none z-10 max-w-xs">
              <div className="font-semibold text-gray-900">{hoveredRegion.name_ko}</div>
              <div className="text-sm text-gray-600">쇼핑몰: {getMallCount(hoveredRegion.id)}개</div>
              {hoveredRegion.highlight_text && (
                <div className="text-xs text-gray-500 mt-1">{hoveredRegion.highlight_text}</div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">지역별 색상 안내</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f3f4f6' }}></div>
              <span className="text-sm text-gray-600">0개 쇼핑몰</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dbeafe' }}></div>
              <span className="text-sm text-gray-600">1-5개 쇼핑몰</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#93c5fd' }}></div>
              <span className="text-sm text-gray-600">6-10개 쇼핑몰</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#60a5fa' }}></div>
              <span className="text-sm text-gray-600">11-20개 쇼핑몰</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className="text-sm text-gray-600">20개 이상</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 h-full overflow-auto max-h-[600px]">
        {selectedRegion ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedRegion.name_ko}</h2>
              <p className="text-gray-600">{selectedRegion.description_ko}</p>
              <p className="text-sm text-gray-500 mt-2">
                총 {filteredMalls.length}개 쇼핑몰
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMalls.length > 0 ? (
                filteredMalls.map(mall => (
                  <MallCard key={mall.id} mall={mall} />
                ))
              ) : (
                <p className="text-gray-500 text-center py-8 col-span-full">
                  이 지역에는 등록된 쇼핑몰이 없습니다.
                </p>
              )}
            </div>
          </div>
        ) : (
          <AllMallsDisplay malls={malls} regions={regions} />
        )}
      </div>
    </div>
  );
};

export default InteractiveMap;