import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Subject } from "@/types/schedule";

interface SubjectSelectProps {
  value: string;
  selectedType?: string;
  onValueChange: (value: string) => void;
  onSubjectSelect?: (subject: Subject) => void;
  placeholder?: string;
  disabled?: boolean;
}

const normalizeType = (type: string) => type.replace(/[()]/g, '');

export function SubjectSelect({ value, selectedType, onValueChange, onSubjectSelect, placeholder = "Выберите предмет...", disabled = false }: SubjectSelectProps) {
  const [open, setOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setIsLoading(true);
        const subjectsData = await api.getAllSubjects();
        setSubjects(subjectsData);
      } catch (error) {
        console.error('Ошибка загрузки предметов:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubjects();
  }, []);

  const selectedSubject = subjects.find(
    (subject) => subject.name === value && (!selectedType || normalizeType(subject.type) === selectedType)
  ) || subjects.find(subject => subject.name === value);

  const getTypeColor = (type: string) => {
    switch (type.replace(/[()]/g, '')) {
      case 'Л': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ПР': return 'bg-green-100 text-green-800 border-green-200';
      case 'ЛАБ': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {selectedSubject ? (
              <div className="flex items-center gap-2 max-w-full">
                <span className="truncate" title={selectedSubject.name}>{selectedSubject.name}</span>
                <Badge className={getTypeColor(selectedSubject.type)} variant="outline">
                  {normalizeType(selectedSubject.type)}
                </Badge>
              </div>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Поиск предмета..." 
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm">Загрузка...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <Search className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Предмет не найден</span>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {subjects.map((subject) => {
                const isSelected = selectedSubject?.id === subject.id;
                return (
                <CommandItem
                  key={subject.id}
                    value={`${subject.name} ${subject.type}`}
                    onSelect={() => {
                      onValueChange(subject.name);
                      onSubjectSelect?.(subject);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2 max-w-full">
                        <span className="font-medium truncate" title={subject.name}>{subject.name}</span>
                      <Badge className={getTypeColor(subject.type)} variant="outline">
                          {normalizeType(subject.type)}
                      </Badge>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 