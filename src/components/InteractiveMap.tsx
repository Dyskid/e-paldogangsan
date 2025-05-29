'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Region } from '@/types';

interface InteractiveMapProps {
  regions: Region[];
  onRegionClick?: (regionId: string) => void;
}

export default function InteractiveMap({ regions, onRegionClick }: InteractiveMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const handleRegionClick = (regionId: string) => {
    if (onRegionClick) {
      onRegionClick(regionId);
    }
  };

  const getRegionData = (regionId: string) => {
    return regions.find(r => r.id === regionId);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        지역별 쇼핑몰 찾기
      </h2>
      
      <div className="relative">
        <svg
          viewBox="0 0 400 500"
          className="w-full h-auto max-h-96"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Seoul */}
          <Link href="/region/seoul">
            <g 
              onMouseEnter={() => setHoveredRegion('seoul')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick('seoul')}
              className="cursor-pointer"
            >
              <circle
                cx="180"
                cy="160"
                r="15"
                fill={hoveredRegion === 'seoul' ? '#1E40AF' : '#3B82F6'}
                stroke="#fff"
                strokeWidth="2"
                className="transition-all duration-200 hover:scale-110"
              />
              <text x="180" y="145" textAnchor="middle" className="text-xs font-medium fill-gray-700">
                서울
              </text>
              <text x="180" y="140" textAnchor="middle" className="text-xs fill-primary">
                {getRegionData('seoul')?.mall_count}개
              </text>
            </g>
          </Link>

          {/* Busan */}
          <Link href="/region/busan">
            <g 
              onMouseEnter={() => setHoveredRegion('busan')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick('busan')}
              className="cursor-pointer"
            >
              <circle
                cx="280"
                cy="380"
                r="12"
                fill={hoveredRegion === 'busan' ? '#1E40AF' : '#3B82F6'}
                stroke="#fff"
                strokeWidth="2"
                className="transition-all duration-200 hover:scale-110"
              />
              <text x="280" y="365" textAnchor="middle" className="text-xs font-medium fill-gray-700">
                부산
              </text>
              <text x="280" y="360" textAnchor="middle" className="text-xs fill-primary">
                {getRegionData('busan')?.mall_count}개
              </text>
            </g>
          </Link>

          {/* Daegu */}
          <Link href="/region/daegu">
            <g 
              onMouseEnter={() => setHoveredRegion('daegu')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick('daegu')}
              className="cursor-pointer"
            >
              <circle
                cx="250"
                cy="320"
                r="10"
                fill={hoveredRegion === 'daegu' ? '#1E40AF' : '#3B82F6'}
                stroke="#fff"
                strokeWidth="2"
                className="transition-all duration-200 hover:scale-110"
              />
              <text x="250" y="305" textAnchor="middle" className="text-xs font-medium fill-gray-700">
                대구
              </text>
              <text x="250" y="300" textAnchor="middle" className="text-xs fill-primary">
                {getRegionData('daegu')?.mall_count}개
              </text>
            </g>
          </Link>

          {/* Incheon */}
          <Link href="/region/incheon">
            <g 
              onMouseEnter={() => setHoveredRegion('incheon')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick('incheon')}
              className="cursor-pointer"
            >
              <circle
                cx="150"
                cy="170"
                r="8"
                fill={hoveredRegion === 'incheon' ? '#1E40AF' : '#3B82F6'}
                stroke="#fff"
                strokeWidth="2"
                className="transition-all duration-200 hover:scale-110"
              />
              <text x="150" y="155" textAnchor="middle" className="text-xs font-medium fill-gray-700">
                인천
              </text>
              <text x="150" y="150" textAnchor="middle" className="text-xs fill-primary">
                {getRegionData('incheon')?.mall_count}개
              </text>
            </g>
          </Link>

          {/* Gyeonggi */}
          <Link href="/region/gyeonggi">
            <g 
              onMouseEnter={() => setHoveredRegion('gyeonggi')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick('gyeonggi')}
              className="cursor-pointer"
            >
              <rect
                x="160"
                y="140"
                width="40"
                height="40"
                rx="8"
                fill={hoveredRegion === 'gyeonggi' ? '#1E40AF' : '#3B82F6'}
                stroke="#fff"
                strokeWidth="2"
                fillOpacity="0.7"
                className="transition-all duration-200 hover:scale-105"
              />
              <text x="180" y="125" textAnchor="middle" className="text-xs font-medium fill-gray-700">
                경기
              </text>
              <text x="180" y="120" textAnchor="middle" className="text-xs fill-primary">
                {getRegionData('gyeonggi')?.mall_count}개
              </text>
            </g>
          </Link>

          {/* Gangwon */}
          <Link href="/region/gangwon">
            <g 
              onMouseEnter={() => setHoveredRegion('gangwon')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick('gangwon')}
              className="cursor-pointer"
            >
              <polygon
                points="220,120 280,120 300,160 260,180 200,160"
                fill={hoveredRegion === 'gangwon' ? '#1E40AF' : '#3B82F6'}
                stroke="#fff"
                strokeWidth="2"
                fillOpacity="0.7"
                className="transition-all duration-200 hover:scale-105"
              />
              <text x="250" y="105" textAnchor="middle" className="text-xs font-medium fill-gray-700">
                강원
              </text>
              <text x="250" y="100" textAnchor="middle" className="text-xs fill-primary">
                {getRegionData('gangwon')?.mall_count}개
              </text>
            </g>
          </Link>

          {/* Chungbuk */}
          <Link href="/region/chungbuk">
            <g 
              onMouseEnter={() => setHoveredRegion('chungbuk')}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick('chungbuk')}
              className="cursor-pointer"
            >
              <ellipse
                cx="200"
                cy="240"
                rx="25"
                ry="20"
                fill={hoveredRegion === 'chungbuk' ? '#1E40AF' : '#3B82F6'}
                stroke="#fff"
                strokeWidth="2"
                fillOpacity="0.7"
                className="transition-all duration-200 hover:scale-105"
              />
              <text x="200" y="225" textAnchor="middle" className="text-xs font-medium fill-gray-700">
                충북
              </text>
              <text x="200" y="220" textAnchor="middle" className="text-xs fill-primary">
                {getRegionData('chungbuk')?.mall_count}개
              </text>
            </g>
          </Link>
        </svg>

        {hoveredRegion && (
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border max-w-xs">
            <h3 className="font-bold text-primary">
              {getRegionData(hoveredRegion)?.name_ko}
            </h3>
            <p className="text-sm text-gray-600">
              {getRegionData(hoveredRegion)?.description_ko}
            </p>
            <p className="text-xs text-primary font-medium mt-1">
              {getRegionData(hoveredRegion)?.highlight_text}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          지역을 클릭하여 해당 지역의 쇼핑몰을 확인하세요
        </p>
      </div>
    </div>
  );
}