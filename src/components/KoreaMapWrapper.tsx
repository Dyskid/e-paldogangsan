'use client';

import React, { useState, useEffect } from 'react';
import { SimpleSouthKoreaMapChart } from 'react-simple-south-korea-map-chart';
import 'react-simple-south-korea-map-chart/dist/map.css';

interface KoreaMapWrapperProps {
  onClick?: (regionCode: string) => void;
  onMouseEnter?: (regionCode: string) => void;
  onMouseLeave?: () => void;
  fillColor?: string | ((regionCode: string) => string);
  strokeColor?: string;
  strokeWidth?: number;
  hoverColor?: string;
  selectedColor?: string;
  selectedRegion?: string | null;
  width?: number;
  height?: number;
  getMallCount: (regionId: string) => number;
}

const KoreaMapWrapper: React.FC<KoreaMapWrapperProps> = ({
  onClick,
  onMouseEnter,
  onMouseLeave,
  fillColor,
  selectedRegion,
  getMallCount,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Convert region codes to the format expected by the package
  const regionMapping: { [key: string]: string } = {
    'seoul': '서울특별시',
    'busan': '부산광역시',
    'daegu': '대구광역시',
    'incheon': '인천광역시',
    'gwangju': '광주광역시',
    'daejeon': '대전광역시',
    'ulsan': '울산광역시',
    'sejong': '세종특별자치시',
    'gyeonggi': '경기도',
    'gangwon': '강원도',
    'chungbuk': '충청북도',
    'chungnam': '충청남도',
    'jeonbuk': '전라북도',
    'jeonnam': '전라남도',
    'gyeongbuk': '경상북도',
    'gyeongnam': '경상남도',
    'jeju': '제주특별자치도'
  };

  // Reverse mapping for converting back
  const reverseMapping: { [key: string]: string } = {};
  Object.entries(regionMapping).forEach(([eng, kor]) => {
    reverseMapping[kor] = eng;
  });

  // Prepare data for the chart
  const data = Object.keys(regionMapping).map(regionId => ({
    locale: regionMapping[regionId],
    count: getMallCount(regionId)
  }));

  // Color function based on count
  const setColorByCount = (count: number) => {
    // Find which region has this count
    const region = data.find(d => d.count === count);
    if (region) {
      const regionId = reverseMapping[region.locale];
      if (regionId === selectedRegion) {
        return '#f59e0b'; // Selected color
      }
      if (regionId === hoveredRegion) {
        return '#fbbf24'; // Hover color
      }
      if (typeof fillColor === 'function') {
        return fillColor(regionId);
      }
    }
    return typeof fillColor === 'string' ? fillColor : '#dbeafe';
  };

  // Custom tooltip component
  const CustomTooltip = ({ tooltipStyle, children }: any) => {
    // We'll use this to trigger hover events
    React.useEffect(() => {
      if (children) {
        const locale = children.split(':')[0].trim();
        const regionId = reverseMapping[locale];
        if (regionId && regionId !== hoveredRegion) {
          setHoveredRegion(regionId);
          if (onMouseEnter) {
            onMouseEnter(regionId);
          }
        }
      }
    }, [children]);

    // Return null to hide the default tooltip
    return null;
  };

  // Add click handler via DOM manipulation
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target && target.tagName === 'path' && target.hasAttribute('name')) {
        const locationName = target.getAttribute('name');
        if (locationName) {
          const regionId = reverseMapping[locationName];
          if (regionId && onClick) {
            onClick(regionId);
          }
        }
      }
    };

    const handleMouseOut = () => {
      setHoveredRegion(null);
      if (onMouseLeave) {
        onMouseLeave();
      }
    };

    // Add event listeners after a short delay to ensure SVG is rendered
    const timeoutId = setTimeout(() => {
      const svgElement = document.querySelector('.svg-map');
      if (svgElement) {
        svgElement.addEventListener('click', handleClick);
        svgElement.addEventListener('mouseleave', handleMouseOut);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      const svgElement = document.querySelector('.svg-map');
      if (svgElement) {
        svgElement.removeEventListener('click', handleClick);
        svgElement.removeEventListener('mouseleave', handleMouseOut);
      }
    };
  }, [onClick, onMouseLeave]);

  return (
    <div className="korea-map-wrapper w-full">
      <style jsx global>{`
        .korea-map-wrapper .svg-map {
          width: 100%;
          height: auto;
        }
        .korea-map-wrapper .svg-map__location {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .korea-map-wrapper .svg-map__location:hover {
          opacity: 0.8;
        }
      `}</style>
      <SimpleSouthKoreaMapChart
        data={data}
        unit="개"
        setColorByCount={setColorByCount}
        customTooltip={<CustomTooltip />}
      />
    </div>
  );
};

export default KoreaMapWrapper;
