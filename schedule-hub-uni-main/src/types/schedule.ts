export interface ScheduleItem {
  id: string;
  subject: string;
  type: 'Л' | 'ПР' | 'ЛАБ'; // Лекция, Практика, Лабораторная
  teacher: string;
  classroom: string;
  timeStart: string;
  timeEnd: string;
  dayWeek: 'ПОНЕДЕЛЬНИК' | 'ВТОРНИК' | 'СРЕДА' | 'ЧЕТВЕРГ' | 'ПЯТНИЦА' | 'СУББОТА';
  parity: 'ЧИСЛИТЕЛЬ' | 'ЗНАМЕНАТЕЛЬ' | 'ВСЕГДА';
  subgroup?: string;
}

export interface Group {
  id: string;
  number: string;
  direction: string;
  profile: string;
  facultyId: string;
}

export interface Teacher {
  id: string;
  name: string;
  post: string;
  facultyId: string;
}

export interface Subject {
  id: string;
  name: string;
  type: string;
}

export interface Faculty {
  id: number;
  abbreviation: string;
  facultyName: string;
}

export type UserRole = 'STUDENT' | 'MONITOR' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  groupNumber?: string;
  subgroupNumber?: string;
  info?: string;
  role?: UserRole;
  facultyId?: number;
  facultyName?: string;
}

export interface CreateAdminRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  facultyId?: number;
}