import { ScheduleItem } from "@/types/schedule";
import { ScheduleCard } from "./ScheduleCard";
import { weekDays } from "@/data/mockData";
import { getWeek } from "date-fns";

interface ColumnsViewProps {
  schedule: ScheduleItem[];
  selectedDate: Date;
  isAdmin?: boolean;
  onItemClick?: (item: ScheduleItem) => void;
}

export function ColumnsView({ schedule, selectedDate, isAdmin = false, onItemClick }: ColumnsViewProps) {
  const weekNumber = getWeek(selectedDate);
  const isEvenWeek = weekNumber % 2 === 0;
  const currentParity = isEvenWeek ? 'ЗНАМЕНАТЕЛЬ' : 'ЧИСЛИТЕЛЬ';

  const filterScheduleForDay = (day: string) => {
    return schedule.filter(item => 
      item.dayWeek === day && 
      (item.parity === 'ВСЕГДА' || item.parity === currentParity)
    );
  };

  const dayNames = {
    'ПОНЕДЕЛЬНИК': 'Понедельник',
    'ВТОРНИК': 'Вторник',
    'СРЕДА': 'Среда',
    'ЧЕТВЕРГ': 'Четверг',
    'ПЯТНИЦА': 'Пятница',
    'СУББОТА': 'Суббота'
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-4 pb-4" style={{ minWidth: 'fit-content' }}>
        {weekDays.map((day) => {
          const daySchedule = filterScheduleForDay(day);
          
          return (
            <div key={day} className="flex-shrink-0 w-80 space-y-4">
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm p-3 rounded-lg border shadow-sm">
                <h3 className="font-semibold text-center text-lg">
                  {dayNames[day as keyof typeof dayNames]}
                </h3>
                <p className="text-xs text-center text-muted-foreground">
                  {daySchedule.length} {daySchedule.length === 1 ? 'пара' : 'пар'}
                </p>
              </div>
              
              <div className="space-y-3 min-h-[200px]">
                {daySchedule.length > 0 ? (
                  daySchedule
                    .sort((a, b) => a.timeStart.localeCompare(b.timeStart))
                    .map((item) => (
                      <div key={item.id} className="w-full">
                        <ScheduleCard
                          item={item}
                          isAdmin={isAdmin}
                          onClick={() => onItemClick?.(item)}
                        />
                      </div>
                    ))
                ) : (
                  <div className="flex items-center justify-center h-32 text-center text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                    <p className="text-sm">Нет пар</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Подсказка о горизонтальном скролле на мобильных */}
      <div className="md:hidden text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
        <span>←</span>
        <span>Прокрутите горизонтально для просмотра всех дней</span>
        <span>→</span>
      </div>
    </div>
  );
}