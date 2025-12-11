import { ScheduleItem, Group, Teacher, Subject, Faculty, User, CreateAdminRequest } from '@/types/schedule';

const API_BASE_URL = '/api/v1';

// Управление JWT токенами
const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const setAuthToken = (token: string | null, refreshToken?: string | null) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refreshToken !== undefined) {
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Функция для получения заголовков с авторизацией
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    });

    if (!response.ok) {
      setAuthToken(null, null);
      return null;
    }

    const data = await response.json();
    const newAccess = data.accessToken || data.token;
    const newRefresh = data.refreshToken || refreshToken;
    if (newAccess) {
      setAuthToken(newAccess, newRefresh);
      return newAccess;
    }
  } catch (err) {
    console.error('Не удалось обновить токен', err);
  }
  return null;
};

const authFetch = async (url: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers, credentials: options.credentials ?? 'include' });

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, { ...options, headers, credentials: options.credentials ?? 'include' });
    }
  }

  return response;
};

// Интерфейсы для API ответов (соответствуют DTO в бэкенде)
interface ScheduleDto {
  id: number;
  parity: string;
  subgroupDto: {
    id: number;
    number: string;
    groupDto: {
      id: number;
      number: string;
      direction: string;
      profile: string;
      faculty: {
        id: number;
        abbreviation: string;
        facultyName: string;
      };
    };
  };
  subjectDto: {
    id: number;
    name: string;
    type: string;
  };
  teacherDto: {
    id: number;
    name: string;
    post: string;
    faculty: {
      id: number;
      abbreviation: string;
      facultyName: string;
    };
  };
  dayWeek: string;
  timeStart: string;
  timeEnd: string;
  classroom: string;
}

interface GroupDto {
  id: number;
  number: string;
  direction: string;
  profile: string;
  faculty: {
    id: number;
    abbreviation: string;
    facultyName: string;
  };
}

interface TeacherDto {
  id: number;
  name: string;
  post: string;
  faculty: {
    id: number;
    abbreviation: string;
    facultyName: string;
  };
}

interface SubjectDto {
  id: number;
  name: string;
  type: string;
}

interface FacultyDto {
  id: number;
  abbreviation: string;
  facultyName: string;
}

// Функции преобразования DTO в frontend типы
const mapScheduleDto = (dto: ScheduleDto): ScheduleItem => ({
  id: dto.id.toString(),
  subject: dto.subjectDto.name,
  type: dto.subjectDto.type.replace(/[()]/g, '') as 'Л' | 'ПР' | 'ЛАБ',
  teacher: dto.teacherDto.name,
  classroom: dto.classroom,
  timeStart: dto.timeStart,
  timeEnd: dto.timeEnd,
  dayWeek: dto.dayWeek as any,
  parity: dto.parity as any,
  subgroup: dto.subgroupDto.number
});

const mapGroupDto = (dto: GroupDto): Group => ({
  id: dto.id.toString(),
  number: dto.number,
  direction: dto.direction,
  profile: dto.profile,
  facultyId: (dto.faculty?.id ?? (dto as any).facultyId ?? 0).toString()
});

const normalizePost = (post: string) => {
  if (!post) return 'Неизвестно';
  const trimmed = post.trim().toLowerCase();
  const mapping: Record<string, string> = {
    'доц': 'Доцент',
    'доцент': 'Доцент',
    'проф': 'Профессор',
    'профессор': 'Профессор',
    'ассистент': 'Ассистент'
  };
  return mapping[trimmed] || post;
};

const mapTeacherDto = (dto: TeacherDto): Teacher => ({
  id: dto.id.toString(),
  name: dto.name,
  post: normalizePost(dto.post),
  facultyId: dto.faculty?.id?.toString() || '0'
});

const mapSubjectDto = (dto: SubjectDto): Subject => ({
  id: dto.id.toString(),
  name: dto.name,
  type: dto.type
});

const mapFacultyDto = (dto: FacultyDto): Faculty => ({
  id: dto.id,
  abbreviation: dto.abbreviation,
  facultyName: dto.facultyName
});

// Вспомогательная функция для обработки ответов
const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  if (!response.ok) {
    let errorText = '';
    try {
      errorText = await response.text();
    } catch (e) {
      errorText = 'Не удалось прочитать ответ сервера';
    }
    
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      errorText: errorText
    });
    
    // Попытаемся распарсить JSON ошибку
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      if (errorText) {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      }
    } catch (e) {
      // Если не JSON, используем текст как есть
      if (errorText) {
        errorMessage = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
      }
    }
    
    const err: any = new Error(errorMessage);
    if (response.status === 409 && contentType && contentType.includes('application/json')) {
      try {
        err.conflict = JSON.parse(errorText);
      } catch (_) {}
    }
    throw err;
  }
  // Возвращаем null, если тела нет (например, DELETE 204)
  if (response.status === 204 || contentLength === '0' || !contentType) {
    return null;
  }
  return response.json();
};

// API функции
export const api = {
  // Управление токеном
  setAuthToken,
  getAuthToken,
  
  // Проверка состояния API
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/demo-controller`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('API Health Check Failed:', error);
      return false;
    }
  },

  // Аутентификация
  async register(data: { 
    firstName: string; 
    lastName: string; 
    middleName: string;
    email: string; 
    password: string;
    group_number?: string;
    subgroup_number?: string;
    info?: string;
    role?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async authenticate(data: { email: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  // Расписание
  async getAllSchedules(): Promise<ScheduleItem[]> {
    const response = await fetch(`${API_BASE_URL}/schedule`);
    const data: ScheduleDto[] = await handleResponse(response);
    return data.map(mapScheduleDto);
  },

  async getScheduleBySubgroup(subgroupNumber: string): Promise<ScheduleItem[]> {
    const response = await fetch(`${API_BASE_URL}/schedule/subgroup/number/${subgroupNumber}`);
    const data: ScheduleDto[] = await handleResponse(response);
    return data.map(mapScheduleDto);
  },

  async updateScheduleItem(item: ScheduleItem, subgroupId: number, teacherId: number, subjectId: number): Promise<ScheduleItem> {
    const params = new URLSearchParams({
      parity: item.parity,
      subgroup_id: subgroupId.toString(),
      teacher_id: teacherId.toString(),
      subject_id: subjectId.toString(),
      dayWeek: item.dayWeek,
      timeStart: item.timeStart,
      timeEnd: item.timeEnd,
      classroom: item.classroom
    });

    console.log('Отправляем PUT запрос:', `${API_BASE_URL}/schedule/${item.id}?${params}`);
    console.log('Параметры:', { subgroupId, teacherId, subjectId });

    const response = await fetch(`${API_BASE_URL}/schedule/${item.id}?${params}`, {
      method: 'PUT',
    });
    const data: ScheduleDto = await handleResponse(response);
    return mapScheduleDto(data);
  },

  async createScheduleItem(item: Omit<ScheduleItem, 'id'>, subgroupId: number, teacherId: number, subjectId: number): Promise<ScheduleItem> {
    const params = new URLSearchParams({
      parity: item.parity,
      subgroup_id: subgroupId.toString(),
      teacher_id: teacherId.toString(),
      subject_id: subjectId.toString(),
      dayWeek: item.dayWeek,
      timeStart: item.timeStart,
      timeEnd: item.timeEnd,
      classroom: item.classroom
    });

    console.log('Отправляем POST запрос:', `${API_BASE_URL}/schedule?${params}`);
    console.log('Параметры:', { subgroupId, teacherId, subjectId });

    const response = await fetch(`${API_BASE_URL}/schedule?${params}`, {
      method: 'POST',
    });
    const data: ScheduleDto = await handleResponse(response);
    return mapScheduleDto(data);
  },

  async deleteScheduleItem(scheduleId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/schedule/${scheduleId}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  // Группы
  async getAllGroups(): Promise<Group[]> {
    const response = await fetch(`${API_BASE_URL}/batches`);
    const data: GroupDto[] = await handleResponse(response);
    return data.map(mapGroupDto);
  },

  // Преподаватели
  async getAllTeachers(): Promise<Teacher[]> {
    const response = await fetch(`${API_BASE_URL}/teacher`);
    const data: TeacherDto[] = await handleResponse(response);
    return data.map(mapTeacherDto);
  },

  // Предметы
  async getAllSubjects(): Promise<Subject[]> {
    const response = await fetch(`${API_BASE_URL}/subject`);
    const data: SubjectDto[] = await handleResponse(response);
    return data.map(mapSubjectDto);
  },

  // Факультеты
  async getAllFaculties(): Promise<Faculty[]> {
    const response = await fetch(`${API_BASE_URL}/faculty`);
    const data: FacultyDto[] = await handleResponse(response);
    return data.map(mapFacultyDto);
  },

  // Поиск
  async searchGroups(query: string): Promise<Group[]> {
    const allGroups = await this.getAllGroups();
    return allGroups.filter(group => 
      group.number.toLowerCase().includes(query.toLowerCase())
    );
  },

  async searchTeachers(query: string): Promise<Teacher[]> {
    const allTeachers = await this.getAllTeachers();
    return allTeachers.filter(teacher => 
      teacher.name.toLowerCase().includes(query.toLowerCase())
    );
  },

  // Вспомогательные функции для получения ID
  async getTeacherIdByName(teacherName: string): Promise<number | null> {
    try {
      const teachers = await this.getAllTeachers();
      console.log('Все преподаватели:', teachers.map(t => ({ id: t.id, name: t.name })));
      console.log('Ищем преподавателя:', teacherName);
      const teacher = teachers.find(t => t.name === teacherName);
      console.log('Найденный преподаватель:', teacher);
      return teacher ? parseInt(teacher.id) : null;
    } catch (error) {
      console.error('Ошибка получения ID преподавателя:', error);
      return null;
    }
  },

  async getSubjectIdByNameAndType(subjectName: string, subjectType: string): Promise<number | null> {
    try {
      const subjects = await this.getAllSubjects();
      console.log('Все предметы:', subjects.map(s => ({ id: s.id, name: s.name, type: s.type })));
      console.log('Ищем предмет:', { name: subjectName, type: subjectType });
      
      // Ищем предмет по названию и типу (учитываем что тип может быть с скобками или без)
      const subject = subjects.find(s => 
        s.name === subjectName && 
        (s.type.includes(subjectType) || s.type.replace(/[()]/g, '') === subjectType)
      );
      console.log('Найденный предмет:', subject);
      return subject ? parseInt(subject.id) : null;
    } catch (error) {
      console.error('Ошибка получения ID предмета:', error);
      return null;
    }
  },

  async getAllSubgroups(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/subgroup`);
    const data = await handleResponse(response);
    return data;
  },

  async getSubgroupsByGroupNumber(groupNumber: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/subgroup/groupNumber/${groupNumber}`);
    return handleResponse(response);
  },

  async createSubgroup(groupNumber: string, subgroupNumber: string, size?: number): Promise<any> {
    const response = await authFetch(`${API_BASE_URL}/subgroup`, {
      method: 'POST',
      body: JSON.stringify({
        number: subgroupNumber,
        groupDto: { number: groupNumber },
        size: size || 0
      })
    });
    return handleResponse(response);
  },

  async updateSubgroup(id: number, groupNumber: string, subgroupNumber: string, size?: number): Promise<any> {
    const response = await authFetch(`${API_BASE_URL}/subgroup/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        id,
        number: subgroupNumber,
        groupDto: { number: groupNumber },
        size: size || 0
      })
    });
    return handleResponse(response);
  },

  async deleteSubgroup(id: number): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/subgroup/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  async getSubgroupIdByNumber(subgroupNumber: string): Promise<number | null> {
    try {
      const subgroups = await this.getAllSubgroups();
      console.log('Все подгруппы:', subgroups.map(s => ({ id: s.id, number: s.number })));
      console.log('Ищем подгруппу:', subgroupNumber);
      const subgroup = subgroups.find(s => s.number === subgroupNumber);
      console.log('Найденная подгруппа:', subgroup);
      return subgroup ? subgroup.id : null;
    } catch (error) {
      console.error('Ошибка получения ID подгруппы:', error);
      return null;
    }
  },

  // CRUD операции для администраторов
  async deleteGroup(groupId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/batches/${groupId}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  async deleteTeacher(teacherId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/teacher/${teacherId}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  async deleteSubject(subjectId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/subject/${subjectId}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  async deleteFaculty(facultyId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/faculty/delete/${facultyId}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  // Создание и обновление
  async createGroup(group: Omit<Group, 'id'>): Promise<Group> {
    const response = await fetch(`${API_BASE_URL}/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: group.number,
        direction: group.direction,
        profile: group.profile,
        facultyId: parseInt(group.facultyId)
      }),
    });
    const data = await handleResponse(response);
    return mapGroupDto(data);
  },

  async updateGroup(group: Group): Promise<Group> {
    const params = new URLSearchParams({
      number: group.number,
      direction: group.direction,
      profile: group.profile
    });

    const response = await fetch(`${API_BASE_URL}/batches/${group.id}?${params}`, {
      method: 'PUT',
    });
    const data = await handleResponse(response);
    return mapGroupDto(data);
  },

  async createTeacher(teacher: Omit<Teacher, 'id'>): Promise<Teacher> {
    const response = await fetch(`${API_BASE_URL}/teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: teacher.name,
        post: teacher.post,
        facultyId: parseInt(teacher.facultyId)
      }),
    });
    const data = await handleResponse(response);
    return mapTeacherDto(data);
  },

  async updateTeacher(teacher: Teacher): Promise<Teacher> {
    const params = new URLSearchParams({
      name: teacher.name,
      post: teacher.post
    });

    const response = await fetch(`${API_BASE_URL}/teacher/${teacher.id}?${params}`, {
      method: 'PUT',
    });
    const data = await handleResponse(response);
    return mapTeacherDto(data);
  },

  async createSubject(subject: Omit<Subject, 'id'>): Promise<Subject> {
    const response = await fetch(`${API_BASE_URL}/subject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: subject.name,
        type: subject.type
      }),
    });
    const data = await handleResponse(response);
    return mapSubjectDto(data);
  },

  async updateSubject(subject: Subject): Promise<Subject> {
    const params = new URLSearchParams({
      name: subject.name,
      type: subject.type
    });

    const response = await fetch(`${API_BASE_URL}/subject/${subject.id}?${params}`, {
      method: 'PUT',
    });
    const data = await handleResponse(response);
    return mapSubjectDto(data);
  },

  // Импорт Excel
  async importExcel(files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/import/import-excel`, {
      method: 'POST',
      body: formData,
    });

    // Для импорта возможен успешный ответ без JSON тела
    if (response.ok) {
      return { success: true };
    } else {
      return handleResponse(response);
    }
  },

  // Пользователи
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = getAuthToken();
      console.log('[API] Запрос текущего пользователя:', `${API_BASE_URL}/user/me`);
      console.log('[API] Токен найден:', token ? 'Да' : 'Нет');
      
      const response = await authFetch(`${API_BASE_URL}/user/me`);
      console.log('[API] Статус ответа:', response.status);
      if (!response.ok) {
        console.log('[API] Ответ не OK, возвращаем null');
        return null;
      }
      const data = await response.json();
      console.log('[API] Данные пользователя получены:', data);
      return data;
    } catch (error) {
      console.error('[API] Ошибка получения текущего пользователя:', error);
      return null;
    }
  },

  async getAllUsers(): Promise<User[]> {
    const response = await authFetch(`${API_BASE_URL}/admin/users`);
    const data = await handleResponse(response);
    return data;
  },

  async updateUserRole(userId: number, role: string, facultyId?: number): Promise<User> {
    const params = new URLSearchParams({
      role: role,
    });
    
    if (facultyId !== undefined) {
      params.append('facultyId', facultyId.toString());
    }

    const response = await authFetch(`${API_BASE_URL}/admin/users/${userId}/role?${params}`, {
      method: 'PUT',
    });
    return handleResponse(response);
  },

  async createAdmin(user: CreateAdminRequest): Promise<User> {
    const response = await authFetch(`${API_BASE_URL}/admin/users/admin`, {
      method: 'POST',
      body: JSON.stringify(user),
    });
    return handleResponse(response);
  },

  async updateUser(userId: number, user: Partial<User>): Promise<User> {
    const response = await authFetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        email: user.email,
        role: user.role,
        facultyId: user.facultyId,
        groupNumber: user.groupNumber,
        subgroupNumber: user.subgroupNumber,
      }),
    });
    return handleResponse(response);
  },

  async deleteUser(userId: number): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  // PDF экспорт
  async exportSchedulePDF(groupNumber: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/schedule/export/pdf/${groupNumber}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Ошибка экспорта PDF: ${response.statusText}`);
    }

    return await response.blob();
  },

  async downloadSchedulePDF(groupNumber: string): Promise<void> {
    try {
      const blob = await this.exportSchedulePDF(groupNumber);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule_${groupNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Ошибка скачивания PDF:', error);
      throw error;
    }
  }
}; 