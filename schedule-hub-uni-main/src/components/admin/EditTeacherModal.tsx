import { useState, useEffect } from "react";
import { Teacher, Faculty } from "@/types/schedule";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, X, GraduationCap, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface EditTeacherModalProps {
  teacher: Teacher | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacher: Teacher) => void;
  isNew?: boolean;
}

export function EditTeacherModal({ teacher, isOpen, onClose, onSave, isNew = false }: EditTeacherModalProps) {
  const [editedTeacher, setEditedTeacher] = useState<Teacher | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizePost = (post: string) => {
    const map: Record<string, string> = {
      'профессор': 'проф',
      'проф': 'проф',
      'доцент': 'доц',
      'доц': 'доц',
      'старший преподаватель': 'ст.пр',
      'ст. пр': 'ст.пр',
      'ст.пр': 'ст.пр',
      'ассистент': 'асс',
      'асс': 'асс',
      'преподаватель': 'пр',
      'преп': 'пр',
      'пр': 'пр',
    };
    const key = post?.toLowerCase().trim();
    return map[key] || post;
  };

  // Обновляем состояние при изменении teacher
  useEffect(() => {
    if (teacher) {
      setEditedTeacher({ ...teacher, post: normalizePost(teacher.post) });
      setError(null);
    } else if (isNew) {
      setEditedTeacher({
        id: '',
        name: '',
        post: '',
        facultyId: ''
      });
      setError(null);
    }
  }, [teacher, isNew]);

  // Загружаем факультеты при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      loadFaculties();
    }
  }, [isOpen]);

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
    if (!editedTeacher) return;
    
    // Валидация
    if (!editedTeacher.name || !editedTeacher.post || !editedTeacher.facultyId) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Сохранение преподавателя:', editedTeacher);
      
      let savedTeacher: Teacher;
      
      if (isNew) {
        // Создание нового преподавателя через API
        const response = await fetch('/api/v1/teacher', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editedTeacher.name,
            post: editedTeacher.post,
            facultyId: parseInt(editedTeacher.facultyId)
          }),
        });
        
        if (!response.ok) throw new Error('Ошибка создания преподавателя');
        const data = await response.json();
        savedTeacher = {
          id: data.id.toString(),
          name: data.name,
          post: data.post,
          facultyId: data.faculty?.id?.toString() || editedTeacher.facultyId
        };
      } else {
        // Обновление существующего преподавателя
        const params = new URLSearchParams({
          name: editedTeacher.name,
          post: editedTeacher.post
        });

        const response = await fetch(`/api/v1/teacher/${editedTeacher.id}?${params}`, {
          method: 'PUT',
        });
        
        if (!response.ok) throw new Error('Ошибка обновления преподавателя');
        const data = await response.json();
        savedTeacher = {
          id: data.id.toString(),
          name: data.name,
          post: data.post,
          facultyId: data.faculty?.id?.toString() || editedTeacher.facultyId
        };
      }
      
      console.log('Преподаватель успешно сохранен:', savedTeacher);
      onSave(savedTeacher);
      onClose();
    } catch (err) {
      console.error('Ошибка сохранения преподавателя:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении преподавателя');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof Teacher, value: string) => {
    if (editedTeacher) {
      setEditedTeacher({ ...editedTeacher, [field]: value });
    }
  };

  const handleClose = () => {
    setEditedTeacher(null);
    setError(null);
    onClose();
  };

  if (!editedTeacher) return null;

  const selectedFaculty = faculties.find(f => f.id?.toString() === editedTeacher.facultyId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl mx-4 sm:mx-auto w-[calc(100vw-2rem)] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="h-5 w-5 text-primary" />
            {isNew ? 'Создание нового преподавателя' : 'Редактирование преподавателя'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {isNew ? 'Новый преподаватель будет добавлен в базу данных' : 'Изменения будут сохранены в базе данных'}
            </AlertDescription>
          </Alert>

          {/* Name and Post */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">ФИО *</Label>
              <Input
                id="name"
                value={editedTeacher.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Иванов И.И."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post">Должность *</Label>
              <Select 
                value={editedTeacher.post} 
                onValueChange={(value) => handleFieldChange('post', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите должность" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="проф">Профессор</SelectItem>
                  <SelectItem value="доц">Доцент</SelectItem>
                  <SelectItem value="ст.пр">Старший преподаватель</SelectItem>
                  <SelectItem value="асс">Ассистент</SelectItem>
                  <SelectItem value="пр">Преподаватель</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Faculty */}
          <div className="space-y-2">
            <Label htmlFor="faculty">Факультет *</Label>
            <Select 
              value={editedTeacher.facultyId} 
              onValueChange={(value) => handleFieldChange('facultyId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите факультет" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id?.toString()}>
                    {faculty.abbreviation} - {faculty.facultyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">Предварительный просмотр:</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{editedTeacher.name}</span>
                <span className="text-sm bg-accent/10 text-accent px-2 py-1 rounded">
                  {editedTeacher.post}
                </span>
              </div>
              {selectedFaculty && (
                <div className="text-sm text-muted-foreground">
                  {selectedFaculty.facultyName}
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