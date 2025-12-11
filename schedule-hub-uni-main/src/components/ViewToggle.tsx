import { Button } from "@/components/ui/button";
import { Calendar, List, Columns3 } from "lucide-react";

export type ViewMode = 'columns' | 'list' | 'calendar';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const views: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'columns', icon: <Columns3 className="h-4 w-4" />, label: 'По дням' },
    { mode: 'list', icon: <List className="h-4 w-4" />, label: 'Список' },
    { mode: 'calendar', icon: <Calendar className="h-4 w-4" />, label: 'Календарь' },
  ];

  return (
    <div className="flex bg-muted p-1 rounded-lg">
      {views.map(({ mode, icon, label }) => (
        <Button
          key={mode}
          variant="ghost"
          size="sm"
          onClick={() => onViewChange(mode)}
          className={`flex items-center gap-2 transition-colors ${
            currentView === mode 
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-white shadow-sm" 
              : "text-muted-foreground hover:bg-[#7c3aed] hover:text-white"
          }`}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}