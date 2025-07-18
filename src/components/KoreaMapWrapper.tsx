'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  hoverColor = '#fbbf24',
  selectedColor = '#f59e0b',
  selectedRegion,
  getMallCount,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const pathColorsRef = useRef<{ [key: string]: string }>({});
  const currentHoveredPathRef = useRef<SVGPathElement | null>(null);
  const svgContainerRef = useRef<Element | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  // SVG ID to our region ID mapping
  const svgIdMapping: { [key: string]: string } = {
    'seoul': 'seoul',
    'busan': 'busan',
    'daegu': 'daegu',
    'incheon': 'incheon',
    'gwangju': 'gwangju',
    'daejeon': 'daejeon',
    'ulsan': 'ulsan',
    'sejong': 'sejong',
    'gyeonggi-do': 'gyeonggi',
    'gyeonggi': 'gyeonggi',
    'gangwon': 'gangwon',
    'gangwon-do': 'gangwon',
    'north-chungcheong': 'chungbuk',
    'chungbuk': 'chungbuk',
    'south-chungcheong': 'chungnam',
    'chungnam': 'chungnam',
    'north-jeolla': 'jeonbuk',
    'jeonbuk': 'jeonbuk',
    'south-jeolla': 'jeonnam',
    'jeonnam': 'jeonnam',
    'north-gyeongsang': 'gyeongbuk',
    'gyeongbuk': 'gyeongbuk',
    'south-gyeongsang': 'gyeongnam',
    'gyeongnam': 'gyeongnam',
    'jeju': 'jeju',
    'jeju-do': 'jeju'
  };

  // Reverse mapping for converting back
  const reverseMapping = useMemo(() => {
    const mapping: { [key: string]: string } = {};
    Object.entries(regionMapping).forEach(([eng, kor]) => {
      mapping[kor] = eng;
    });
    return mapping;
  }, []);

  // Create unique identifiers for each region (10000 + index)
  const regionUniqueIds: { [key: string]: number } = {
    'seoul': 10001,
    'busan': 10002,
    'daegu': 10003,
    'incheon': 10004,
    'gwangju': 10005,
    'daejeon': 10006,
    'ulsan': 10007,
    'sejong': 10008,
    'gyeonggi': 10009,
    'gangwon': 10010,
    'chungbuk': 10011,
    'chungnam': 10012,
    'jeonbuk': 10013,
    'jeonnam': 10014,
    'gyeongbuk': 10015,
    'gyeongnam': 10016,
    'jeju': 10017
  };

  // Prepare data for the chart with unique counts
  const data = Object.keys(regionMapping).map(regionId => ({
    locale: regionMapping[regionId],
    count: regionUniqueIds[regionId] // Use unique ID instead of mall count
  }));

  // Get original color for a region
  const getOriginalColor = useCallback((regionId: string) => {
    if (typeof fillColor === 'function') {
      return fillColor(regionId);
    }
    return fillColor || '#dbeafe';
  }, [fillColor]);

  // Create reverse mapping from unique ID to region ID
  const uniqueIdToRegion = useMemo(() => {
    const mapping: { [key: number]: string } = {};
    Object.entries(regionUniqueIds).forEach(([regionId, uniqueId]) => {
      mapping[uniqueId] = regionId;
    });
    return mapping;
  }, []);

  // Color function based on unique count
  const setColorByCount = (count: number) => {
    // Find which region this count belongs to
    const regionId = uniqueIdToRegion[count];
    
    if (!regionId) {
      return '#dbeafe'; // Default color
    }
    
    // Check if this region is selected
    if (regionId === selectedRegion) {
      return selectedColor;
    }
    
    // Check if this region is hovered
    if (regionId === hoveredRegion) {
      return hoverColor;
    }
    
    // Return original color for this specific region
    return getOriginalColor(regionId);
  };

  // Custom tooltip component (disabled to avoid conflicts)
  const CustomTooltip = () => null;

  // Clear hover state - memoized to prevent recreation
  const clearHoverState = useCallback(() => {
    if (currentHoveredPathRef.current) {
      const path = currentHoveredPathRef.current;
      const svgId = path.getAttribute('id');
      
      if (svgId) {
        const regionId = svgIdMapping[svgId];
        
        // Only restore color if not selected
        if (regionId && regionId !== selectedRegion) {
          const originalColor = pathColorsRef.current[svgId];
          if (originalColor) {
            path.setAttribute('fill', originalColor);
          }
        }
      }
      
      currentHoveredPathRef.current = null;
      setHoveredRegion(null);
      
      if (onMouseLeave) {
        onMouseLeave();
      }
    }
  }, [selectedRegion, onMouseLeave]);

  // Initialize colors and set up event handlers
  useEffect(() => {
    const initializeAndSetupEvents = () => {
      const svgElement = document.querySelector('.svg-map');
      if (!svgElement) return;

      svgContainerRef.current = svgElement;

      // Store initial colors immediately
      const paths = svgElement.querySelectorAll('path');
      
      paths.forEach(path => {
        const id = path.getAttribute('id');
        if (id && svgIdMapping[id]) {
          const regionId = svgIdMapping[id];
          const currentFill = path.getAttribute('fill') || '';
          
          // Store the actual rendered color
          if (!pathColorsRef.current[id]) {
            pathColorsRef.current[id] = currentFill || getOriginalColor(regionId);
          }
          
          // Set cursor style
          path.style.cursor = 'pointer';
        }
      });
    };

    const timeoutId = setTimeout(initializeAndSetupEvents, 50);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillColor]);

  // Handle all mouse and click events
  useEffect(() => {
    const handleClick = (event: Event) => {
      const target = event.target as SVGPathElement;
      if (target.tagName === 'path') {
        const svgId = target.getAttribute('id');
        
        if (svgId && svgIdMapping[svgId]) {
          const regionId = svgIdMapping[svgId];
          
          if (onClick) {
            onClick(regionId);
          }
        }
      }
    };

    const handleMouseEnter = (event: Event) => {
      const target = event.target as SVGPathElement;
      if (target.tagName === 'path') {
        const svgId = target.getAttribute('id');
        if (svgId && svgIdMapping[svgId]) {
          const regionId = svgIdMapping[svgId];
          
          // Clear previous hover state if any
          if (currentHoveredPathRef.current && currentHoveredPathRef.current !== target) {
            clearHoverState();
          }
          
          // Set new hover state
          currentHoveredPathRef.current = target;
          setHoveredRegion(regionId);
          
          // Apply hover color if not selected
          if (regionId !== selectedRegion) {
            target.setAttribute('fill', hoverColor);
          }
          
          // Call callback
          if (onMouseEnter) {
            onMouseEnter(regionId);
          }
        }
      }
    };

    const handleMouseLeave = (event: Event) => {
      const target = event.target as SVGPathElement;
      if (target.tagName === 'path') {
        const svgId = target.getAttribute('id');
        if (svgId && svgIdMapping[svgId]) {
          const regionId = svgIdMapping[svgId];
          
          // Only clear if this was the hovered region
          if (regionId === hoveredRegion) {
            setHoveredRegion(null);
            currentHoveredPathRef.current = null;
            
            if (onMouseLeave) {
              onMouseLeave();
            }
          }
        }
      }
    };

    // Global mouse move handler to catch missed leave events
    const handleGlobalMouseMove = (event: MouseEvent) => {
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Schedule the check for the next animation frame
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!svgContainerRef.current || !currentHoveredPathRef.current) return;

        const svgRect = svgContainerRef.current.getBoundingClientRect();
        const isInsideSvg = 
          event.clientX >= svgRect.left &&
          event.clientX <= svgRect.right &&
          event.clientY >= svgRect.top &&
          event.clientY <= svgRect.bottom;

        // If mouse is outside SVG bounds, clear hover
        if (!isInsideSvg) {
          clearHoverState();
          return;
        }

        // Check if mouse is still over the current hovered element
        const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY);
        if (elementAtPoint !== currentHoveredPathRef.current && 
            currentHoveredPathRef.current) {
          // Mouse has moved to a different element
          const isOverAnotherPath = elementAtPoint?.tagName === 'path' && 
                                   elementAtPoint.parentElement === currentHoveredPathRef.current.parentElement;
          
          if (!isOverAnotherPath) {
            // Not over any path, clear hover
            clearHoverState();
          }
        }
      });
    };

    // Attach event listeners
    const attachEvents = () => {
      const svgElement = document.querySelector('.svg-map');
      if (!svgElement) return;

      // Remove any existing listeners first
      svgElement.removeEventListener('click', handleClick);
      svgElement.removeEventListener('mouseenter', handleMouseEnter, true);
      svgElement.removeEventListener('mouseleave', handleMouseLeave, true);

      // Add new listeners with capture phase for better event handling
      svgElement.addEventListener('click', handleClick);
      svgElement.addEventListener('mouseenter', handleMouseEnter, true);
      svgElement.addEventListener('mouseleave', handleMouseLeave, true);

      // Add global mouse move listener
      window.addEventListener('mousemove', handleGlobalMouseMove);
    };

    const timeoutId = setTimeout(attachEvents, 50);

    return () => {
      clearTimeout(timeoutId);
      
      // Clean up all event listeners
      const svgElement = document.querySelector('.svg-map');
      if (svgElement) {
        svgElement.removeEventListener('click', handleClick);
        svgElement.removeEventListener('mouseenter', handleMouseEnter, true);
        svgElement.removeEventListener('mouseleave', handleMouseLeave, true);
      }
      
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clear any remaining hover state
      clearHoverState();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClick, onMouseEnter, selectedRegion, hoverColor, clearHoverState]);


  return (
    <div className="korea-map-wrapper w-full">
      <style jsx global>{`
        .korea-map-wrapper .svg-map {
          width: 100%;
          height: auto;
        }
        .korea-map-wrapper .svg-map path {
          transition: fill 0.1s ease;
        }
        .korea-map-wrapper .svg-map path:active {
          transition: none;
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