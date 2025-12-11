import { useState, useEffect } from "react";
import { Group, Faculty } from "@/types/schedule";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, X, Users, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface EditGroupModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: Group) => void;
  isNew?: boolean;
}

export function EditGroupModal({ group, isOpen, onClose, onSave, isNew = false }: EditGroupModalProps) {
  const [editedGroup, setEditedGroup] = useState<Group | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [isSubgroupLoading, setIsSubgroupLoading] = useState(false);
  const [newSubNumber, setNewSubNumber] = useState('');

  // Обновляем состояние при изменении group
  useEffect(() => {
    if (group) {
      setEditedGroup({ ...group });
      setError(null);
      if (group.number) {
        loadSubgroups(group.number);
      }
    } else if (isNew) {
      setEditedGroup({
        id: '',
        number: '',
        direction: '',
        profile: '',
        facultyId: ''
      });
      setError(null);
      setSubgroups([]);
    }
  }, [group, isNew]);

  // Загружаем факультеты при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      loadFaculties();
    }
  }, [isOpen]);

  const loadSubgroups = async (groupNumber: string) => {
    setIsSubgroupLoading(true);
    try {
      const data = await api.getSubgroupsByGroupNumber(groupNumber);
      setSubgroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки подгрупп:', err);
      setSubgroups([]);
    } finally {
      setIsSubgroupLoading(false);
    }
  };

  const loadFaculties = async () => {
    try {
      const facultiesData = await api.getAllFaculties();
      setFaculties(facultiesData);
    } catch (error) {
      console.error('Ошибка загрузки факультетов:', error);
      setError('Не удалось загрузить список факультетов');
    }
  };

  const handleSave = async () => {
    if (!editedGroup) return;
    
    // Валидация
    if (!editedGroup.number || !editedGroup.direction || !editedGroup.facultyId) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Сохранение группы:', editedGroup);
      
      let savedGroup: Group;
      
      if (isNew) {
        // Создание новой группы через API
        const response = await fetch('/api/v1/batches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: editedGroup.number,
            direction: editedGroup.direction,
            profile: editedGroup.profile,
            facultyId: parseInt(editedGroup.facultyId)
          }),
        });
        
        if (!response.ok) throw new Error('Ошибка создания группы');
        const data = await response.json();
        savedGroup = {
          id: data.id.toString(),
          number: data.number,
          direction: data.direction,
          profile: data.profile,
          facultyId: data.faculty?.id?.toString() || editedGroup.facultyId
        };
      } else {
        // Обновление существующей группы
        const params = new URLSearchParams({
          number: editedGroup.number,
          direction: editedGroup.direction,
          profile: editedGroup.profile,
          facultyId: editedGroup.facultyId.toString()
        });

        const response = await fetch(`/api/v1/batches/${editedGroup.id}?${params}`, {
          method: 'PUT',
        });
        
        if (!response.ok) throw new Error('Ошибка обновления группы');
        const data = await response.json();
        savedGroup = {
          id: data.id.toString(),
          number: data.number,
          direction: data.direction,
          profile: data.profile,
          facultyId: data.faculty?.id?.toString() || editedGroup.facultyId
        };
      }
      
      console.log('Группа успешно сохранена:', savedGroup);
      onSave(savedGroup);
      onClose();
    } catch (err) {
      console.error('Ошибка сохранения группы:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении группы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubgroup = async () => {
    if (!editedGroup?.number) {
      setError('Сначала укажите номер группы и сохраните её, затем добавляйте подгруппы');
      return;
    }
    if (!newSubNumber) {
      setError('Номер подгруппы обязателен');
      return;
    }
    try {
      await api.createSubgroup(editedGroup.number, newSubNumber);
      await loadSubgroups(editedGroup.number);
      setNewSubNumber('');
      setError(null);
    } catch (err) {
      console.error('Ошибка добавления подгруппы:', err);
      setError('Не удалось добавить подгруппу');
    }
  };

  const handleUpdateSubgroup = async (id: number, number: string) => {
    if (!editedGroup?.number) return;
    try {
      await api.updateSubgroup(id, editedGroup.number, number);
      await loadSubgroups(editedGroup.number);
    } catch (err) {
      console.error('Ошибка обновления подгруппы:', err);
      setError('Не удалось обновить подгруппу');
    }
  };

  const handleDeleteSubgroup = async (id: number) => {
    if (!editedGroup?.number) return;
    if (!confirm('Удалить подгруппу?')) return;
    try {
      await api.deleteSubgroup(id);
      await loadSubgroups(editedGroup.number);
    } catch (err) {
      console.error('Ошибка удаления подгруппы:', err);
      setError('Не удалось удалить подгруппу');
    }
  };

  const handleFieldChange = (field: keyof Group, value: string) => {
    if (editedGroup) {
      setEditedGroup({ ...editedGroup, [field]: value });
    }
  };

  const handleClose = () => {
    setEditedGroup(null);
    setError(null);
    onClose();
  };

  if (!editedGroup) return null;

  const selectedFaculty = faculties.find(f => f.id?.toString() === editedGroup.facultyId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl mx-4 sm:mx-auto w-[calc(100vw-2rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-primary" />
            {isNew ? 'Создание новой группы' : 'Редактирование группы'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Форма управления данными учебной группы
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {isNew ? 'Новая группа будет добавлена в базу данных' : 'Изменения будут сохранены в базе данных'}
            </AlertDescription>
          </Alert>

          {/* Group Number and Direction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Номер группы *</Label>
              <Input
                id="number"
                value={editedGroup.number}
                onChange={(e) => handleFieldChange('number', e.target.value)}
                placeholder="121"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty">Факультет *</Label>
              <Select 
                value={editedGroup.facultyId?.toString() ?? ''}
                onValueChange={(value) => handleFieldChange('facultyId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите факультет" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id.toString()}>
                      {faculty.abbreviation} - {faculty.facultyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Direction */}
          <div className="space-y-2">
            <Label htmlFor="direction">Направление подготовки *</Label>
            <Input
              id="direction"
              value={editedGroup.direction}
              onChange={(e) => handleFieldChange('direction', e.target.value)}
              placeholder="11.03.04 Электроника и наноэлектроника"
              required
            />
          </div>

          {/* Profile */}
          <div className="space-y-2">
            <Label htmlFor="profile">Профиль</Label>
            <Input
              id="profile"
              value={editedGroup.profile}
              onChange={(e) => handleFieldChange('profile', e.target.value)}
              placeholder="Технологии в наноэлектронике"
            />
          </div>

          {/* Subgroups management */}
          <div className="space-y-3 border rounded-md p-3 bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Подгруппы</h4>
                <p className="text-sm text-muted-foreground">
                  Добавляйте и редактируйте подгруппы для выбранной группы
                </p>
              </div>
              {isSubgroupLoading && <span className="text-xs text-muted-foreground">Загрузка...</span>}
            </div>

            {subgroups.length > 0 ? (
              <div className="space-y-2">
                {subgroups.map((sub) => (
                  <div key={sub.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                    <Input
                      value={sub.number}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSubgroups((prev) => prev.map((s) => s.id === sub.id ? { ...s, number: value } : s));
                      }}
                    />
                    <div className="flex gap-2 md:col-span-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateSubgroup(sub.id, sub.number)}
                      >
                        Сохранить
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSubgroup(sub.id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Пока нет подгрупп</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <Input
                placeholder="Номер подгруппы (например, 121-1)"
                value={newSubNumber}
                onChange={(e) => setNewSubNumber(e.target.value)}
              />
              <div className="md:col-span-2 flex justify-end">
                <Button size="sm" onClick={handleAddSubgroup} disabled={isNew}>
                  Добавить подгруппу
                </Button>
              </div>
            </div>
            {isNew && (
              <p className="text-xs text-muted-foreground">
                Сначала создайте группу, затем добавьте подгруппы.
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">Предварительный просмотр:</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Группа {editedGroup.number}</span>
                {selectedFaculty && (
                  <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                    {selectedFaculty.abbreviation}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {editedGroup.direction}
              </div>
              {editedGroup.profile && (
                <div className="text-sm">
                  Профиль: {editedGroup.profile}
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="gap-2">
            <X className="h-4 w-4" />
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isNew ? 'Создать' : 'Сохранить'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 