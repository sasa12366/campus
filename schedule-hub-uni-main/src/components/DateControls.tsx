import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addWeeks, subWeeks, getWeek } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateControlsProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateControls({ selectedDate, onDateChange }: DateControlsProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Determine week parity (четность недели)
  const weekNumber = getWeek(selectedDate);
  const isEvenWeek = weekNumber % 2 === 0;

  const handlePrevWeek = () => {
    onDateChange(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    onDateChange(addWeeks(selectedDate, 1));
  };

  return (
    <div className="flex items-center gap-4 bg-card p-4 rounded-lg shadow-soft">
      {/* Week Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevWeek}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextWeek}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Date Picker */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(selectedDate, "d MMMM yyyy", { locale: ru })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                onDateChange(date);
                setIsCalendarOpen(false);
              }
            }}
            initialFocus
            className="p-3 pointer-events-auto"
            locale={ru}
          />
        </PopoverContent>
      </Popover>

      {/* Week Parity Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Неделя:</span>
        <Badge 
          variant={isEvenWeek ? "default" : "default"}
          className={isEvenWeek ? "bg-primary" : "bg-accent"}
        >
          {isEvenWeek ? 'Знаменатель' : 'Числитель'}
        </Badge>
        <span className="text-xs text-muted-foreground">({weekNumber})</span>
      </div>

      {/* Current Week Indicator */}
      <div className="text-sm text-muted-foreground">
        {format(selectedDate, "EEEE", { locale: ru })}
      </div>
    </div>
  );
}