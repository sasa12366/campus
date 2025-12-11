import { ScheduleItem } from "@/types/schedule";
import { ViewMode } from "../ViewToggle";
import { ColumnsView } from "./ColumnsView";
import { ListView } from "./ListView";
import { CalendarView } from "./CalendarView";

interface ScheduleDisplayProps {
  schedule: ScheduleItem[];
  selectedDate: Date;
  viewMode: ViewMode;
  isAdmin?: boolean;
  onItemClick?: (item: ScheduleItem) => void;
}

export function ScheduleDisplay({ 
  schedule, 
  selectedDate, 
  viewMode, 
  isAdmin = false, 
  onItemClick 
}: ScheduleDisplayProps) {
  const commonProps = {
    schedule,
    selectedDate,
    isAdmin,
    onItemClick
  };

  switch (viewMode) {
    case 'columns':
      return <ColumnsView {...commonProps} />;
    case 'list':
      return <ListView {...commonProps} />;
    case 'calendar':
      return <CalendarView {...commonProps} />;
    default:
      return <ColumnsView {...commonProps} />;
  }
}