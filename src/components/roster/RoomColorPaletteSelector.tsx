import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Palette, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

export type ColorPalette = 
  | 'ocean' | 'forest' | 'arctic' | 'twilight' 
  | 'sunset' | 'autumn' | 'coral' | 'desert'
  | 'lavender' | 'mint' | 'rose' | 'sky'
  | 'neon' | 'jewel' | 'tropical' | 'electric'
  | 'earth' | 'slate' | 'mono' | 'vintage';

interface PaletteConfig {
  name: string;
  description: string;
  category: 'cool' | 'warm' | 'pastel' | 'vibrant' | 'neutral';
  colors: string[];
}

export const colorPalettes: Record<ColorPalette, PaletteConfig> = {
  // Cool Palettes
  ocean: {
    name: 'Ocean',
    description: 'Deep blues & teals',
    category: 'cool',
    colors: [
      'hsl(200, 75%, 50%)',
      'hsl(185, 70%, 45%)',
      'hsl(220, 70%, 55%)',
      'hsl(195, 80%, 40%)',
    ],
  },
  forest: {
    name: 'Forest',
    description: 'Greens & emeralds',
    category: 'cool',
    colors: [
      'hsl(150, 60%, 40%)',
      'hsl(170, 55%, 45%)',
      'hsl(130, 50%, 45%)',
      'hsl(160, 65%, 38%)',
    ],
  },
  arctic: {
    name: 'Arctic',
    description: 'Ice blues & silvers',
    category: 'cool',
    colors: [
      'hsl(200, 60%, 60%)',
      'hsl(210, 50%, 55%)',
      'hsl(190, 55%, 50%)',
      'hsl(205, 65%, 65%)',
    ],
  },
  twilight: {
    name: 'Twilight',
    description: 'Purples & indigos',
    category: 'cool',
    colors: [
      'hsl(260, 60%, 55%)',
      'hsl(280, 55%, 50%)',
      'hsl(240, 50%, 55%)',
      'hsl(270, 65%, 60%)',
    ],
  },

  // Warm Palettes
  sunset: {
    name: 'Sunset',
    description: 'Oranges & pinks',
    category: 'warm',
    colors: [
      'hsl(25, 85%, 55%)',
      'hsl(340, 70%, 55%)',
      'hsl(15, 80%, 50%)',
      'hsl(355, 75%, 60%)',
    ],
  },
  autumn: {
    name: 'Autumn',
    description: 'Reds & golds',
    category: 'warm',
    colors: [
      'hsl(30, 80%, 50%)',
      'hsl(10, 75%, 50%)',
      'hsl(45, 90%, 50%)',
      'hsl(20, 85%, 45%)',
    ],
  },
  coral: {
    name: 'Coral',
    description: 'Warm coral tones',
    category: 'warm',
    colors: [
      'hsl(15, 80%, 60%)',
      'hsl(5, 75%, 55%)',
      'hsl(25, 85%, 55%)',
      'hsl(350, 70%, 58%)',
    ],
  },
  desert: {
    name: 'Desert',
    description: 'Sandy & terracotta',
    category: 'warm',
    colors: [
      'hsl(30, 60%, 55%)',
      'hsl(15, 55%, 50%)',
      'hsl(40, 65%, 50%)',
      'hsl(20, 50%, 45%)',
    ],
  },

  // Pastel Palettes
  lavender: {
    name: 'Lavender',
    description: 'Soft purples',
    category: 'pastel',
    colors: [
      'hsl(270, 50%, 70%)',
      'hsl(280, 45%, 72%)',
      'hsl(260, 55%, 68%)',
      'hsl(290, 40%, 75%)',
    ],
  },
  mint: {
    name: 'Mint',
    description: 'Fresh greens',
    category: 'pastel',
    colors: [
      'hsl(160, 50%, 65%)',
      'hsl(170, 45%, 62%)',
      'hsl(150, 55%, 68%)',
      'hsl(180, 40%, 60%)',
    ],
  },
  rose: {
    name: 'Rose',
    description: 'Soft pinks',
    category: 'pastel',
    colors: [
      'hsl(340, 50%, 72%)',
      'hsl(350, 55%, 70%)',
      'hsl(330, 45%, 75%)',
      'hsl(360, 50%, 68%)',
    ],
  },
  sky: {
    name: 'Sky',
    description: 'Light blues',
    category: 'pastel',
    colors: [
      'hsl(200, 60%, 70%)',
      'hsl(190, 55%, 68%)',
      'hsl(210, 50%, 72%)',
      'hsl(195, 65%, 65%)',
    ],
  },

  // Vibrant Palettes
  neon: {
    name: 'Neon',
    description: 'Electric brights',
    category: 'vibrant',
    colors: [
      'hsl(180, 100%, 45%)',
      'hsl(320, 100%, 50%)',
      'hsl(60, 100%, 50%)',
      'hsl(280, 100%, 55%)',
    ],
  },
  jewel: {
    name: 'Jewel',
    description: 'Rich gem tones',
    category: 'vibrant',
    colors: [
      'hsl(160, 80%, 35%)',
      'hsl(270, 70%, 45%)',
      'hsl(350, 75%, 45%)',
      'hsl(210, 85%, 45%)',
    ],
  },
  tropical: {
    name: 'Tropical',
    description: 'Vibrant island colors',
    category: 'vibrant',
    colors: [
      'hsl(170, 85%, 40%)',
      'hsl(320, 80%, 50%)',
      'hsl(45, 95%, 50%)',
      'hsl(200, 90%, 50%)',
    ],
  },
  electric: {
    name: 'Electric',
    description: 'Bold & energetic',
    category: 'vibrant',
    colors: [
      'hsl(210, 100%, 50%)',
      'hsl(150, 100%, 40%)',
      'hsl(280, 85%, 55%)',
      'hsl(30, 100%, 50%)',
    ],
  },

  // Neutral Palettes
  earth: {
    name: 'Earth',
    description: 'Natural browns',
    category: 'neutral',
    colors: [
      'hsl(30, 40%, 45%)',
      'hsl(20, 35%, 40%)',
      'hsl(40, 45%, 50%)',
      'hsl(25, 30%, 35%)',
    ],
  },
  slate: {
    name: 'Slate',
    description: 'Cool grays',
    category: 'neutral',
    colors: [
      'hsl(210, 20%, 50%)',
      'hsl(200, 25%, 45%)',
      'hsl(220, 15%, 55%)',
      'hsl(215, 22%, 40%)',
    ],
  },
  mono: {
    name: 'Mono',
    description: 'Grayscale',
    category: 'neutral',
    colors: [
      'hsl(0, 0%, 40%)',
      'hsl(0, 0%, 50%)',
      'hsl(0, 0%, 35%)',
      'hsl(0, 0%, 55%)',
    ],
  },
  vintage: {
    name: 'Vintage',
    description: 'Muted retro',
    category: 'neutral',
    colors: [
      'hsl(180, 25%, 45%)',
      'hsl(30, 35%, 50%)',
      'hsl(340, 30%, 50%)',
      'hsl(60, 30%, 45%)',
    ],
  },
};

const categoryLabels: Record<string, string> = {
  cool: '❄️ Cool',
  warm: '🔥 Warm',
  pastel: '🌸 Pastel',
  vibrant: '⚡ Vibrant',
  neutral: '🪨 Neutral',
};

interface RoomColorPaletteSelectorProps {
  selectedPalette: ColorPalette;
  onPaletteChange: (palette: ColorPalette) => void;
}

export function RoomColorPaletteSelector({ 
  selectedPalette, 
  onPaletteChange 
}: RoomColorPaletteSelectorProps) {
  const groupedPalettes = Object.entries(colorPalettes).reduce((acc, [key, value]) => {
    if (!acc[value.category]) acc[value.category] = [];
    acc[value.category].push({ key: key as ColorPalette, ...value });
    return acc;
  }, {} as Record<string, Array<PaletteConfig & { key: ColorPalette }>>);

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Room Color Theme</p>
          </TooltipContent>
          <DropdownMenuContent align="end" className="w-64 bg-popover">
            <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[320px]">
              {Object.entries(groupedPalettes).map(([category, palettes]) => (
                <DropdownMenuGroup key={category}>
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal py-1">
                    {categoryLabels[category]}
                  </DropdownMenuLabel>
                  {palettes.map((palette) => {
                    const isSelected = selectedPalette === palette.key;
                    
                    return (
                      <DropdownMenuItem
                        key={palette.key}
                        onClick={() => onPaletteChange(palette.key)}
                        className="flex items-center gap-2 py-2 cursor-pointer"
                      >
                        {/* Color swatches */}
                        <div className="flex gap-0.5">
                          {palette.colors.map((color, idx) => (
                            <div
                              key={idx}
                              className="h-4 w-4 rounded-full border border-border/30 shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        
                        {/* Label */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{palette.name}</p>
                        </div>
                        
                        {/* Selected indicator */}
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
