package org.ksu.schedule.service;

import org.ksu.schedule.domain.Role;
import org.ksu.schedule.domain.User;
import org.ksu.schedule.rest.dto.UserDto;

import java.util.List;
import java.util.Optional;

/**
 * Сервис для управления пользователями.
 *
 * @version 1.0
 * @author Егор Гришанов
 */
public interface UserService {

    /**
     * Получить пользователя по электронной почте.
     *
     * @param email электронная почта пользователя
     * @return объект Optional, содержащий пользователя
     */
    Optional<User> getByEmail(String email);

    /**
     * Обновить данные студента.
     *
     * @param email электронная почта пользователя
     * @param lastName фамилия пользователя
     * @param firstName имя пользователя
     * @param middleName отчество пользователя
     * @return объект Optional, содержащий обновленного пользователя
     */
    Optional<User> updateStudent(String email, String lastName, String firstName, String middleName);

    /**
     * Обновить данные преподавателя.
     *
     * @param email электронная почта пользователя
     * @param lastName фамилия пользователя
     * @param firstName имя пользователя
     * @param middleName отчество пользователя
     * @param info дополнительная информация о пользователе
     * @return объект Optional, содержащий обновленного пользователя
     */
    Optional<User> updateTeacher(String email, String lastName, String firstName, String middleName, String info);


    void updatePassword(User user, String newPassword);

    Optional<User> updateStudentGroupAndFaculty(String email, String groupName, String subgroupName, String facultyName);

    User findUserByFullName(String fullName);

    /**
     * Получить всех пользователей.
     *
     * @return список всех пользователей
     */
    List<User> getAllUsers();

    /**
     * Получить пользователей конкретного факультета.
     *
     * @param facultyId идентификатор факультета
     * @return список пользователей факультета
     */
    List<User> getUsersByFaculty(Integer facultyId);

    /**
     * Найти пользователя по идентификатору.
     *
     * @param id идентификатор пользователя
     * @return пользователь
     */
    User getById(Long id);

    /**
     * Обновить роль и факультет пользователя.
     *
     * @param userId    идентификатор пользователя
     * @param role      новая роль
     * @param facultyId идентификатор факультета
     * @return обновленный пользователь
     */
    User updateUserRole(Long userId, Role role, Integer facultyId);

    /**
     * Создать нового администратора.
     *
     * @param userDto данные администратора
     * @return созданный пользователь
     */
    User createAdmin(UserDto userDto);

    /**
     * Полное обновление данных пользователя (ФИО, email, роль, факультет, группа/подгруппа).
     *
     * @param userId            идентификатор пользователя
     * @param dto               входные данные
     * @param targetFacultyId   факультет, который нужно назначить (может быть null)
     * @param allowRoleChange   можно ли менять роль
     * @return обновленный пользователь
     */
    User updateUser(Long userId, UserDto dto, Integer targetFacultyId, boolean allowRoleChange);

    /**
     * Удалить пользователя.
     *
     * @param userId идентификатор пользователя
     */
    void deleteUser(Long userId);
}
