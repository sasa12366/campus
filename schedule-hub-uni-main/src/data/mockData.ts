import { ScheduleItem, Group, Teacher, Subject, Faculty } from '@/types/schedule';

export const faculties: Faculty[] = [
  { id: '1', abbreviation: 'ФМИ', facultyName: 'Факультет физики, математики, информатики' },
];

export const groups: Group[] = [
  { id: '1', number: '121', direction: '11.03.04 Электроника и наноэлектроника', profile: 'Технологии в наноэлектронике', facultyId: '1' },
  { id: '3', number: '113', direction: '02.03.03 Математическое обеспечение и администрирование информационных систем', profile: 'Проектирование информационных систем и баз данных', facultyId: '1' },
];

export const teachers: Teacher[] = [
  { id: '1', name: 'Вервейко В.Н.', post: 'доц', facultyId: '1' },
  { id: '2', name: 'Киперман Я.В.', post: 'доц', facultyId: '1' },
  { id: '3', name: 'Буровникова О.Н.', post: 'асс', facultyId: '1' },
  { id: '4', name: 'Сычев А.В.', post: 'асс', facultyId: '1' },
  { id: '5', name: 'Смолина О.В.', post: 'ст.пр', facultyId: '1' },
  { id: '6', name: 'Довбня В.Г.', post: 'проф', facultyId: '1' },
];

export const subjects: Subject[] = [
  { id: '1', name: 'Механика', type: '(ПР)' },
  { id: '2', name: 'Физическая культура и спорт', type: '(ПР)' },
  { id: '3', name: 'Вводный курс физики', type: '(Л)' },
  { id: '4', name: 'Механика', type: '(Л)' },
  { id: '5', name: 'Вводный курс физики', type: '(ЛАБ)' },
  { id: '6', name: 'Механика', type: '(ЛАБ)' },
  { id: '7', name: 'Русский язык и культура речи', type: '(ПР)' },
  { id: '8', name: 'Основы общей химии и техники лабораторного химического эксперимента', type: '(ЛАБ)' },
];

export const mockSchedule: ScheduleItem[] = [
  {
    id: '1',
    subject: 'Механика',
    type: 'ПР',
    teacher: 'Вервейко В.Н.',
    classroom: '181',
    timeStart: '08:00',
    timeEnd: '09:30',
    dayWeek: 'ПОНЕДЕЛЬНИК',
    parity: 'ЧИСЛИТЕЛЬ',
    subgroup: '121'
  },
  {
    id: '2',
    subject: 'Физическая культура и спорт',
    type: 'ПР',
    teacher: 'Киперман Я.В.',
    classroom: '209',
    timeStart: '08:00',
    timeEnd: '09:30',
    dayWeek: 'ПОНЕДЕЛЬНИК',
    parity: 'ЗНАМЕНАТЕЛЬ',
    subgroup: '121'
  },
  {
    id: '3',
    subject: 'Вводный курс физики',
    type: 'Л',
    teacher: 'Вервейко В.Н.',
    classroom: '193',
    timeStart: '09:40',
    timeEnd: '11:10',
    dayWeek: 'ПОНЕДЕЛЬНИК',
    parity: 'ЧИСЛИТЕЛЬ',
    subgroup: '121'
  },
  {
    id: '4',
    subject: 'Механика',
    type: 'Л',
    teacher: 'Вервейко В.Н.',
    classroom: '193',
    timeStart: '09:40',
    timeEnd: '11:10',
    dayWeek: 'ПОНЕДЕЛЬНИК',
    parity: 'ЗНАМЕНАТЕЛЬ',
    subgroup: '121'
  },
  {
    id: '5',
    subject: 'Вводный курс физики',
    type: 'ЛАБ',
    teacher: 'Вервейко В.Н.',
    classroom: '181',
    timeStart: '11:20',
    timeEnd: '12:50',
    dayWeek: 'ПОНЕДЕЛЬНИК',
    parity: 'ЧИСЛИТЕЛЬ',
    subgroup: '121'
  },
  {
    id: '6',
    subject: 'Механика',
    type: 'ЛАБ',
    teacher: 'Вервейко В.Н.',
    classroom: '181',
    timeStart: '11:20',
    timeEnd: '12:50',
    dayWeek: 'ПОНЕДЕЛЬНИК',
    parity: 'ЗНАМЕНАТЕЛЬ',
    subgroup: '121'
  },
  {
    id: '7',
    subject: 'Русский язык и культура речи',
    type: 'ПР',
    teacher: 'Буровникова О.Н.',
    classroom: '209',
    timeStart: '13:10',
    timeEnd: '14:40',
    dayWeek: 'ПОНЕДЕЛЬНИК',
    parity: 'ЧИСЛИТЕЛЬ',
    subgroup: '121'
  },
  {
    id: '8',
    subject: 'Основы общей химии и техники лабораторного химического эксперимента',
    type: 'ЛАБ',
    teacher: 'Сычев А.В.',
    classroom: '185',
    timeStart: '13:10',
    timeEnd: '14:40',
    dayWeek: 'ПОНЕДЕЛЬНИК',
    parity: 'ЗНАМЕНАТЕЛЬ',
    subgroup: '121'
  },
  // Вторник
  {
    id: '9',
    subject: 'Вводный курс физики',
    type: 'ЛАБ',
    teacher: 'Смолина О.В.',
    classroom: '185',
    timeStart: '09:40',
    timeEnd: '11:10',
    dayWeek: 'ВТОРНИК',
    parity: 'ЧИСЛИТЕЛЬ',
    subgroup: '121'
  },
  {
    id: '10',
    subject: 'Механика',
    type: 'ЛАБ',
    teacher: 'Довбня В.Г.',
    classroom: '185',
    timeStart: '09:40',
    timeEnd: '11:10',
    dayWeek: 'ВТОРНИК',
    parity: 'ЗНАМЕНАТЕЛЬ',
    subgroup: '121'
  },
  {
    id: '11',
    subject: 'Математический анализ',
    type: 'Л',
    teacher: 'Довбня В.Г.',
    classroom: '185',
    timeStart: '11:20',
    timeEnd: '12:50',
    dayWeek: 'ВТОРНИК',
    parity: 'ВСЕГДА',
    subgroup: '121'
  },
  {
    id: '12',
    subject: 'Программирование',
    type: 'ПР',
    teacher: 'Смолина О.В.',
    classroom: '185',
    timeStart: '13:10',
    timeEnd: '14:40',
    dayWeek: 'ВТОРНИК',
    parity: 'ВСЕГДА',
    subgroup: '121'
  },
];

export const timeSlots = [
  { start: '08:00', end: '09:30' },
  { start: '09:40', end: '11:10' },
  { start: '11:20', end: '12:50' },
  { start: '13:10', end: '14:40' },
  { start: '14:50', end: '16:20' },
  { start: '16:30', end: '18:00' },
];

export const weekDays = [
  'ПОНЕДЕЛЬНИК',
  'ВТОРНИК', 
  'СРЕДА',
  'ЧЕТВЕРГ',
  'ПЯТНИЦА',
  'СУББОТА'
] as const;