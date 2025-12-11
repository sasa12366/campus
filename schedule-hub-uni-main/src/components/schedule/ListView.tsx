import { ScheduleItem } from "@/types/schedule";
import { ScheduleCard } from "./ScheduleCard";
import { getWeek } from "date-fns";

interface ListViewProps {
  schedule: ScheduleItem[];
  selectedDate: Date;
  isAdmin?: boolean;
  onItemClick?: (item: ScheduleItem) => void;
}

export function ListView({ schedule, selectedDate, isAdmin = false, onItemClick }: ListViewProps) {
  const weekNumber = getWeek(selectedDate);
  const isEvenWeek = weekNumber % 2 === 0;
  const currentParity = isEvenWeek ? 'ЗНАМЕНАТЕЛЬ' : 'ЧИСЛИТЕЛЬ';

  // Filter and group schedule by days
  const filteredSchedule = schedule.filter(item => 
    item.parity === 'ВСЕГДА' || item.parity === currentParity
  );

  const groupedSchedule = filteredSchedule.reduce((acc, item) => {
    if (!acc[item.dayWeek]) {
      acc[item.dayWeek] = [];
    }
    acc[item.dayWeek].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  const dayNames = {
    'ПОНЕДЕЛЬНИК': 'Понедельник',
    'ВТОРНИК': 'Вторник',
    'СРЕДА': 'Среда',
    'ЧЕТВЕРГ': 'Четверг',
    'ПЯТНИЦА': 'Пятница',
    'СУББОТА': 'Суббота'
  };

  const weekDays = ['ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА'];

  return (
    <div className="space-y-8">
      {weekDays.map((day) => {
        const daySchedule = groupedSchedule[day] || [];
        
        if (daySchedule.length === 0) return null;

        return (
          <div key={day} className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-xl font-bold text-foreground">
                {dayNames[day as keyof typeof dayNames]}
              </h3>
              <p className="text-sm text-muted-foreground">
                {daySchedule.length} {daySchedule.length === 1 ? 'пара' : 'пар'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {daySchedule
                .sort((a, b) => a.timeStart.localeCompare(b.timeStart))
                .map((item) => (
                  <ScheduleCard
                    key={item.id}
                    item={item}
                    isAdmin={isAdmin}
                    onClick={() => onItemClick?.(item)}
                  />
                ))}
            </div>
          </div>
        );
      })}

      {Object.keys(groupedSchedule).length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">
            Нет расписания на эту неделю
          </p>
        </div>
      )}
    </div>
  );
}