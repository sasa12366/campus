import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { DateControls } from "@/components/DateControls";
import { ViewToggle, ViewMode } from "@/components/ViewToggle";
import { ScheduleDisplay } from "@/components/schedule/ScheduleDisplay";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { EditScheduleModal } from "@/components/admin/EditScheduleModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { SubgroupSelector } from "@/components/SubgroupSelector";
// import { ExportPDFButton } from "@/components/ExportPDFButton";
import { Logo } from "@/components/ui/logo";
import { api } from "@/lib/api";
import { ScheduleItem } from "@/types/schedule";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, Search, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";

interface IndexProps {
  initialRole?: 'student' | 'admin';
  forceAdminPanel?: boolean;
  initialEntity?: { id: string; name: string; type: 'group' | 'teacher' };
}

const Index = ({ initialRole, forceAdminPanel = false, initialEntity }: IndexProps) => {
  const { refreshUser, currentUser } = useUser();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'student' | 'admin'>('student');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  // По умолчанию используем колонки, но пользователи мобильных устройств могут переключиться на список
  const [viewMode, setViewMode] = useState<ViewMode>('columns');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem[]>([]);
  const [filteredSchedule, setFilteredSchedule] = useState<ScheduleItem[]>([]);
  const [selectedSubgroups, setSelectedSubgroups] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<{id: string; name: string; type: 'group' | 'teacher'} | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingNewItem, setIsCreatingNewItem] = useState(false);
  const [favorites, setFavorites] = useState<{id: string; name: string; type: 'group' | 'teacher'}[]>([]);
  const isFavoriteSelected = selectedEntity ? favorites.some(f => f.id === selectedEntity.id && f.type === selectedEntity.type) : false;

  const dedupeGroupSchedule = (items: ScheduleItem[], groupName: string) => {
    const map = new Map<string, ScheduleItem>();
    items.forEach(item => {
      const key = [
        item.dayWeek,
        item.timeStart,
        item.timeEnd,
        item.classroom,
        item.subject,
        item.teacher,
        item.parity
      ].join('|');
      if (!map.has(key)) {
        map.set(key, { ...item, subgroup: groupName });
      }
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    if (currentUser) {
      setIsAuthenticated(true);
      setUserRole('admin');
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialRole === 'admin') {
      setUserRole('admin');
      if (forceAdminPanel && isAuthenticated) {
        setShowAdminPanel(true);
        navigate('/admin', { replace: false });
      }
    }
  }, [initialRole, forceAdminPanel, navigate, isAuthenticated]);

  useEffect(() => {
    const saved = localStorage.getItem('cf_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  useEffect(() => {
    if (initialEntity) {
      handleEntitySelect(initialEntity, false);
    }
  }, [initialEntity]);

  const persistFavorites = (items: {id: string; name: string; type: 'group' | 'teacher'}[]) => {
    setFavorites(items);
    localStorage.setItem('cf_favorites', JSON.stringify(items));
  };

  const toggleFavorite = () => {
    if (!selectedEntity) return;
    const exists = favorites.some(f => f.id === selectedEntity.id && f.type === selectedEntity.type);
    if (exists) {
      persistFavorites(favorites.filter(f => !(f.id === selectedEntity.id && f.type === selectedEntity.type)));
    } else {
      persistFavorites([...favorites, selectedEntity]);
    }
  };

  const removeFavorite = (favId: string, type: 'group' | 'teacher') => {
    persistFavorites(favorites.filter(f => !(f.id === favId && f.type === type)));
  };

  const handleEntitySelect = async (result: {id: string; name: string; type: 'group' | 'teacher'}, shouldNavigate: boolean = true) => {
    setSelectedEntity(result);
    setIsLoading(true);
    setError(null);
    setShowAdminPanel(false);
    
    try {
      let scheduleData: ScheduleItem[] = [];
      
      if (result.type === 'group') {
        console.log('Поиск расписания для группы:', result.name);
        
        // Сначала попробуем получить все расписания для отладки
        try {
          const allSchedules = await api.getAllSchedules();
          console.log('Всего расписаний в системе:', allSchedules.length);
          console.log('Первые 3 расписания:', allSchedules.slice(0, 3));
          
          // Фильтруем по номеру группы из всех расписаний
          scheduleData = allSchedules.filter(item => 
            item.subgroup && item.subgroup.includes(result.name)
          );
          console.log('Найдено расписаний для группы', result.name, ':', scheduleData.length);
          
        } catch (allScheduleError) {
          console.error('Ошибка получения всех расписаний:', allScheduleError);
          // Если не удается получить все расписания, пробуем специфичный endpoint
          scheduleData = await api.getScheduleBySubgroup(result.name);
        }
      } else {
        console.log('Поиск расписания для преподавателя:', result.name);
        // Для преподавателей получаем все расписание и фильтруем
        const allSchedule = await api.getAllSchedules();
        scheduleData = allSchedule.filter(item => item.teacher === result.name);
        console.log('Найдено расписаний для преподавателя', result.name, ':', scheduleData.length);
      }
      
      // Храним оригинал для подгруппного просмотра
      setSelectedSchedule(scheduleData);
      // Для показа группы целиком по умолчанию убираем дубли, но храним подгруппы для фильтрации
      if (result.type === 'group') {
        setFilteredSchedule(dedupeGroupSchedule(scheduleData, result.name));
      } else {
        setFilteredSchedule(scheduleData);
      }
      setSelectedSubgroups([]); // Сбрасываем выбор подгрупп
      if (shouldNavigate) {
        navigate(`/schedule/${result.type}/${encodeURIComponent(result.name)}`);
      }
    } catch (err) {
      console.error('Ошибка загрузки расписания:', err);
      setError('Не удалось загрузить расписание. Проверьте консоль для подробностей.');
      setSelectedSchedule([]);
      setFilteredSchedule([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubgroupChange = (subgroups: string[]) => {
    setSelectedSubgroups(subgroups);
    
    if (subgroups.length === 0) {
      // Если ничего не выбрано, показываем агрегировано для группы (без дублей)
      if (selectedEntity?.type === 'group' && selectedEntity?.name) {
        setFilteredSchedule(dedupeGroupSchedule(selectedSchedule, selectedEntity.name));
      } else {
        setFilteredSchedule(selectedSchedule);
      }
    } else {
      // Фильтруем расписание по выбранным подгруппам
      const filtered = selectedSchedule.filter(item => 
        subgroups.includes(item.subgroup || '')
      );
      setFilteredSchedule(filtered);
    }
  };

  const handleItemEdit = (item: ScheduleItem) => {
    if (userRole === 'admin' && isAuthenticated) {
      setEditingItem(item);
    }
  };

  const handleItemSave = (updatedItem: ScheduleItem) => {
    if (isCreatingNewItem) {
      // Добавляем новую пару в список
      setSelectedSchedule(prev => [...prev, updatedItem]);
      setFilteredSchedule(prev => [...prev, updatedItem]);
      setIsCreatingNewItem(false);
    } else {
      // Обновляем существующую пару
      const updatedSchedule = selectedSchedule.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      );
      setSelectedSchedule(updatedSchedule);
      
      // Обновляем в отфильтрованном списке
      const updatedFiltered = filteredSchedule.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      );
      setFilteredSchedule(updatedFiltered);
    }
  };

  const handleAddNewItem = () => {
    // Создаем новую пустую пару с предзаполнением группы, если выбрана группа
    const newItem: ScheduleItem = {
      id: '',
      subject: '',
      type: 'Л',
      teacher: '',
      classroom: '',
      timeStart: '08:00',
      timeEnd: '09:30',
      dayWeek: 'ПОНЕДЕЛЬНИК',
      parity: 'ВСЕГДА',
      subgroup: selectedEntity?.type === 'group' ? selectedEntity.name : ''
    };
    setEditingItem(newItem);
    setIsCreatingNewItem(true);
  };

  const handleModalClose = () => {
    setEditingItem(null);
    setIsCreatingNewItem(false);
  };

  const handleRoleChange = (role: 'student' | 'admin') => {
    if (role === 'admin' && !isAuthenticated) {
      // Если пытается войти в админ режим без аутентификации, показываем модалку входа
      return;
    }
    
    setUserRole(role);
    
    if (role === 'admin' && isAuthenticated && !selectedEntity) {
      setShowAdminPanel(true);
      navigate('/admin');
    } else if (role === 'student') {
      setShowAdminPanel(false);
      // Сохраняем выбранную сущность при переходе в режим студента
      navigate('/');
    }
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLogin = async (token: string) => {
    setAuthToken(token);
    setIsAuthenticated(true);
    setUserRole('admin');
    setShowLoginModal(false);
    
    // Обновляем информацию о пользователе после логина
    await refreshUser();
    
    // Если нет выбранной сущности, показываем админ панель
    if (!selectedEntity) {
      setShowAdminPanel(true);
      navigate('/admin');
    }
  };

  const handleLogout = () => {
    // Очищаем токен из localStorage
    api.setAuthToken(null, null);
    
    setAuthToken(null);
    setIsAuthenticated(false);
    setUserRole('student');
    setShowAdminPanel(false);
    
    // Обновляем UserContext (теперь currentUser будет null)
    refreshUser();
  };

  const handleBackToSearch = () => {
    setSelectedEntity(null);
    setSelectedSchedule([]);
    setFilteredSchedule([]);
    setSelectedSubgroups([]);
    setShowAdminPanel(false);
    setError(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        userRole={userRole} 
        isAuthenticated={isAuthenticated}
        onRoleChange={handleRoleChange} 
        onLoginClick={handleLoginClick}
        onLogout={handleLogout}
      />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        {!selectedEntity && !showAdminPanel && (
          <div className="text-center py-8 md:py-16 space-y-4 md:space-y-6">
            <div className="space-y-4">
              {/* Logos Section */}
              <div className="flex items-center justify-center gap-4 md:gap-6 mb-6 md:mb-8">
                <div className="flex flex-col items-center">
                  <Logo variant="minimal" size="lg" className="mb-2 md:w-16 md:h-16 text-primary" style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(221deg) brightness(97%) contrast(97%)' }} />
                  <p className="text-xs md:text-sm text-muted-foreground">CampusFlow</p>
                </div>
                
                <div className="w-px h-12 md:h-16 bg-muted-foreground/20"></div>
                
                <div className="flex flex-col items-center">
                  <Logo variant="ksu" size="lg" className="mb-2 md:w-16 md:h-16 text-primary" style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(221deg) brightness(97%) contrast(97%)' }} />
                  <p className="text-xs md:text-sm text-muted-foreground">КГУ</p>
                </div>
              </div>
              
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                CampusFlow
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                {userRole === 'student' 
                  ? 'Современная система расписания КГУ' 
                  : isAuthenticated
                    ? 'Административная панель управления расписанием КГУ'
                    : 'Войдите в систему для доступа к административным функциям'
                }
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <SearchBar onSelect={handleEntitySelect} />
            </div>

            {favorites.length > 0 && (
              <div className="max-w-3xl mx-auto space-y-2">
                <p className="text-sm text-muted-foreground">Избранное:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {favorites.map((fav) => (
                    <Button
                      key={`${fav.type}-${fav.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => handleEntitySelect(fav)}
                      className="flex items-center gap-2"
                    >
                      {fav.type === 'group' ? 'Группа' : 'Преподаватель'} {fav.name}
                      <span
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(fav.id, fav.type);
                        }}
                      >
                        ×
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {userRole === 'student' && (
              <Alert className="max-w-2xl mx-auto">
                <Search className="h-4 w-4" />
                <AlertDescription>
                  Введите номер группы (например, "121" или "113") или фамилию преподавателя для поиска расписания
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Admin Panel */}
        {userRole === 'admin' && isAuthenticated && showAdminPanel && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Панель администратора</h2>
              <button
                onClick={handleBackToSearch}
                className="text-primary hover:underline"
              >
                ← Назад к поиску
              </button>
            </div>
            <AdminPanel />
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Загрузка расписания...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert className="max-w-2xl mx-auto" variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Schedule View */}
        {selectedEntity && !showAdminPanel && !isLoading && (
          <div className="space-y-6">
            {/* Selected Entity Info */}
            <Card className="border-primary/20 bg-gradient-secondary">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Расписание {selectedEntity.type === 'group' ? 'группы' : 'преподавателя'} {selectedEntity.name}
                    </h2>
                    <p className="text-muted-foreground">
                      {filteredSchedule.length} {filteredSchedule.length === 1 ? 'занятие' : 'занятий'} 
                      {selectedSchedule.length !== filteredSchedule.length && 
                        ` (из ${selectedSchedule.length} всего)`
                      }
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Временно отключен экспорт в PDF */}
                    {/* {selectedEntity.type === 'group' && (
                      <ExportPDFButton 
                        groupNumber={selectedEntity.name}
                        variant="outline"
                        size="sm"
                      />
                    )} */}
                    <Button
                      onClick={toggleFavorite}
                      variant={isFavoriteSelected ? "secondary" : "outline"}
                      size="sm"
                    >
                      {isFavoriteSelected ? 'В избранном' : 'В избранное'}
                    </Button>
                    {userRole === 'admin' && isAuthenticated && (
                      <>
                        <Button
                          onClick={handleAddNewItem}
                          size="sm"
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Добавить пару
                        </Button>
                        <Button
                          onClick={() => setShowAdminPanel(true)}
                          variant="outline"
                          size="sm"
                        >
                          Панель администратора
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={handleBackToSearch}
                      variant="ghost"
                      size="sm"
                    >
                      ← Назад к поиску
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <DateControls 
                  selectedDate={selectedDate} 
                  onDateChange={setSelectedDate} 
                />
                <ViewToggle 
                  currentView={viewMode} 
                  onViewChange={setViewMode} 
                />
              </div>
              
              {/* Subgroup Selector */}
              {selectedEntity.type === 'group' && (
                <SubgroupSelector
                  schedule={selectedSchedule}
                  selectedSubgroups={selectedSubgroups}
                  onSubgroupChange={handleSubgroupChange}
                  mainGroup={selectedEntity.name}
                />
              )}
            </div>

            {/* Separator - показываем только если есть селектор подгрупп */}
            <Separator />

            {/* Schedule Display */}
            {filteredSchedule.length > 0 ? (
              <ScheduleDisplay
                schedule={filteredSchedule}
                selectedDate={selectedDate}
                viewMode={viewMode}
                isAdmin={userRole === 'admin' && isAuthenticated}
                onItemClick={handleItemEdit}
              />
            ) : selectedSchedule.length > 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="space-y-4">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <div>
                      <h3 className="text-xl font-semibold">Нет занятий для выбранных подгрупп</h3>
                      <p className="text-muted-foreground">
                        Попробуйте выбрать другие подгруппы или сбросить фильтр
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="space-y-4">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <div>
                      <h3 className="text-xl font-semibold">Расписание не найдено</h3>
                      <p className="text-muted-foreground">
                        Для {selectedEntity.type === 'group' ? 'группы' : 'преподавателя'} {selectedEntity.name} 
                        расписание пока не добавлено
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />

        {/* Edit/Create Modal */}
        <EditScheduleModal
          item={editingItem}
          isOpen={!!editingItem}
          onClose={handleModalClose}
          onSave={handleItemSave}
          isNew={isCreatingNewItem}
        />
      </main>
    </div>
  );
};

export default Index;
