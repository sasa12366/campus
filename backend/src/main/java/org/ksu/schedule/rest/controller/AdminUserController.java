package org.ksu.schedule.rest.controller;

import lombok.RequiredArgsConstructor;
import org.ksu.schedule.domain.Role;
import org.ksu.schedule.domain.User;
import org.ksu.schedule.rest.dto.UserDto;
import org.ksu.schedule.service.FacultyAccessService;
import org.ksu.schedule.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Контроллер для управления пользователями (только для SUPER_ADMIN).
 *
 * @version 1.0
 * @author System
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin")
public class AdminUserController {

    private final UserService userService;
    private final FacultyAccessService facultyAccessService;

    /**
     * Получить список всех пользователей.
     * Доступно только для SUPER_ADMIN.
     *
     * @return список пользователей
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        User currentUser = facultyAccessService.getCurrentUser();
        if (currentUser == null || !facultyAccessService.isAdmin()) {
            return ResponseEntity.status(403).build();
        }

        List<User> users;
        if (facultyAccessService.isSuperAdmin()) {
            users = userService.getAllUsers();
        } else if (currentUser.getFaculty() != null) {
            users = userService.getUsersByFaculty(currentUser.getFaculty().getId());
        } else {
            return ResponseEntity.status(403).build();
        }

        List<UserDto> userDtos = users.stream()
                .map(UserDto::fromUser)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(userDtos);
    }

    /**
     * Обновить роль и факультет пользователя.
     * Доступно только для SUPER_ADMIN.
     *
     * @param userId    идентификатор пользователя
     * @param role      новая роль
     * @param facultyId идентификатор факультета (может быть null)
     * @return обновленный пользователь
     */
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<UserDto> updateUserRole(@PathVariable Long userId,
                                                   @RequestParam String role,
                                                   @RequestParam(required = false) Integer facultyId) {
        if (!facultyAccessService.isSuperAdmin()) {
            return ResponseEntity.status(403).build();
        }

        try {
            Role newRole = Role.valueOf(role);
            User updatedUser = userService.updateUserRole(userId, newRole, facultyId);
            return ResponseEntity.ok(UserDto.fromUser(updatedUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Создать нового администратора.
     * Доступно только для SUPER_ADMIN.
     *
     * @param userDto данные нового администратора
     * @return созданный пользователь
     */
    @PostMapping("/users/admin")
    public ResponseEntity<UserDto> createAdmin(@RequestBody UserDto userDto) {
        if (!facultyAccessService.isSuperAdmin()) {
            return ResponseEntity.status(403).build();
        }

        User newUser = userService.createAdmin(userDto);
        return ResponseEntity.ok(UserDto.fromUser(newUser));
    }

        /**
         * Полное обновление пользователя (ФИО, email, роль, факультет, группа/подгруппа, пароль).
         * SUPER_ADMIN — любые пользователи; ADMIN — только пользователи своего факультета и без повышения до SUPER_ADMIN.
         */
        @PutMapping("/users/{userId}")
        public ResponseEntity<UserDto> updateUser(@PathVariable Long userId, @RequestBody UserDto dto) {
            User currentUser = facultyAccessService.getCurrentUser();
            if (currentUser == null || !facultyAccessService.isAdmin()) {
                return ResponseEntity.status(403).build();
            }

            User targetUser = userService.getById(userId);

            // ADMIN может управлять только пользователями своего факультета и не может трогать супер-админов
            if (!facultyAccessService.isSuperAdmin()) {
                if (targetUser.getRole() == Role.SUPER_ADMIN) {
                    return ResponseEntity.status(403).build();
                }
                if (currentUser.getFaculty() == null
                        || targetUser.getFaculty() == null
                        || !currentUser.getFaculty().getId().equals(targetUser.getFaculty().getId())) {
                    return ResponseEntity.status(403).build();
                }
            }

            Integer facultyIdToAssign;
            if (facultyAccessService.isSuperAdmin()) {
                facultyIdToAssign = dto.getFacultyId();
            } else {
                // Фиксируем факультет текущего администратора
                if (currentUser.getFaculty() == null) {
                    return ResponseEntity.status(403).build();
                }
                facultyIdToAssign = currentUser.getFaculty().getId();
            }

            if (dto.getRole() != null && !facultyAccessService.isSuperAdmin()) {
                Role newRole = Role.valueOf(dto.getRole());
                if (newRole == Role.SUPER_ADMIN) {
                    return ResponseEntity.status(403).build();
                }
            }

            boolean allowRoleChange = facultyAccessService.isSuperAdmin() || dto.getRole() == null
                    || !Role.valueOf(dto.getRole()).equals(Role.SUPER_ADMIN);

            User updated = userService.updateUser(userId, dto, facultyIdToAssign, allowRoleChange);
            return ResponseEntity.ok(UserDto.fromUser(updated));
        }

        /**
         * Удаление пользователя.
         * SUPER_ADMIN — любые; ADMIN — только свой факультет и не супер-админов.
         */
        @DeleteMapping("/users/{userId}")
        public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
            User currentUser = facultyAccessService.getCurrentUser();
            if (currentUser == null || !facultyAccessService.isAdmin()) {
                return ResponseEntity.status(403).build();
            }

            User targetUser = userService.getById(userId);

            if (!facultyAccessService.isSuperAdmin()) {
                if (targetUser.getRole() == Role.SUPER_ADMIN) {
                    return ResponseEntity.status(403).build();
                }
                if (currentUser.getFaculty() == null
                        || targetUser.getFaculty() == null
                        || !currentUser.getFaculty().getId().equals(targetUser.getFaculty().getId())) {
                    return ResponseEntity.status(403).build();
                }
            }

            userService.deleteUser(userId);
            return ResponseEntity.noContent().build();
        }
}

