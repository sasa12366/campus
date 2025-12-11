package org.ksu.schedule.rest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.ksu.schedule.domain.Role;
import org.ksu.schedule.domain.User;

/**
 * DTO для сущности User.
 *
 * @version 1.0
 * @author System
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String middleName;
    private String email;
    private String password;
    private String groupNumber;
    private String subgroupNumber;
    private String info;
    private String role;
    private Integer facultyId;
    private String facultyName;

    /**
     * Преобразовать User в UserDto.
     *
     * @param user сущность User
     * @return DTO пользователя
     */
    public static UserDto fromUser(User user) {
        return UserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .middleName(user.getMiddleName())
                .email(user.getEmail())
                .groupNumber(user.getGroup_number())
                .subgroupNumber(user.getSubgroup_number())
                .info(user.getInfo())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .facultyId(user.getFaculty() != null ? user.getFaculty().getId() : null)
                .facultyName(user.getFaculty() != null ? user.getFaculty().getFacultyName() : null)
                .build();
    }
}

