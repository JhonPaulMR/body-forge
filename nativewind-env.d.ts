/// <reference types="nativewind/types" />

declare module 'lucide-react-native' {
  import { ComponentType } from 'react';
  import { SvgProps } from 'react-native-svg';

  interface IconProps extends SvgProps {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    fill?: string;
  }

  type Icon = ComponentType<IconProps>;

  export const Home: Icon;
  export const Dumbbell: Icon;
  export const Clock: Icon;
  export const BarChart3: Icon;
  export const BicepsFlexed: Icon;
  export const Menu: Icon;
  export const Play: Icon;
  export const Plus: Icon;
  export const Droplet: Icon;
  export const Utensils: Icon;
  export const ChevronRight: Icon;
  export const ChevronDown: Icon;
  export const Zap: Icon;
  export const TrendingUp: Icon;
  export const Scale: Icon;
  export const Activity: Icon;
  export const ArrowLeft: Icon;
  export const Search: Icon;
  export const FileText: Icon;
  export const ExternalLink: Icon;
  export const Camera: Icon;
  export const X: Icon;
  export const Check: Icon;
  export const Trash2: Icon;
  export const GripVertical: Icon;
  export const Pencil: Icon;
  export const Share2: Icon;
  export const MoreVertical: Icon;
  export const ArrowUp: Icon;
  export const ArrowDown: Icon;
  export const Copy: Icon;
  export const Link: Icon;
  export const Minus: Icon;
  export const Unlink: Icon;
  export const Delete: Icon;
}
