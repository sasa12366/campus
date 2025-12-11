package org.ksu.schedule.service;

import org.ksu.schedule.domain.Group;
import org.ksu.schedule.domain.Schedule;
import org.ksu.schedule.domain.Teacher;
import org.ksu.schedule.domain.User;

import java.util.List;

/**
 * Сервис для контроля доступа администраторов по факультетам.
 *
 * @version 1.0
 * @author System
 */
public interface FacultyAccessService {

    /**
     * Получить текущего аутентифицированного пользователя.
     *
     * @return текущий пользователь
     */
    User getCurrentUser();

    /**
     * Проверить, имеет ли текущий пользователь доступ к факультету.
     *
     * @param facultyId идентификатор факультета
     * @return true, если есть доступ
     */
    boolean hasAccessToFaculty(Integer facultyId);

    /**
     * Проверить, является ли текущий пользователь суперадминистратором.
     *
     * @return true, если пользователь - суперадмин
     */
    boolean isSuperAdmin();

    /**
     * Проверить, является ли текущий пользователь администратором (любого уровня).
     *
     * @return true, если пользователь - админ или суперадмин
     */
    boolean isAdmin();

    /**
     * Фильтровать список групп по доступу текущего пользователя.
     *
     * @param groups список групп
     * @return отфильтрованный список групп
     */
    List<Group> filterGroupsByAccess(List<Group> groups);

    /**
     * Фильтровать список преподавателей по доступу текущего пользователя.
     *
     * @param teachers список преподавателей
     * @return отфильтрованный список преподавателей
     */
    List<Teacher> filterTeachersByAccess(List<Teacher> teachers);

    /**
     * Фильтровать расписание по доступу текущего пользователя.
     *
     * @param schedules список расписаний
     * @return отфильтрованный список расписаний
     */
    List<Schedule> filterSchedulesByAccess(List<Schedule> schedules);

    /**
     * Проверить доступ к группе.
     *
     * @param group группа для проверки
     * @throws SecurityException если доступ запрещен
     */
    void checkAccessToGroup(Group group);

    /**
     * Проверить доступ к преподавателю.
     *
     * @param teacher преподаватель для проверки
     * @throws SecurityException если доступ запрещен
     */
    void checkAccessToTeacher(Teacher teacher);
}

