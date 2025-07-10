declare module 'react-simple-south-korea-map-chart' {
  import { FC } from 'react';

  interface SimpleSouthKoreaMapChartProps {
    darkMode?: boolean;
    data: Array<{ locale: string; count: number }>;
    unit?: string;
    setColorByCount: (count: number) => string;
    customTooltip?: any;
  }

  interface SouthKoreaSvgMapProps {
    className?: string;
    role?: string;
    data?: any;
    setColorByCount?: (count: number) => string;
    locationClassName?: string | ((location: any, index: number) => string);
    locationTabIndex?: string | ((location: any, index: number) => string);
    locationRole?: string;
    locationAriaLabel?: (location: any, index: number) => string;
    onLocationMouseOver?: (event: React.MouseEvent<SVGPathElement>) => void;
    onLocationMouseOut?: (event: React.MouseEvent<SVGPathElement>) => void;
    onLocationMouseMove?: (event: React.MouseEvent<SVGPathElement>) => void;
    onLocationClick?: (event: React.MouseEvent<SVGPathElement>) => void;
    onLocationKeyDown?: (event: React.KeyboardEvent<SVGPathElement>) => void;
    onLocationFocus?: (event: React.FocusEvent<SVGPathElement>) => void;
    onLocationBlur?: (event: React.FocusEvent<SVGPathElement>) => void;
    isLocationSelected?: (location: { name: string }, index: number) => boolean;
    childrenBefore?: React.ReactNode;
    childrenAfter?: React.ReactNode;
  }

  export const SimpleSouthKoreaMapChart: FC<SimpleSouthKoreaMapChartProps>;
  export const SouthKoreaSvgMap: FC<SouthKoreaSvgMapProps>;
}