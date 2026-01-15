import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Palette, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type ColorPalette = 'cool' | 'warm' | 'pastel' | 'vibrant';

export const colorPalettes: Record<ColorPalette, { name: string; description: string; colors: string[] }> = {
  cool: {
    name: 'Cool',
    description: 'Blues, teals & greens',
    colors: [
      'hsl(200, 75%, 50%)',  // Sky blue
      'hsl(170, 65%, 45%)',  // Teal
      'hsl(260, 60%, 55%)',  // Purple
      'hsl(220, 70%, 55%)',  // Royal blue
    ],
  },
  warm: {
    name: 'Warm',
    description: 'Oranges, reds & yellows',
    colors: [
      'hsl(25, 85%, 55%)',   // Orange
      'hsl(0, 70%, 55%)',    // Red
      'hsl(45, 90%, 50%)',   // Gold
      'hsl(340, 75%, 55%)',  // Rose
    ],
  },
  pastel: {
    name: 'Pastel',
    description: 'Soft, muted tones',
    colors: [
      'hsl(200, 60%, 70%)',  // Light blue
      'hsl(150, 50%, 65%)',  // Mint
      'hsl(280, 50%, 72%)',  // Lavender
      'hsl(35, 60%, 70%)',   // Peach
    ],
  },
  vibrant: {
    name: 'Vibrant',
    description: 'Bold, saturated colors',
    colors: [
      'hsl(210, 100%, 50%)', // Electric blue
      'hsl(150, 100%, 40%)', // Emerald
      'hsl(280, 85%, 55%)',  // Violet
      'hsl(180, 100%, 40%)', // Cyan
    ],
  },
};

interface RoomColorPaletteSelectorProps {
  selectedPalette: ColorPalette;
  onPaletteChange: (palette: ColorPalette) => void;
}

export function RoomColorPaletteSelector({ 
  selectedPalette, 
  onPaletteChange 
}: RoomColorPaletteSelectorProps) {
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(colorPalettes) as ColorPalette[]).map((paletteKey) => {
              const palette = colorPalettes[paletteKey];
              const isSelected = selectedPalette === paletteKey;
              
              return (
                <DropdownMenuItem
                  key={paletteKey}
                  onClick={() => onPaletteChange(paletteKey)}
                  className="flex items-center gap-3 py-2.5 cursor-pointer"
                >
                  {/* Color swatches */}
                  <div className="flex gap-1">
                    {palette.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="h-5 w-5 rounded-full border border-border/50 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  
                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{palette.name}</p>
                    <p className="text-xs text-muted-foreground">{palette.description}</p>
                  </div>
                  
                  {/* Selected indicator */}
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
