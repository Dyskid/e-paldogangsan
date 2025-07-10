'use client';

import React, { useState } from 'react';
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

  const selectedRegion = selectedRegionId ? regionDataMap.get(selectedRegionId) || null : null;
  const hoveredRegion = hoveredRegionId ? regionDataMap.get(hoveredRegionId) || null : null;

  const filteredMalls = selectedRegionId
    ? malls.filter(mall => mall.region === selectedRegionId)
    : [];

  const getMallCount = (regionId: string) => {
    return malls.filter(mall => mall.region === regionId).length;
  };

  const getRegionColor = (regionId: string) => {
    const mallCount = getMallCount(regionId);
    if (mallCount === 0) return '#f3f4f6';
    if (mallCount <= 5) return '#dbeafe';
    if (mallCount <= 10) return '#93c5fd';
    if (mallCount <= 20) return '#60a5fa';
    return '#3b82f6';
  };

  const handleClick = (regionCode: string) => {
    setSelectedRegionId(regionCode === selectedRegionId ? null : regionCode);
  };

  const handleMouseEnter = (regionCode: string) => {
    setHoveredRegionId(regionCode);
  };

  const handleMouseLeave = () => {
    setHoveredRegionId(null);
  };

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

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 max-h-[600px] overflow-y-auto">
        {selectedRegion ? (
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedRegion.name_ko}</h2>
              <p className="text-gray-600 mt-1">{selectedRegion.description_ko}</p>
              <p className="text-sm text-gray-500 mt-2">
                총 {filteredMalls.length}개 쇼핑몰
              </p>
            </div>
            <div className="space-y-3">
              {filteredMalls.length > 0 ? (
                filteredMalls.map(mall => (
                  <MallCard key={mall.id} mall={mall} />
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
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