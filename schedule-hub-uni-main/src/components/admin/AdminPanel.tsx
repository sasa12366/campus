import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUpload } from "./FileUpload";
import { EditGroupModal } from "./EditGroupModal";
import { EditSubgroupModal } from "./EditSubgroupModal";
import { EditTeacherModal } from "./EditTeacherModal";
import { EditSubjectModal } from "./EditSubjectModal";
import { EditScheduleModal } from "./EditScheduleModal";
import { UsersManagement } from "./UsersManagement";
import { api } from "@/lib/api";
import { Group, Teacher, Subject, Faculty, ScheduleItem, User } from "@/types/schedule";
import { useUser } from "@/contexts/UserContext";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Upload,
  Plus,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  Calendar,
  UserCog
} from "lucide-react";

export function AdminPanel() {
  const { currentUser, isAdmin, isSuperAdmin } = useUser();
  const [activeTab, setActiveTab] = useState('upload');
  const [groups, setGroups] = useState<Group[]>([]);
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Состояния модальных окон
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editingSubgroup, setEditingSubgroup] = useState<any | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSubgroupModal, setShowSubgroupModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadAllData();
  }, []);

  // Автоматическое скрытие сообщений через 5 секунд
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [groupsData, subgroupsData, teachersData, subjectsData, facultiesData, schedulesData] = await Promise.all([
        api.getAllGroups(),
        api.getAllSubgroups(),
        api.getAllTeachers(),
        api.getAllSubjects(),
        api.getAllFaculties(),
        api.getAllSchedules()
      ]);
      
      setGroups(groupsData);
      setSubgroups(subgroupsData);
      setTeachers(teachersData);
      setSubjects(subjectsData);
      setFaculties(facultiesData);
      setSchedules(schedulesData);
      
      // Если админ, загружаем также список пользователей; 403 игнорируем
      if (isAdmin) {
        try {
          const usersData = await api.getAllUsers();
          setUsers(usersData);
        } catch (err) {
          const isForbidden = (err as any)?.status === 403 || (err instanceof Error && err.message?.includes('403'));
          if (isForbidden) {
            console.warn('getAllUsers: 403 Forbidden, пропускаем загрузку списка пользователей');
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError('Не удалось загрузить данные. Проверьте подключение к серверу.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFacultyName = (facultyId: number | string) => {
    const idStr = facultyId?.toString();
    const faculty = faculties.find(f => f.id?.toString() === idStr);
    return faculty ? (faculty.abbreviation || faculty.facultyName || 'Неизвестно') : 'Неизвестно';
  };

  const getFullPosition = (post: string) => {
    const positionMap: Record<string, string> = {
      'доц': 'Доцент',
      'проф': 'Профессор',
      'ст.пр': 'Старший преподаватель',
      'ст. пр': 'Старший преподаватель',
      'преп': 'Преподаватель',
      'асс': 'Ассистент',
      'зав.каф': 'Заведующий кафедрой',
      'зав. каф': 'Заведующий кафедрой',
    };
    
    const normalized = post?.toLowerCase().trim();
    return positionMap[normalized] || post;
  };

  // Фильтрация данных по факультету (только для обычных админов)
  const getFilteredGroups = () => {
    if (isSuperAdmin || !currentUser?.facultyId) {
      return groups;
    }
    return groups.filter(g => g.facultyId === currentUser.facultyId.toString());
  };

  const getFilteredSubgroups = () => {
    if (isSuperAdmin || !currentUser?.facultyId) {
      return subgroups;
    }
    const facultyGroupNumbers = getFilteredGroups().map(g => g.number);
    return subgroups.filter(sg => 
      sg.groupDto && facultyGroupNumbers.includes(sg.groupDto.number)
    );
  };

  const getFilteredTeachers = () => {
    if (isSuperAdmin || !currentUser?.facultyId) {
      return teachers;
    }
    return teachers.filter(t => t.facultyId === currentUser.facultyId.toString());
  };

  const getFilteredSchedules = () => {
    if (isSuperAdmin || !currentUser?.facultyId) {
      return schedules;
    }
    // Фильтруем расписание по группам факультета
    const facultyGroupNumbers = getFilteredGroups().map(g => g.number);
    return schedules.filter(s => s.subgroup && facultyGroupNumbers.some(gn => s.subgroup?.startsWith(gn)));
  };

  const renderTable = (
    data: any[], 
    columns: { key: string; label: string; render?: (item: any) => React.ReactNode }[], 
    title: string,
    icon: React.ReactNode,
    onAdd?: () => void,
    onEdit?: (item: any) => void,
    onDelete?: (item: any) => void
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle>{title}</CardTitle>
          <span className="text-sm text-muted-foreground">({data.length})</span>
        </div>
        <div className="flex gap-1 md:gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAllData}
            disabled={isLoading}
            className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3"
          >
            <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Обновить</span>
          </Button>
          {onAdd && (
            <Button size="sm" onClick={onAdd} className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Добавить</span>
              <span className="sm:hidden">+</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Загрузка данных...</span>
          </div>
        ) : data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {columns.map((col) => (
                    <th key={col.key} className="text-left p-1 md:p-2 font-medium text-muted-foreground text-xs md:text-sm">
                      {col.label}
                    </th>
                  ))}
                  <th className="text-right p-1 md:p-2 font-medium text-muted-foreground text-xs md:text-sm">Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    {columns.map((col) => (
                      <td key={col.key} className="p-1 md:p-2 text-xs md:text-sm">
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                                         <td className="p-1 md:p-2 text-right">
                       <div className="flex justify-end gap-1">
                         {onEdit && (
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => onEdit(item)}
                             className="hover:bg-blue-100 p-1 md:p-2"
                             title="Редактировать"
                           >
                             <Edit className="h-3 w-3" />
                           </Button>
                         )}
                         {onDelete && (
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => onDelete(item)}
                             className="text-destructive hover:text-destructive hover:bg-red-100 p-1 md:p-2"
                             title="Удалить"
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                         )}
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Нет данных для отображения</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const handleAddGroup = () => {
    setEditingGroup(null);
    setIsNewRecord(true);
    setShowGroupModal(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setIsNewRecord(false);
    setShowGroupModal(true);
  };

  const handleSaveGroup = (savedGroup: Group) => {
    if (isNewRecord) {
      setGroups(prev => [...prev, savedGroup]);
      setSuccessMessage(`Группа ${savedGroup.number} успешно создана`);
    } else {
      setGroups(prev => prev.map(g => g.id === savedGroup.id ? savedGroup : g));
      setSuccessMessage(`Группа ${savedGroup.number} успешно обновлена`);
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    if (confirm(`Удалить группу ${group.number}?`)) {
      try {
        await api.deleteGroup(group.id);
        console.log('Группа успешно удалена:', group.number);
        // Обновляем список групп
        setGroups(prev => prev.filter(g => g.id !== group.id));
        setSuccessMessage(`Группа ${group.number} успешно удалена`);
      } catch (error) {
        console.error('Ошибка удаления группы:', error);
        setError('Не удалось удалить группу. Возможно, она используется в расписании.');
      }
    }
  };

  const handleAddSubgroup = () => {
    setEditingSubgroup(null);
    setIsNewRecord(true);
    setShowSubgroupModal(true);
  };

  const handleEditSubgroup = (subgroup: any) => {
    setEditingSubgroup(subgroup);
    setIsNewRecord(false);
    setShowSubgroupModal(true);
  };

  const handleSaveSubgroup = async () => {
    await loadAllData();
    setSuccessMessage('Подгруппа успешно сохранена');
  };

  const handleDeleteSubgroup = async (subgroup: any) => {
    if (confirm(`Удалить подгруппу ${subgroup.number}?`)) {
      try {
        await api.deleteSubgroup(subgroup.id);
        setSubgroups(prev => prev.filter(s => s.id !== subgroup.id));
        setSuccessMessage(`Подгруппа ${subgroup.number} успешно удалена`);
      } catch (error) {
        console.error('Ошибка удаления подгруппы:', error);
        setError('Не удалось удалить подгруппу. Возможно, она используется в расписании.');
      }
    }
  };

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setIsNewRecord(true);
    setShowTeacherModal(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsNewRecord(false);
    setShowTeacherModal(true);
  };

  const handleSaveTeacher = (savedTeacher: Teacher) => {
    if (isNewRecord) {
      setTeachers(prev => [...prev, savedTeacher]);
      setSuccessMessage(`Преподаватель ${savedTeacher.name} успешно создан`);
    } else {
      setTeachers(prev => prev.map(t => t.id === savedTeacher.id ? savedTeacher : t));
      setSuccessMessage(`Преподаватель ${savedTeacher.name} успешно обновлен`);
    }
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (confirm(`Удалить преподавателя ${teacher.name}?`)) {
      try {
        await api.deleteTeacher(teacher.id);
        console.log('Преподаватель успешно удален:', teacher.name);
        // Обновляем список преподавателей
        setTeachers(prev => prev.filter(t => t.id !== teacher.id));
        setSuccessMessage(`Преподаватель ${teacher.name} успешно удален`);
      } catch (error) {
        console.error('Ошибка удаления преподавателя:', error);
        setError('Не удалось удалить преподавателя. Возможно, он используется в расписании.');
      }
    }
  };

  const handleAddSubject = () => {
    setEditingSubject(null);
    setIsNewRecord(true);
    setShowSubjectModal(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setIsNewRecord(false);
    setShowSubjectModal(true);
  };

  const handleSaveSubject = (savedSubject: Subject) => {
    if (isNewRecord) {
      setSubjects(prev => [...prev, savedSubject]);
      setSuccessMessage(`Предмет ${savedSubject.name} успешно создан`);
    } else {
      setSubjects(prev => prev.map(s => s.id === savedSubject.id ? savedSubject : s));
      setSuccessMessage(`Предмет ${savedSubject.name} успешно обновлен`);
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (confirm(`Удалить дисциплину ${subject.name}?`)) {
      try {
        await api.deleteSubject(subject.id);
        console.log('Дисциплина успешно удалена:', subject.name);
        // Обновляем список дисциплин
        setSubjects(prev => prev.filter(s => s.id !== subject.id));
        setSuccessMessage(`Дисциплина ${subject.name} успешно удалена`);
      } catch (error) {
        console.error('Ошибка удаления дисциплины:', error);
        setError('Не удалось удалить дисциплину. Возможно, она используется в расписании.');
      }
    }
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setIsNewRecord(true);
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule);
    setIsNewRecord(false);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = (savedSchedule: ScheduleItem) => {
    if (isNewRecord) {
      setSchedules(prev => [...prev, savedSchedule]);
      setSuccessMessage(`Пара по дисциплине "${savedSchedule.subject}" успешно добавлена`);
    } else {
      setSchedules(prev => prev.map(s => s.id === savedSchedule.id ? savedSchedule : s));
      setSuccessMessage(`Пара по дисциплине "${savedSchedule.subject}" успешно обновлена`);
    }
  };

  const handleDeleteSchedule = async (schedule: ScheduleItem) => {
    if (confirm(`Удалить пару "${schedule.subject}" (${schedule.dayWeek}, ${schedule.timeStart}-${schedule.timeEnd})?`)) {
      try {
        await api.deleteScheduleItem(schedule.id);
        console.log('Пара успешно удалена:', schedule.subject);
        // Обновляем список расписания
        setSchedules(prev => prev.filter(s => s.id !== schedule.id));
        setSuccessMessage(`Пара "${schedule.subject}" успешно удалена`);
      } catch (error) {
        console.error('Ошибка удаления пары:', error);
        setError('Не удалось удалить пару из расписания.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Upload className="h-6 w-6 text-primary" />
            Панель администратора
          </CardTitle>
          <p className="text-muted-foreground">
            Управление расписанием, группами, преподавателями и дисциплинами
          </p>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4 md:grid-cols-7' : 'grid-cols-3 md:grid-cols-6'}`}>
          <TabsTrigger value="upload" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Upload className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Загрузка</span>
            <span className="sm:hidden">📁</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Calendar className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Расписание</span>
            <span className="sm:hidden">📅</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Users className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Группы</span>
            <span className="sm:hidden">👥</span>
          </TabsTrigger>
          <TabsTrigger value="subgroups" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Users className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Подгруппы</span>
            <span className="sm:hidden">🧑‍🤝‍🧑</span>
          </TabsTrigger>
          <TabsTrigger value="teachers" className="gap-1 md:gap-2 text-xs md:text-sm">
            <GraduationCap className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Преподаватели</span>
            <span className="sm:hidden">🎓</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-1 md:gap-2 text-xs md:text-sm">
            <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Дисциплины</span>
            <span className="sm:hidden">📚</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="gap-1 md:gap-2 text-xs md:text-sm">
              <UserCog className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Пользователи</span>
              <span className="sm:hidden">👤</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <FileUpload />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          {renderTable(
            getFilteredSchedules(),
            [
              { 
                key: 'subject', 
                label: 'Дисциплина',
                render: (item) => (
                  <div>
                    <div className="font-medium">{item.subject}</div>
                    <div className="text-xs text-muted-foreground">{item.type}</div>
                  </div>
                )
              },
              { key: 'teacher', label: 'Преподаватель' },
              { 
                key: 'dayWeek', 
                label: 'День недели',
                render: (item) => item.dayWeek.charAt(0) + item.dayWeek.slice(1).toLowerCase()
              },
              { 
                key: 'timeStart', 
                label: 'Время',
                render: (item) => `${item.timeStart} - ${item.timeEnd}`
              },
              { key: 'classroom', label: 'Аудитория' },
              { 
                key: 'parity', 
                label: 'Периодичность',
                render: (item) => (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.parity === 'ВСЕГДА' ? 'bg-blue-100 text-blue-800' :
                    item.parity === 'ЧИСЛИТЕЛЬ' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {item.parity}
                  </span>
                )
              },
              { 
                key: 'subgroup', 
                label: 'Подгруппа',
                render: (item) => item.subgroup || '-'
              }
            ],
            'Список пар в расписании',
            <Calendar className="h-5 w-5 text-primary" />,
            handleAddSchedule,
            handleEditSchedule,
            handleDeleteSchedule
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          {renderTable(
            getFilteredGroups(),
            [
              { key: 'number', label: 'Номер группы' },
              { key: 'direction', label: 'Направление' },
              { key: 'profile', label: 'Профиль' },
              { 
                key: 'facultyId', 
                label: 'Факультет', 
                render: (item) => getFacultyName(item.facultyId)
              }
            ],
            'Список групп',
            <Users className="h-5 w-5 text-primary" />,
            handleAddGroup,
            handleEditGroup,
            handleDeleteGroup
          )}
        </TabsContent>

        <TabsContent value="subgroups" className="space-y-4">
          {renderTable(
            getFilteredSubgroups(),
            [
              { 
                key: 'number', 
                label: 'Номер подгруппы'
              },
              { 
                key: 'groupDto', 
                label: 'Группа',
                render: (item) => item.groupDto?.number || '-'
              }
            ],
            'Список подгрупп',
            <Users className="h-5 w-5 text-primary" />,
            handleAddSubgroup,
            handleEditSubgroup,
            handleDeleteSubgroup
          )}
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          {renderTable(
            getFilteredTeachers(),
            [
              { key: 'name', label: 'ФИО' },
              { 
                key: 'post', 
                label: 'Должность',
                render: (item) => getFullPosition(item.post)
              },
              { 
                key: 'facultyId', 
                label: 'Факультет', 
                render: (item) => getFacultyName(item.facultyId)
              }
            ],
            'Список преподавателей',
            <GraduationCap className="h-5 w-5 text-accent" />,
            handleAddTeacher,
            handleEditTeacher,
            handleDeleteTeacher
          )}
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          {renderTable(
            subjects,
            [
              { key: 'name', label: 'Название' },
              { 
                key: 'type', 
                label: 'Тип',
                render: (item) => (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.type.includes('Л') ? 'bg-blue-100 text-blue-800' :
                    item.type.includes('ПР') ? 'bg-green-100 text-green-800' :
                    item.type.includes('ЛАБ') ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.type}
                  </span>
                )
              }
            ],
            'Список дисциплин',
            <BookOpen className="h-5 w-5 text-success" />,
            handleAddSubject,
            handleEditSubject,
            handleDeleteSubject
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Управление пользователями
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UsersManagement users={users} onUpdate={loadAllData} isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Modals */}
      <EditGroupModal
        group={editingGroup}
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onSave={handleSaveGroup}
        isNew={isNewRecord}
      />

      <EditSubgroupModal
        subgroup={editingSubgroup}
        isOpen={showSubgroupModal}
        onClose={() => setShowSubgroupModal(false)}
        onSave={handleSaveSubgroup}
        isNew={isNewRecord}
      />

      <EditTeacherModal
        teacher={editingTeacher}
        isOpen={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        onSave={handleSaveTeacher}
        isNew={isNewRecord}
      />

      <EditSubjectModal
        subject={editingSubject}
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        onSave={handleSaveSubject}
        isNew={isNewRecord}
      />

      <EditScheduleModal
        item={editingSchedule}
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={handleSaveSchedule}
        isNew={isNewRecord}
        onOpenExisting={(conflictId) => {
          const conflictItem = schedules.find(s => s.id === conflictId);
          if (conflictItem) {
            setEditingSchedule(conflictItem);
            setIsNewRecord(false);
            setShowScheduleModal(true);
          }
        }}
        groups={getFilteredGroups()}
        subgroups={getFilteredSubgroups()}
      />
    </div>
  );
}