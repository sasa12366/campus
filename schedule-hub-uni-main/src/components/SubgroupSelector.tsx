import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { ScheduleItem } from "@/types/schedule";

interface SubgroupSelectorProps {
  schedule: ScheduleItem[];
  selectedSubgroups: string[];
  onSubgroupChange: (subgroups: string[]) => void;
  mainGroup: string;
}

export function SubgroupSelector({ 
  schedule, 
  selectedSubgroups, 
  onSubgroupChange, 
  mainGroup 
}: SubgroupSelectorProps) {
  const [availableSubgroups, setAvailableSubgroups] = useState<string[]>([]);

  // Извлекаем уникальные подгруппы из расписания
  useEffect(() => {
    const subgroups = new Set<string>();
    
    schedule.forEach(item => {
      if (item.subgroup) {
        subgroups.add(item.subgroup);
      }
    });

    const sortedSubgroups = Array.from(subgroups).sort((a, b) => {
      // Сортируем так, чтобы основная группа была первой
      if (a === mainGroup) return -1;
      if (b === mainGroup) return 1;
      return a.localeCompare(b);
    });

    setAvailableSubgroups(sortedSubgroups);
    
    // Если нет выбранных подгрупп, выбираем все
    if (selectedSubgroups.length === 0 && sortedSubgroups.length > 0) {
      onSubgroupChange(sortedSubgroups);
    }
  }, [schedule, mainGroup, selectedSubgroups.length, onSubgroupChange]);

  const handleSubgroupToggle = (subgroup: string) => {
    const newSelected = selectedSubgroups.includes(subgroup)
      ? selectedSubgroups.filter(s => s !== subgroup)
      : [...selectedSubgroups, subgroup];
    
    onSubgroupChange(newSelected);
  };

  if (availableSubgroups.length <= 1) {
    return null; // Не показываем селектор, если подгруппа только одна
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 py-2 bg-muted/40 px-3 sm:px-4 rounded-lg border border-muted/60">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>Подгруппы:</span>
      </div>
      
      <div className="flex flex-wrap gap-2 flex-1">
        {availableSubgroups.map(subgroup => {
          const isSelected = selectedSubgroups.includes(subgroup);
          const scheduleCount = schedule.filter(item => item.subgroup === subgroup).length;
          
          return (
            <Badge
              key={subgroup}
              variant={isSelected ? "default" : "outline"}
              title={isSelected ? "Подгруппа отображается" : "Нажмите, чтобы включить отображение"}
              className={`cursor-pointer transition-all duration-200 text-xs px-3 py-1 border ${
                isSelected 
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted text-foreground border-dashed hover:bg-muted/70 hover:border-primary/50"
              }`}
              onClick={() => handleSubgroupToggle(subgroup)}
            >
              {subgroup}
              <span className="ml-1 text-xs opacity-75">
                ({scheduleCount})
              </span>
            </Badge>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground sm:ml-auto">
        {selectedSubgroups.length === availableSubgroups.length 
          ? 'Все' 
          : `${selectedSubgroups.length}/${availableSubgroups.length}`
        }
      </div>
    </div>
  );
} 