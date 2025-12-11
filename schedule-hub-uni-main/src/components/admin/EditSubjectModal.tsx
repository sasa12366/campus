import { useState, useEffect } from "react";
import { Subject } from "@/types/schedule";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Save, X, BookOpen, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface EditSubjectModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (subject: Subject) => void;
  isNew?: boolean;
}

export function EditSubjectModal({ subject, isOpen, onClose, onSave, isNew = false }: EditSubjectModalProps) {
  const [editedSubject, setEditedSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Обновляем состояние при изменении subject
  useEffect(() => {
    if (subject) {
      setEditedSubject({ ...subject });
      setError(null);
    } else if (isNew) {
      setEditedSubject({
        id: '',
        name: '',
        type: '(Л)'
      });
      setError(null);
    }
  }, [subject, isNew]);

  const handleSave = async () => {
    if (!editedSubject) return;
    
    // Валидация
    if (!editedSubject.name || !editedSubject.type) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Сохранение предмета:', editedSubject);
      
      let savedSubject: Subject;
      
      if (isNew) {
        // Создание нового предмета через API
        const response = await fetch('/api/v1/subject', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editedSubject.name,
            type: editedSubject.type
          }),
        });
        
        if (!response.ok) throw new Error('Ошибка создания предмета');
        const data = await response.json();
        savedSubject = {
          id: data.id.toString(),
          name: data.name,
          type: data.type
        };
      } else {
        // Обновление существующего предмета
        const params = new URLSearchParams({
          name: editedSubject.name,
          type: editedSubject.type
        });

        const response = await fetch(`/api/v1/subject/${editedSubject.id}?${params}`, {
          method: 'PUT',
        });
        
        if (!response.ok) throw new Error('Ошибка обновления предмета');
        const data = await response.json();
        savedSubject = {
          id: data.id.toString(),
          name: data.name,
          type: data.type
        };
      }
      
      console.log('Предмет успешно сохранен:', savedSubject);
      onSave(savedSubject);
      onClose();
    } catch (err) {
      console.error('Ошибка сохранения предмета:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении предмета');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof Subject, value: string) => {
    if (editedSubject) {
      setEditedSubject({ ...editedSubject, [field]: value });
    }
  };

  const handleClose = () => {
    setEditedSubject(null);
    setError(null);
    onClose();
  };

  if (!editedSubject) return null;

  const getTypeColor = (type: string) => {
    const cleanType = type.replace(/[()]/g, '');
    switch (cleanType) {
      case 'Л': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ПР': return 'bg-green-100 text-green-800 border-green-200';
      case 'ЛАБ': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl mx-4 sm:mx-auto w-[calc(100vw-2rem)] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-primary" />
            {isNew ? 'Создание нового предмета' : 'Редактирование предмета'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {isNew ? 'Новый предмет будет добавлен в базу данных' : 'Изменения будут сохранены в базе данных'}
            </AlertDescription>
          </Alert>

          {/* Subject Name and Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name">Название предмета *</Label>
              <Input
                id="name"
                value={editedSubject.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Математический анализ"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Тип занятия *</Label>
              <Select 
                value={editedSubject.type} 
                onValueChange={(value) => handleFieldChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="(Л)">Лекция</SelectItem>
                  <SelectItem value="(ПР)">Практика</SelectItem>
                  <SelectItem value="(ЛАБ)">Лабораторная</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">Предварительный просмотр:</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{editedSubject.name}</span>
                <Badge className={getTypeColor(editedSubject.type)}>
                  {editedSubject.type.replace(/[()]/g, '')}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Тип: {editedSubject.type}
              </div>
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