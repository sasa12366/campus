import { useState } from "react";
import { ScheduleItem } from "@/types/schedule";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { timeSlots, weekDays } from "@/data/mockData";
import { getWeek } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  schedule: ScheduleItem[];
  selectedDate: Date;
  isAdmin?: boolean;
  onItemClick?: (item: ScheduleItem) => void;
}

export function CalendarView({ schedule, selectedDate, isAdmin = false, onItemClick }: CalendarViewProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  
  const weekNumber = getWeek(selectedDate);
  const isEvenWeek = weekNumber % 2 === 0;
  const currentParity = isEvenWeek ? 'ЗНАМЕНАТЕЛЬ' : 'ЧИСЛИТЕЛЬ';

  const dayNames = {
    'ПОНЕДЕЛЬНИК': 'ПН',
    'ВТОРНИК': 'ВТ',
    'СРЕДА': 'СР',
    'ЧЕТВЕРГ': 'ЧТ',
    'ПЯТНИЦА': 'ПТ',
    'СУББОТА': 'СБ'
  };

  const getScheduleForSlot = (day: string, timeSlot: { start: string; end: string }) => {
    return schedule.filter(item => 
      item.dayWeek === day && 
      item.timeStart === timeSlot.start &&
      (item.parity === 'ВСЕГДА' || item.parity === currentParity)
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Л': return 'bg-blue-500';
      case 'ПР': return 'bg-green-500';
      case 'ЛАБ': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          <div className="p-3 text-center font-semibold text-muted-foreground">
            Время
          </div>
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center font-semibold bg-primary/10 rounded-lg">
              {dayNames[day as keyof typeof dayNames]}
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          {timeSlots.map((timeSlot, slotIndex) => (
            <div key={slotIndex} className="grid grid-cols-7 gap-2">
              {/* Time column */}
              <div className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted rounded-lg">
                <div>{timeSlot.start}</div>
                <div>{timeSlot.end}</div>
              </div>

              {/* Days */}
              {weekDays.map((day) => {
                const scheduleItems = getScheduleForSlot(day, timeSlot);
                const cellKey = `${day}-${slotIndex}`;
                
                return (
                  <Card 
                    key={day} 
                    className={cn(
                      "min-h-[80px] transition-all duration-200",
                      scheduleItems.length > 0 ? "bg-gradient-secondary hover:shadow-medium" : "bg-muted/30",
                      isAdmin && scheduleItems.length > 0 && "cursor-pointer hover:scale-[1.02]"
                    )}
                    onMouseEnter={() => setHoveredCell(cellKey)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <CardContent className="p-2 h-full">
                      {scheduleItems.length > 0 ? (
                        <div className="space-y-1">
                          {scheduleItems.map((item) => (
                            <Popover key={item.id}>
                              <PopoverTrigger asChild>
                                <div
                                  className={cn(
                                    "text-xs p-2 rounded cursor-pointer transition-colors",
                                    getTypeColor(item.type),
                                    "text-white hover:opacity-90"
                                  )}
                                  onClick={() => isAdmin && onItemClick?.(item)}
                                >
                                  <div className="font-medium truncate">
                                    {item.subject}
                                  </div>
                                  <div className="opacity-90 truncate">
                                    {item.classroom}
                                  </div>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" side="top">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-semibold text-lg leading-tight">
                                      {item.subject}
                                    </h4>
                                    <Badge className={cn("text-xs", getTypeColor(item.type))}>
                                      {item.type}
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Время:</span>
                                      <span>{item.timeStart} - {item.timeEnd}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Аудитория:</span>
                                      <span>{item.classroom}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Преподаватель:</span>
                                      <span>{item.teacher}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Периодичность:</span>
                                      <Badge variant="outline">
                                        {item.parity}
                                      </Badge>
                                    </div>
                                    {item.subgroup && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Группа:</span>
                                        <span>{item.subgroup}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                          {hoveredCell === cellKey && isAdmin && "Добавить пару"}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}