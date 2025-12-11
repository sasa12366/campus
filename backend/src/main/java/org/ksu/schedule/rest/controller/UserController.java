package org.ksu.schedule.rest.controller;

import lombok.RequiredArgsConstructor;
import org.ksu.schedule.domain.User;
import org.ksu.schedule.rest.dto.UserDto;
import org.ksu.schedule.service.FacultyAccessService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Контроллер для управления пользователями.
 *
 * @version 1.0
 * @author marselleze
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user")
public class UserController {

    private final FacultyAccessService facultyAccessService;

    /**
     * Получить данные текущего пользователя.
     *
     * @return данные текущего пользователя
     */
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        User user = facultyAccessService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(UserDto.fromUser(user));
    }
}
