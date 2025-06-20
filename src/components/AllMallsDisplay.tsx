'use client';

import { Mall, Region } from '@/types';
import MallCard from './MallCard';
import { useState } from 'react';

interface AllMallsDisplayProps {
  malls: Mall[];
  regions: Region[];
}

interface GroupedMalls {
  [key: string]: Mall[];
}

export default function AllMallsDisplay({ malls, regions }: AllMallsDisplayProps) {
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set(['충청', '전라', '경상', '강원/제주']));

  // Group malls by region
  const groupMallsByRegion = (): GroupedMalls => {
    const grouped: GroupedMalls = {};
    
    malls.forEach(mall => {
      if (!grouped[mall.region]) {
        grouped[mall.region] = [];
      }
      grouped[mall.region].push(mall);
    });
    
    return grouped;
  };

  const groupedMalls = groupMallsByRegion();

  // Define metropolitan cities
  const metropolitanCities = ['서울', '인천', '세종', '대전', '광주', '대구', '울산', '부산'];
  
  // Define provinces and their sub-regions
  const provinces = {
    '충청': ['충북', '충남'],
    '전라': ['전북', '전남'],
    '경상': ['경북', '경남'],
    '강원/제주': ['강원', '제주']
  };

  const toggleProvince = (province: string) => {
    const newExpanded = new Set(expandedProvinces);
    if (newExpanded.has(province)) {
      newExpanded.delete(province);
    } else {
      newExpanded.add(province);
    }
    setExpandedProvinces(newExpanded);
  };

  const getRegionData = (regionName: string): Region | undefined => {
    return regions.find(r => r.name_ko === regionName);
  };

  const renderMallSection = (regionName: string, regionMalls: Mall[]) => {
    const regionData = getRegionData(regionName);
    
    return (
      <div key={regionName} className="mb-8">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800">{regionName}</h3>
          {regionData && (
            <p className="text-sm text-gray-600 mt-1">{regionData.description_ko}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">쇼핑몰 {regionMalls.length}개</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {regionMalls.map((mall) => (
            <MallCard key={mall.id} mall={mall} region={regionData} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full overflow-auto max-h-[600px]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">전체 쇼핑몰</h2>
        <p className="text-gray-600">전국 지방자치단체 운영 온라인 쇼핑몰 목록</p>
      </div>

      {/* Metropolitan Cities */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-primary mb-4">광역시 · 특별시</h3>
        {metropolitanCities.map(city => {
          if (groupedMalls[city] && groupedMalls[city].length > 0) {
            return renderMallSection(city, groupedMalls[city]);
          }
          return null;
        })}
      </div>

      {/* Provinces */}
      {Object.entries(provinces).map(([provinceName, subRegions]) => (
        <div key={provinceName} className="mb-8">
          <div 
            className="flex items-center justify-between cursor-pointer mb-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => toggleProvince(provinceName)}
          >
            <h3 className="text-lg font-semibold text-primary">
              {provinceName === '강원/제주' ? '강원도 · 제주도' : `${provinceName}도`}
            </h3>
            <svg 
              className={`w-5 h-5 transition-transform ${expandedProvinces.has(provinceName) ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {expandedProvinces.has(provinceName) && (
            <div className="ml-4">
              {subRegions.map(subRegion => {
                if (groupedMalls[subRegion] && groupedMalls[subRegion].length > 0) {
                  return renderMallSection(subRegion, groupedMalls[subRegion]);
                }
                return null;
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}