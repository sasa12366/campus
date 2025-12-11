package org.ksu.schedule.service.impl;

import lombok.RequiredArgsConstructor;
import org.ksu.schedule.domain.Faculty;
import org.ksu.schedule.domain.Role;
import org.ksu.schedule.domain.User;
import org.ksu.schedule.repository.FacultyRepository;
import org.ksu.schedule.repository.UserRepository;
import org.ksu.schedule.rest.dto.UserDto;
import org.ksu.schedule.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * Реализация интерфейса {@link UserService}.
 *
 * @version 1.0
 * @autor Егор Гришанов
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;


    @Autowired
    private PasswordEncoder passwordEncoder;

    private final Logger logger = Logger.getLogger(UserServiceImpl.class.getName());

    /**
     * Получает пользователя по email.
     *
     * @param email электронная почта пользователя
     * @return найденный пользователь
     */
    @Override
    public Optional<User> getByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Обновляет информацию о студенте.
     *
     * @param email электронная почта студента
     * @param lastName фамилия студента
     * @param firstName имя студента
     * @param middleName отчество студента
     * @return обновленный студент
     */
    @Override
    public Optional<User> updateStudent(String email, String lastName, String firstName, String middleName) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            user.get().setLastName(lastName);
            user.get().setFirstName(firstName);
            user.get().setMiddleName(middleName);
            userRepository.save(user.get());
        }
        return user;
    }

    /**
     * Обновляет информацию о преподавателе.
     *
     * @param email электронная почта преподавателя
     * @param lastName фамилия преподавателя
     * @param firstName имя преподавателя
     * @param middleName отчество преподавателя
     * @param info информация о преподавателе
     * @return обновленный преподаватель
     */
    @Override
    public Optional<User> updateTeacher(String email, String lastName, String firstName, String middleName, String info) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            user.get().setLastName(lastName);
            user.get().setFirstName(firstName);
            user.get().setMiddleName(middleName);
            user.get().setInfo(info);
            userRepository.save(user.get());
        }
        return user;
    }


    @Override
    public void updatePassword(User user, String newPassword) {
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);
        userRepository.save(user);
        logger.info("Password for user {} was updated. Encoded password: {}" + user.getEmail() + encodedPassword);
    }

    @Override
    public Optional<User> updateStudentGroupAndFaculty(String email, String groupName, String subgroupName, String facultyName) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            user.get().setGroup_number(groupName);
            user.get().setSubgroup_number(subgroupName);
            user.get().setFaculty(facultyRepository.findByFacultyName(facultyName));
            userRepository.save(user.get());
        }
        return user;
    }

    @Override
    public User findUserByFullName(String fullName) {


        // Убираем лишние пробелы и нормализуем ввод
        fullName = fullName.trim();


        // Разделяем ФИО на части
        String[] nameParts = fullName.split("\\s+");


        // Проверяем, что формат соответствует "Фамилия И.О." или "Фамилия И.О."
        if (nameParts.length < 2 || nameParts.length > 3) {
            throw new IllegalArgumentException("Полное имя должно содержать две или три части: Фамилия И.О. или Фамилия И.О.");
        }

        String lastName = nameParts[0];
        String firstInitial = "";
        String middleInitial = "";

        if (nameParts.length == 2) {
            // Если имя и отчество объединены
            if (nameParts[1].length() != 4 || !nameParts[1].endsWith(".")) {
                throw new IllegalArgumentException("Имя и отчество должны быть в формате инициалов: И.О.");
            }
            firstInitial = nameParts[1].substring(0, 1).toUpperCase();
            middleInitial = nameParts[1].substring(2, 3).toUpperCase();
        } else {
            // Если имя и отчество разделены
            if (nameParts[1].length() != 2 || nameParts[2].length() != 2) {
                throw new IllegalArgumentException("Имя и отчество должны быть в формате инициалов: И.О.");
            }
            if (!nameParts[1].endsWith(".") || !nameParts[2].endsWith(".")) {
                throw new IllegalArgumentException("Инициал имени и отчества должны заканчиваться точкой.");
            }
            firstInitial = nameParts[1].substring(0, 1).toUpperCase();
            middleInitial = nameParts[2].substring(0, 1).toUpperCase();
        }

        // Выполняем поиск в базе данных
        String finalFullName = fullName;
        return userRepository.findByLastNameAndInitials(lastName, firstInitial, middleInitial)
                .orElseThrow(() -> {
                    return new IllegalArgumentException("Пользователь с ФИО " + finalFullName + " не найден.");
                });
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public List<User> getUsersByFaculty(Integer facultyId) {
        if (facultyId == null) {
            return List.of();
        }
        return userRepository.findByFaculty_Id(facultyId);
    }

    @Override
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }

    @Override
    public User updateUserRole(Long userId, Role role, Integer facultyId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        
        user.setRole(role);
        
        if (facultyId != null) {
            Faculty faculty = facultyRepository.findById(facultyId)
                    .orElseThrow(() -> new RuntimeException("Факультет не найден"));
            user.setFaculty(faculty);
        } else {
            user.setFaculty(null);
        }
        
        return userRepository.save(user);
    }

    @Override
    public User createAdmin(UserDto userDto) {
        // Проверяем, существует ли пользователь с таким email
        if (userRepository.findByEmail(userDto.getEmail()).isPresent()) {
            throw new RuntimeException("Пользователь с таким email уже существует");
        }
        
        String rawPassword = userDto.getPassword() != null && !userDto.getPassword().isBlank()
                ? userDto.getPassword()
                : "admin123";

        User newUser = User.builder()
                .firstName(userDto.getFirstName())
                .lastName(userDto.getLastName())
                .middleName(userDto.getMiddleName())
                .email(userDto.getEmail())
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.valueOf(userDto.getRole()))
                .group_number("")
                .subgroup_number("")
                .build();
        
        if (userDto.getFacultyId() != null) {
            Faculty faculty = facultyRepository.findById(userDto.getFacultyId())
                    .orElseThrow(() -> new RuntimeException("Факультет не найден"));
            newUser.setFaculty(faculty);
        }
        
        return userRepository.save(newUser);
    }

    @Override
    public User updateUser(Long userId, UserDto dto, Integer targetFacultyId, boolean allowRoleChange) {
        User user = getById(userId);

        if (dto.getFirstName() != null) user.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) user.setLastName(dto.getLastName());
        if (dto.getMiddleName() != null) user.setMiddleName(dto.getMiddleName());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getGroupNumber() != null) user.setGroup_number(dto.getGroupNumber());
        if (dto.getSubgroupNumber() != null) user.setSubgroup_number(dto.getSubgroupNumber());
        if (dto.getInfo() != null) user.setInfo(dto.getInfo());

        if (allowRoleChange && dto.getRole() != null) {
            user.setRole(Role.valueOf(dto.getRole()));
        }

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        if (targetFacultyId != null) {
            Faculty faculty = facultyRepository.findById(targetFacultyId)
                    .orElseThrow(() -> new RuntimeException("Факультет не найден"));
            user.setFaculty(faculty);
        } else {
            user.setFaculty(null);
        }

        return userRepository.save(user);
    }

    @Override
    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }
}
