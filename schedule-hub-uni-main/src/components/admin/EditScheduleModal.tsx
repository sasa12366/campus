import { useState, useEffect, useRef } from "react";
import { Group, ScheduleItem } from "@/types/schedule";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeacherSelect } from "@/components/ui/teacher-select";
import { SubjectSelect } from "@/components/ui/subject-select";
import { Save, X, Clock, MapPin, User, BookOpen, Info, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface SubgroupOption {
  id: number | string;
  number: string;
  groupDto?: { number?: string; id?: number };
}

interface EditScheduleModalProps {
  item: ScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ScheduleItem) => void;
  isNew?: boolean;
  onOpenExisting?: (conflictId: string) => void;
  groups?: Group[];
  subgroups?: SubgroupOption[];
}

export function EditScheduleModal({ item, isOpen, onClose, onSave, isNew = false, onOpenExisting, groups = [], subgroups = [] }: EditScheduleModalProps) {
  const [editedItem, setEditedItem] = useState<ScheduleItem | null>(null);
  const [fetchedGroups, setFetchedGroups] = useState<Group[]>([]);
  const [fetchedSubgroups, setFetchedSubgroups] = useState<SubgroupOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [conflictInfo, setConflictInfo] = useState<any | null>(null);
  const [draftItem, setDraftItem] = useState<ScheduleItem | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const initSelectionRef = useRef<boolean>(false);

  const effectiveGroups = groups?.length ? groups : fetchedGroups;
  const effectiveSubgroups = subgroups?.length ? subgroups : fetchedSubgroups;

  // Если пришли пустые списки (например, при открытии из публичной страницы), загружаем сами
  useEffect(() => {
    const needLoadGroups = !groups?.length;
    const needLoadSubgroups = !subgroups?.length;
    if (!isOpen || (!needLoadGroups && !needLoadSubgroups)) return;

    const load = async () => {
      try {
        const [loadedGroups, loadedSubgroups] = await Promise.all([
          needLoadGroups ? api.getAllGroups() : Promise.resolve(groups || []),
          needLoadSubgroups ? api.getAllSubgroups() : Promise.resolve(subgroups || [])
        ]);
        if (needLoadGroups) setFetchedGroups(loadedGroups);
        if (needLoadSubgroups) setFetchedSubgroups(loadedSubgroups);
      } catch (e) {
        console.error('Ошибка загрузки групп/подгрупп для модалки расписания:', e);
      }
    };

    load();
  }, [isOpen, groups, subgroups]);

  // Обновляем состояние при изменении item
  useEffect(() => {
    // Сброс и инициализация при новом item/открытии
    if (item) {
      setEditedItem({ ...item });
      setError(null);
      setConflictInfo(null);
      setDraftItem(null);
      initSelectionRef.current = false; // ждём загрузку справочников, чтобы выставить выбранные
    } else if (isNew && isOpen) {
      const defaultGroup = effectiveGroups[0]?.number || '';
      setEditedItem({
        id: '',
        subject: '',
        type: 'Л',
        teacher: '',
        classroom: '',
        timeStart: '08:00',
        timeEnd: '09:30',
        dayWeek: 'ПОНЕДЕЛЬНИК',
        parity: 'ВСЕГДА',
        subgroup: defaultGroup
      });
      setSelectedGroup(defaultGroup);
      setError(null);
      setConflictInfo(null);
      setDraftItem(null);
      initSelectionRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, isNew, isOpen]);

  // После того как справочники подгрузились, один раз восстанавливаем выбранные значения
  useEffect(() => {
    if (!editedItem || initSelectionRef.current) return;

    const fallbackGroup = effectiveGroups[0]?.number || '';
    const resolved = resolveGroupNumber(editedItem.subgroup, effectiveGroups, effectiveSubgroups) || fallbackGroup;

    if (resolved) {
      setSelectedGroup(resolved);
      // если подгруппа была пустой, подставим выбранную группу
      if (!editedItem.subgroup) {
        setEditedItem({ ...editedItem, subgroup: resolved });
      }
    }

    initSelectionRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveGroups, effectiveSubgroups, editedItem]);

  // Загружаем предметы для автоматического определения типа
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subjectsData = await api.getAllSubjects();
        setSubjects(subjectsData);
      } catch (error) {
        console.error('Ошибка загрузки предметов:', error);
      }
    };
    
    if (isOpen) {
      loadSubjects();
    }
  }, [isOpen]);

  const normalizeType = (type: string) => type.replace(/[()]/g, '') as 'Л' | 'ПР' | 'ЛАБ';

  const resolveGroupNumber = (
    subgroupValue: string | undefined,
    groupsArg: Group[] = effectiveGroups,
    subgroupsArg: SubgroupOption[] = effectiveSubgroups
  ) => {
    if (!subgroupValue) return '';
    const safeSubgroups = Array.isArray(subgroupsArg) ? subgroupsArg : [];
    const safeGroups = Array.isArray(groupsArg) ? groupsArg : [];
    const bySubgroup = safeSubgroups.find((sg) => sg.number === subgroupValue);
    if (bySubgroup?.groupDto?.number) return bySubgroup.groupDto.number;
    const exactGroup = safeGroups.find((g) => g.number === subgroupValue);
    if (exactGroup) return exactGroup.number;
    const byPrefix = safeSubgroups.find((sg) => sg.number?.startsWith(`${subgroupValue}-`));
    return byPrefix?.groupDto?.number || '';
  };

  const safeSubgroups = effectiveSubgroups || [];
  const availableSubgroups = selectedGroup
    ? safeSubgroups.filter((sg) => sg.groupDto?.number === selectedGroup)
    : [];

  const handleSave = async () => {
    if (!editedItem) return;

    if (!selectedGroup) {
      setError('Выберите группу');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setConflictInfo(null);
    
    try {
      // Дополнительная валидация перед сохранением
      if (!editedItem.subject || !editedItem.teacher || !editedItem.classroom || !editedItem.timeStart || !editedItem.timeEnd) {
        throw new Error('Пожалуйста, заполните все обязательные поля');
      }
      
      // Валидация времени
      if (editedItem.timeStart >= editedItem.timeEnd) {
        throw new Error('Время начала должно быть раньше времени окончания');
      }
      
      console.log('Сохранение изменений расписания:', editedItem);
      
      // Получаем ID для связанных сущностей
      console.log('Поиск ID для:', {
        teacher: editedItem.teacher,
        subject: editedItem.subject,
        type: editedItem.type,
        subgroup: editedItem.subgroup
      });

      const [teacherId, subjectId, subgroupId] = await Promise.all([
        api.getTeacherIdByName(editedItem.teacher),
        api.getSubjectIdByNameAndType(editedItem.subject, editedItem.type),
        api.getSubgroupIdByNumber(editedItem.subgroup || '')
      ]);

      let subgroupIds: number[] = [];

      // Если нашли точную подгруппу — используем её
      if (subgroupId) {
        subgroupIds = [subgroupId];
      } else if (editedItem.subgroup) {
        // Пробуем найти все подгруппы по номеру группы, чтобы поддержать кейс добавления пары сразу на группу
        const subgroupsByGroup = await api.getSubgroupsByGroupNumber(editedItem.subgroup);
        if (Array.isArray(subgroupsByGroup) && subgroupsByGroup.length > 0) {
          subgroupIds = subgroupsByGroup.map((s: any) => s.id).filter(Boolean);
          console.log('Используем подгруппы группы:', subgroupIds);
        }

        // Дополнительный fallback: ищем по всем подгруппам совпадение либо по номеру подгруппы, либо по номеру группы, либо по префиксу
        if (subgroupIds.length === 0) {
          const allSubgroups = await api.getAllSubgroups();
          const matched = allSubgroups.filter((s: any) => {
            const subgroupNumber = s.number?.toString();
            const groupNumber = s.groupDto?.number?.toString();
            const target = editedItem.subgroup?.toString();
            return subgroupNumber === target
              || groupNumber === target
              || subgroupNumber?.startsWith(`${target}-`);
          });
          subgroupIds = matched.map((s: any) => s.id).filter(Boolean);
          if (matched.length) {
            console.log('Fallback: нашли подгруппы через полное сканирование:', subgroupIds);
          }
        }
      }

      console.log('Найденные ID:', { teacherId, subjectId, subgroupIds });

      if (!teacherId || !subjectId || subgroupIds.length === 0) {
        throw new Error(
          `Не удалось найти связанные данные: преподаватель(${teacherId}), предмет(${subjectId}), подгруппа/группа(${subgroupIds.length ? subgroupIds.join(',') : 'null'})`
        );
      }

      // Создаем или обновляем расписание через API
      const savedItems: ScheduleItem[] = [];
      for (const sgId of subgroupIds) {
        if (isNew) {
          const { id, ...itemWithoutId } = editedItem;
          const created = await api.createScheduleItem(itemWithoutId, sgId, teacherId, subjectId);
          savedItems.push(created);
          console.log('Расписание успешно создано:', created);
        } else {
          const updated = await api.updateScheduleItem(editedItem, sgId, teacherId, subjectId);
          savedItems.push(updated);
          console.log('Расписание успешно обновлено:', updated);
        }
      }
      
      savedItems.forEach(onSave);
      onClose();
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      const conflict = (err as any)?.conflict;
      if (conflict?.conflict) {
        setConflictInfo(conflict.conflict);
        setDraftItem(editedItem);
        setError(conflict.message || 'Конфликт с существующей парой');
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка при сохранении изменений');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof ScheduleItem, value: string) => {
    if (editedItem) {
      let updatedItem = { ...editedItem, [field]: value };
      
      // Если изменяется предмет, автоматически устанавливаем тип из базы
      if (field === 'subject' && subjects.length > 0) {
        const selectedSubject = subjects.find(s => s.name === value);
        if (selectedSubject) {
          updatedItem.type = normalizeType(selectedSubject.type);
        }
      }
      
      // Валидация времени в 24-часовом формате
      if (field === 'timeStart' || field === 'timeEnd') {
        // Проверяем формат HH:MM
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (value && !timeRegex.test(value)) {
          console.warn('Неверный формат времени:', value);
          return; // Не обновляем состояние если формат неверный
        }
        
        // Дополнительная валидация: время начала должно быть раньше времени окончания
        if (field === 'timeStart' && editedItem.timeEnd) {
          if (value >= editedItem.timeEnd) {
            console.warn('Время начала должно быть раньше времени окончания');
          }
        }
        if (field === 'timeEnd' && editedItem.timeStart) {
          if (value <= editedItem.timeStart) {
            console.warn('Время окончания должно быть позже времени начала');
          }
        }
      }
      
      setEditedItem(updatedItem);
    }
  };

  const handleGroupChange = (groupNumber: string) => {
    setSelectedGroup(groupNumber);
    setEditedItem((prev) => (prev ? { ...prev, subgroup: groupNumber } : prev));
  };

  const handleSubgroupChange = (value: string) => {
    setEditedItem((prev) => (prev ? { ...prev, subgroup: value } : prev));
  };

  const handleClose = () => {
    setEditedItem(null);
    setError(null);
    onClose();
  };

  if (!editedItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto w-[calc(100vw-2rem)] sm:w-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-primary" />
            {isNew ? 'Добавление пары в расписание' : 'Редактирование расписания'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>{isNew ? 'Заполните все поля для добавления новой пары в расписание.' : 'Изменения будут сохранены в базе данных через API.'} Все поля обязательны для заполнения.</p>
                <p className="text-xs">
                  <strong>Стандартные временные слоты:</strong> 08:00-09:30, 09:40-11:10, 11:20-12:50, 13:10-14:40, 14:50-16:20, 16:30-18:00
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Subject Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Дисциплина</Label>
              <SubjectSelect
                value={editedItem.subject}
                selectedType={editedItem.type}
                onValueChange={(value) => handleFieldChange('subject', value)}
                onSubjectSelect={(subject) => {
                  setEditedItem((prev) => prev ? { ...prev, subject: subject.name, type: normalizeType(subject.type) } : prev);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Тип занятия</Label>
              <div className="h-10 px-3 py-2 border border-input bg-muted/50 rounded-md flex items-center">
                <Badge className={
                  editedItem.type === 'Л' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  editedItem.type === 'ПР' ? 'bg-green-100 text-green-800 border-green-200' :
                  editedItem.type === 'ЛАБ' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                  'bg-gray-100 text-gray-800 border-gray-200'
                }>
                  {editedItem.type}
                </Badge>
                <span className="ml-2 text-sm text-muted-foreground">
                  (автоматически)
                </span>
              </div>
            </div>
          </div>

          {/* Teacher and Classroom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Преподаватель
              </Label>
              <TeacherSelect
                value={editedItem.teacher}
                onValueChange={(value) => handleFieldChange('teacher', value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classroom" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Аудитория
              </Label>
              <Input
                id="classroom"
                value={editedItem.classroom}
                onChange={(e) => handleFieldChange('classroom', e.target.value)}
                placeholder="Номер аудитории"
              />
            </div>
          </div>

          <Separator />

          {/* Time and Day */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dayWeek">День недели</Label>
              <Select value={editedItem.dayWeek} onValueChange={(value) => handleFieldChange('dayWeek', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ПОНЕДЕЛЬНИК">Понедельник</SelectItem>
                  <SelectItem value="ВТОРНИК">Вторник</SelectItem>
                  <SelectItem value="СРЕДА">Среда</SelectItem>
                  <SelectItem value="ЧЕТВЕРГ">Четверг</SelectItem>
                  <SelectItem value="ПЯТНИЦА">Пятница</SelectItem>
                  <SelectItem value="СУББОТА">Суббота</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeStart" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Время начала
              </Label>
              <Input
                id="timeStart"
                type="time"
                value={editedItem.timeStart}
                onChange={(e) => handleFieldChange('timeStart', e.target.value)}
                step="300"
                pattern="[0-9]{2}:[0-9]{2}"
                placeholder="08:00"
                title="Формат: ЧЧ:ММ (24-часовой)"
              />
              <p className="text-xs text-muted-foreground">Формат: ЧЧ:ММ (например, 08:00)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeEnd">Время окончания</Label>
              <Input
                id="timeEnd"
                type="time"
                value={editedItem.timeEnd}
                onChange={(e) => handleFieldChange('timeEnd', e.target.value)}
                step="300"
                pattern="[0-9]{2}:[0-9]{2}"
                placeholder="09:30"
                title="Формат: ЧЧ:ММ (24-часовой)"
              />
              <p className="text-xs text-muted-foreground">Формат: ЧЧ:ММ (например, 09:30)</p>
            </div>
          </div>

          {/* Parity and Subgroup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parity">Периодичность</Label>
              <Select value={editedItem.parity} onValueChange={(value) => handleFieldChange('parity', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ВСЕГДА">Всегда</SelectItem>
                  <SelectItem value="ЧИСЛИТЕЛЬ">Числитель</SelectItem>
                  <SelectItem value="ЗНАМЕНАТЕЛЬ">Знаменатель</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-select">Группа</Label>
              <Select
                value={selectedGroup}
                onValueChange={handleGroupChange}
              >
                <SelectTrigger id="group-select">
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  {effectiveGroups.map((group) => (
                    <SelectItem key={group.id} value={group.number}>
                      {group.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subgroup">Подгруппа</Label>
              <Select
                value={editedItem.subgroup || ''}
                onValueChange={handleSubgroupChange}
                disabled={!selectedGroup}
              >
                <SelectTrigger id="subgroup">
                  <SelectValue placeholder="Выберите подгруппу или группу" />
                </SelectTrigger>
                <SelectContent>
                  {selectedGroup && (
                    <SelectItem value={selectedGroup}>
                      Вся группа ({selectedGroup})
                    </SelectItem>
                  )}
                  {availableSubgroups.map((sg) => (
                    <SelectItem key={sg.id} value={sg.number}>
                      {sg.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">Предварительный просмотр:</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{editedItem.subject}</span>
                <Badge>{editedItem.type}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {editedItem.dayWeek} • {editedItem.timeStart} - {editedItem.timeEnd} • ауд. {editedItem.classroom}
              </div>
              <div className="text-sm">
                {editedItem.teacher} • {editedItem.parity}
                {editedItem.subgroup && ` • группа ${editedItem.subgroup}`}
              </div>
            </div>
          </div>

          {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            {conflictInfo && (
              <div className="mt-2 space-y-1 text-sm">
                <div>
                  Конфликтует с: {conflictInfo.subgroupDto?.number || '—'} • {conflictInfo.dayWeek} • {conflictInfo.timeStart}-{conflictInfo.timeEnd} • {conflictInfo.subjectDto?.name} • {conflictInfo.teacherDto?.name}
                </div>
                {onOpenExisting && conflictInfo.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1"
                    onClick={() => onOpenExisting(conflictInfo.id.toString())}
                  >
                    Открыть конфликтующую пару
                  </Button>
                )}
                {draftItem && (
                  <div className="text-xs text-muted-foreground">
                    Черновик сохранён в окне — можно скорректировать и сохранить повторно.
                  </div>
                )}
              </div>
            )}
          </AlertDescription>
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
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}