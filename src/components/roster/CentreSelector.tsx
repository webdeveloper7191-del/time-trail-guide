import { useMemo } from 'react';
import { Centre } from '@/types/roster';
import { MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CentreSelectorProps {
  centres: Centre[];
  selectedCentreId: string;
  onCentreChange: (centreId: string) => void;
  label?: string;
}

export function CentreSelector({
  centres,
  selectedCentreId,
  onCentreChange,
  label = 'Location',
}: CentreSelectorProps) {
  const selectedCentre = useMemo(
    () => centres.find(c => c.id === selectedCentreId),
    [centres, selectedCentreId]
  );

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={selectedCentreId} onValueChange={onCentreChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <SelectValue placeholder="Select location" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {centres.map(centre => (
            <SelectItem key={centre.id} value={centre.id}>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span>{centre.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {centre.rooms.length} rooms · {centre.operatingHours.start}–{centre.operatingHours.end}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
