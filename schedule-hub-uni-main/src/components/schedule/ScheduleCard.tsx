import { ScheduleItem } from "@/types/schedule";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleCardProps {
  item: ScheduleItem;
  isAdmin?: boolean;
  onClick?: () => void;
}

export function ScheduleCard({ item, isAdmin = false, onClick }: ScheduleCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Л': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ПР': return 'bg-green-100 text-green-800 border-green-200';
      case 'ЛАБ': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getParityColor = (parity: string) => {
    switch (parity) {
      case 'ЧИСЛИТЕЛЬ': return 'bg-orange-100 text-orange-800';
      case 'ЗНАМЕНАТЕЛЬ': return 'bg-cyan-100 text-cyan-800';
      case 'ВСЕГДА': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-medium",
        isAdmin && "cursor-pointer hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with subject and type */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground leading-tight flex-1">
              {item.subject}
            </h3>
            <Badge className={getTypeColor(item.type)}>
              {item.type}
            </Badge>
          </div>

          {/* Time and classroom */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{item.timeStart} - {item.timeEnd}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>ауд. {item.classroom}</span>
            </div>
          </div>

          {/* Teacher */}
          <div className="flex items-center gap-1 text-sm">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground">{item.teacher}</span>
          </div>

          {/* Footer with parity and subgroup */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={getParityColor(item.parity)}
            >
              {item.parity}
            </Badge>
            {item.subgroup && (
              <span className="text-xs text-muted-foreground">
                Группа {item.subgroup}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}