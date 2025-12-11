import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, X, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Group } from "@/types/schedule";

interface Subgroup {
  id: number;
  number: string;
  groupDto?: { number: string; id?: number };
  size?: number;
}

interface EditSubgroupModalProps {
  subgroup: Subgroup | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isNew?: boolean;
}

export function EditSubgroupModal({ subgroup, isOpen, onClose, onSave, isNew = false }: EditSubgroupModalProps) {
  const [editedSubgroup, setEditedSubgroup] = useState<Subgroup | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Обновляем состояние при изменении subgroup
  useEffect(() => {
    if (subgroup) {
      setEditedSubgroup({ ...subgroup });
      setError(null);
    } else if (isNew) {
      setEditedSubgroup({
        id: 0,
        number: '',
        groupDto: { number: '' },
        size: 0
      });
      setError(null);
    }
  }, [subgroup, isNew]);

  // Загружаем группы при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    try {
      const groupsData = await api.getAllGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error('Ошибка загрузки групп:', error);
      setError('Не удалось загрузить список групп');
    }
  };

  const handleSave = async () => {
    if (!editedSubgroup) return;
    
    // Валидация
    if (!editedSubgroup.number || !editedSubgroup.groupDto?.number) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isNew) {
        await api.createSubgroup(
          editedSubgroup.groupDto.number,
          editedSubgroup.number,
          editedSubgroup.size || 0
        );
      } else {
        await api.updateSubgroup(
          editedSubgroup.id,
          editedSubgroup.groupDto.number,
          editedSubgroup.number,
          editedSubgroup.size || 0
        );
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error('Ошибка сохранения подгруппы:', err);
      setError(err instanceof Error ? err.message : 'Ошибка сохранения подгруппы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof Subgroup, value: any) => {
    if (editedSubgroup) {
      if (field === 'groupDto') {
        setEditedSubgroup({ ...editedSubgroup, groupDto: { number: value } });
      } else {
        setEditedSubgroup({ ...editedSubgroup, [field]: value });
      }
    }
  };

  if (!editedSubgroup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-4 sm:mx-auto w-[calc(100vw-2rem)] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-primary" />
            {isNew ? 'Создание новой подгруппы' : 'Редактирование подгруппы'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isNew ? 'Форма для создания новой подгруппы' : 'Форма для редактирования существующей подгруппы'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="group">Группа *</Label>
              <Select
                value={editedSubgroup.groupDto?.number || ''}
                onValueChange={(value) => handleFieldChange('groupDto', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.number}>
                      {group.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Номер подгруппы *</Label>
              <Input
                id="number"
                value={editedSubgroup.number}
                onChange={(e) => handleFieldChange('number', e.target.value)}
                placeholder="Например: 101.1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Количество студентов</Label>
            <Input
              id="size"
              type="number"
              value={editedSubgroup.size || 0}
              onChange={(e) => handleFieldChange('size', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

