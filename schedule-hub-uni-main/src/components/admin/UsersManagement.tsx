import { useState, useEffect } from 'react';
import { User, UserRole, Faculty, CreateAdminRequest } from '@/types/schedule';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { UserPlus, Pencil } from 'lucide-react';

interface UsersManagementProps {
  users: User[];
  onUpdate: () => void;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

export function UsersManagement({ users, onUpdate, isSuperAdmin, isAdmin }: UsersManagementProps) {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Форма редактирования
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | undefined>();
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editMiddleName, setEditMiddleName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGroupNumber, setEditGroupNumber] = useState('');
  const [editSubgroupNumber, setEditSubgroupNumber] = useState('');
  
  // Форма создания админа
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminFirstName, setNewAdminFirstName] = useState('');
  const [newAdminLastName, setNewAdminLastName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [newAdminFacultyId, setNewAdminFacultyId] = useState<number | undefined>();

  useEffect(() => {
    loadFaculties();
  }, []);

  const loadFaculties = async () => {
    try {
      const data = await api.getAllFaculties();
      setFaculties(data);
    } catch (error) {
      console.error('Ошибка загрузки факультетов:', error);
      toast.error('Не удалось загрузить список факультетов');
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role || 'STUDENT');
    setSelectedFacultyId(user.facultyId);
    setEditFirstName(user.firstName || '');
    setEditLastName(user.lastName || '');
    setEditMiddleName(user.middleName || '');
    setEditEmail(user.email || '');
    setEditGroupNumber(user.groupNumber || '');
    setEditSubgroupNumber(user.subgroupNumber || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await api.updateUser(editingUser.id, {
        ...editingUser,
        firstName: editFirstName,
        lastName: editLastName,
        middleName: editMiddleName,
        email: editEmail,
        role: selectedRole,
        facultyId: selectedFacultyId,
        groupNumber: editGroupNumber,
        subgroupNumber: editSubgroupNumber,
      });
      toast.success('Пользователь обновлён');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      onUpdate();
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      toast.error('Не удалось обновить пользователя');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Удалить пользователя ${user.email}?`)) return;
    try {
      await api.deleteUser(user.id);
      toast.success('Пользователь удалён');
      onUpdate();
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      toast.error('Не удалось удалить пользователя');
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword || !newAdminFirstName || !newAdminLastName) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (newAdminRole === 'ADMIN' && !newAdminFacultyId) {
      toast.error('Для роли ADMIN необходимо указать факультет');
      return;
    }

    try {
      const adminData: CreateAdminRequest = {
        email: newAdminEmail,
        password: newAdminPassword,
        firstName: newAdminFirstName,
        lastName: newAdminLastName,
        role: newAdminRole,
        facultyId: newAdminRole === 'ADMIN' ? newAdminFacultyId : undefined,
      };
      
      await api.createAdmin(adminData);
      
      toast.success('Администратор создан');
      setIsCreateDialogOpen(false);
      
      // Очистка формы
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminFirstName('');
      setNewAdminLastName('');
      setNewAdminRole('ADMIN');
      setNewAdminFacultyId(undefined);
      
      onUpdate();
    } catch (error) {
      console.error('Ошибка создания администратора:', error);
      toast.error('Не удалось создать администратора');
    }
  };

  const getRoleLabel = (role: UserRole | undefined) => {
    if (!role) return 'Не указана';
    const labels: Record<UserRole, string> = {
      STUDENT: 'Студент',
      MONITOR: 'Монитор',
      TEACHER: 'Преподаватель',
      ADMIN: 'Администратор',
      SUPER_ADMIN: 'Супер-администратор',
    };
    return labels[role];
  };

  const getFacultyName = (facultyId: number | undefined) => {
    if (!facultyId) return 'Не указан';
    const faculty = faculties.find(f => f.id === facultyId);
    return faculty?.facultyName || 'Не найден';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Управление пользователями</h3>
        {isSuperAdmin && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Создать администратора
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать администратора</DialogTitle>
                <DialogDescription>
                  Заполните данные для создания нового администратора
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя *</Label>
                  <Input
                    id="firstName"
                    value={newAdminFirstName}
                    onChange={(e) => setNewAdminFirstName(e.target.value)}
                    placeholder="Иван"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия *</Label>
                  <Input
                    id="lastName"
                    value={newAdminLastName}
                    onChange={(e) => setNewAdminLastName(e.target.value)}
                    placeholder="Иванов"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Роль *</Label>
                  <Select value={newAdminRole} onValueChange={(value: 'ADMIN' | 'SUPER_ADMIN') => setNewAdminRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Администратор факультета</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Супер-администратор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newAdminRole === 'ADMIN' && (
                  <div className="space-y-2">
                    <Label htmlFor="faculty">Факультет *</Label>
                    <Select 
                      value={newAdminFacultyId?.toString() || ''} 
                      onValueChange={(value) => setNewAdminFacultyId(value ? Number(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите факультет" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((faculty) => (
                          <SelectItem key={faculty.id} value={faculty.id.toString()}>
                            {faculty.facultyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleCreateAdmin}>Создать</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Имя</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Роль</th>
                {!isSuperAdmin && <th className="text-left p-3 font-medium">Факультет</th>}
                {isSuperAdmin && <th className="text-left p-3 font-medium">Группа</th>}
                <th className="text-right p-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    {user.lastName} {user.firstName} {user.middleName}
                  </td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{getRoleLabel(user.role)}</td>
                  {!isSuperAdmin && (
                    <td className="p-3">{getFacultyName(user.facultyId)}</td>
                  )}
                  {isSuperAdmin && (
                    <td className="p-3">{user.groupNumber || '—'}</td>
                  )}
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(user)}
                        title="Редактировать"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeleteUser(user)}
                        title="Удалить"
                      >
                        ×
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>
              {editingUser && `${editingUser.lastName} ${editingUser.firstName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">Фамилия</Label>
                <Input id="edit-last-name" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">Имя</Label>
                <Input id="edit-first-name" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-middle-name">Отчество</Label>
                <Input id="edit-middle-name" value={editMiddleName} onChange={(e) => setEditMiddleName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-group">Группа</Label>
                <Input id="edit-group" value={editGroupNumber} onChange={(e) => setEditGroupNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subgroup">Подгруппа</Label>
                <Input id="edit-subgroup" value={editSubgroupNumber} onChange={(e) => setEditSubgroupNumber(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Роль</Label>
              <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Студент</SelectItem>
                  <SelectItem value="MONITOR">Монитор</SelectItem>
                  <SelectItem value="TEACHER">Преподаватель</SelectItem>
                  <SelectItem value="ADMIN">Администратор</SelectItem>
                  {isSuperAdmin && <SelectItem value="SUPER_ADMIN">Супер-администратор</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {(selectedRole === 'ADMIN' || selectedRole === 'TEACHER' || isSuperAdmin) && (
              <div className="space-y-2">
                <Label htmlFor="edit-faculty">Факультет</Label>
                <Select 
                  value={selectedFacultyId?.toString() ?? 'none'} 
                  onValueChange={(value) => setSelectedFacultyId(value === 'none' ? undefined : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите факультет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не указан</SelectItem>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id.toString()}>
                        {faculty.facultyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateUser}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

