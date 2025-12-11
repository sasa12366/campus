import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, GraduationCap, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Group, Teacher } from "@/types/schedule";

interface SearchResult {
  id: string;
  name: string;
  type: 'group' | 'teacher';
  faculty?: string;
}

interface SearchBarProps {
  onSelect: (result: SearchResult) => void;
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [allTeachers, setTeachers] = useState<Teacher[]>([]);

  // Загружаем все данные при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        const [groups, teachers] = await Promise.all([
          api.getAllGroups(),
          api.getAllTeachers()
        ]);
        setAllGroups(groups);
        setTeachers(teachers);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };
    
    loadData();
  }, []);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length > 0) {
      setIsLoading(true);
      try {
        // Поиск среди групп
        const matchedGroups = allGroups
          .filter(group => group.number.toLowerCase().includes(value.toLowerCase()))
          .map(group => ({
            id: group.id,
            name: group.number,
            type: 'group' as const,
            faculty: group.facultyId // В реальном приложении нужно будет получить название факультета
          }));

        // Поиск среди преподавателей
        const matchedTeachers = allTeachers
          .filter(teacher => teacher.name.toLowerCase().includes(value.toLowerCase()))
          .map(teacher => ({
            id: teacher.id,
            name: teacher.name,
            type: 'teacher' as const,
            faculty: teacher.facultyId // В реальном приложении нужно будет получить название факультета
          }));

        const combinedResults = [...matchedGroups, ...matchedTeachers];
        setResults(combinedResults);
        setIsOpen(true);
      } catch (error) {
        console.error('Ошибка поиска:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.name);
    setIsOpen(false);
    onSelect(result);
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Поиск группы или преподавателя..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-12 text-lg bg-card shadow-soft border-0 focus:ring-2 focus:ring-primary"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border rounded-lg shadow-medium z-50 max-h-80 overflow-auto">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 border-b last:border-b-0"
            >
              <div className="flex-shrink-0">
                {result.type === 'group' ? (
                  <Users className="h-5 w-5 text-primary" />
                ) : (
                  <GraduationCap className="h-5 w-5 text-accent" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{result.name}</div>
                {result.faculty && (
                  <div className="text-sm text-muted-foreground">Факультет: {result.faculty}</div>
                )}
              </div>
              <Badge variant={result.type === 'group' ? 'default' : 'secondary'}>
                {result.type === 'group' ? 'Группа' : 'Преподаватель'}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {isOpen && !isLoading && results.length === 0 && query.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border rounded-lg shadow-medium z-50">
          <div className="px-4 py-3 text-center text-muted-foreground">
            Ничего не найдено
          </div>
        </div>
      )}
    </div>
  );
}