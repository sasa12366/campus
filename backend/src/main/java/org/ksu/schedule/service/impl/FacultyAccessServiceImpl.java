package org.ksu.schedule.service.impl;

import lombok.RequiredArgsConstructor;
import org.ksu.schedule.domain.*;
import org.ksu.schedule.repository.UserRepository;
import org.ksu.schedule.service.FacultyAccessService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Реализация сервиса для контроля доступа администраторов по факультетам.
 *
 * @version 1.0
 * @author System
 */
@Service
@RequiredArgsConstructor
public class FacultyAccessServiceImpl implements FacultyAccessService {

    private final UserRepository userRepository;

    @Override
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return null;
        }
        
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    @Override
    public boolean hasAccessToFaculty(Integer facultyId) {
        User currentUser = getCurrentUser();
        
        if (currentUser == null) {
            return false;
        }
        
        // Суперадмин имеет доступ ко всем факультетам
        if (isSuperAdmin()) {
            return true;
        }
        
        // Обычный админ имеет доступ только к своему факультету
        if (currentUser.getRole() == Role.ADMIN) {
            if (currentUser.getFaculty() == null) {
                return false;
            }
            return currentUser.getFaculty().getId().equals(facultyId);
        }
        
        return false;
    }

    @Override
    public boolean isSuperAdmin() {
        User currentUser = getCurrentUser();
        return currentUser != null && currentUser.getRole() == Role.SUPER_ADMIN;
    }

    @Override
    public boolean isAdmin() {
        User currentUser = getCurrentUser();
        return currentUser != null && 
               (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.SUPER_ADMIN);
    }

    @Override
    public List<Group> filterGroupsByAccess(List<Group> groups) {
        if (isSuperAdmin()) {
            return groups;
        }
        
        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
            return groups;
        }
        
        if (currentUser.getFaculty() == null) {
            return List.of();
        }
        
        Integer userFacultyId = currentUser.getFaculty().getId();
        return groups.stream()
                .filter(group -> group.getFaculty() != null && 
                               group.getFaculty().getId().equals(userFacultyId))
                .collect(Collectors.toList());
    }

    @Override
    public List<Teacher> filterTeachersByAccess(List<Teacher> teachers) {
        if (isSuperAdmin()) {
            return teachers;
        }
        
        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
            return teachers;
        }
        
        if (currentUser.getFaculty() == null) {
            return List.of();
        }
        
        Integer userFacultyId = currentUser.getFaculty().getId();
        return teachers.stream()
                .filter(teacher -> teacher.getFaculty() != null && 
                                 teacher.getFaculty().getId().equals(userFacultyId))
                .collect(Collectors.toList());
    }

    @Override
    public List<Schedule> filterSchedulesByAccess(List<Schedule> schedules) {
        if (isSuperAdmin()) {
            return schedules;
        }
        
        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
            return schedules;
        }
        
        if (currentUser.getFaculty() == null) {
            return List.of();
        }
        
        Integer userFacultyId = currentUser.getFaculty().getId();
        return schedules.stream()
                .filter(schedule -> {
                    if (schedule.getSubgroup() == null) {
                        return false;
                    }
                    Group group = schedule.getSubgroup().getGroup();
                    return group != null && group.getFaculty() != null && 
                           group.getFaculty().getId().equals(userFacultyId);
                })
                .collect(Collectors.toList());
    }

    @Override
    public void checkAccessToGroup(Group group) {
        if (isSuperAdmin()) {
            return;
        }
        
        if (group == null || group.getFaculty() == null) {
            throw new SecurityException("Группа не имеет факультета");
        }
        
        if (!hasAccessToFaculty(group.getFaculty().getId())) {
            throw new SecurityException("Нет доступа к данному факультету");
        }
    }

    @Override
    public void checkAccessToTeacher(Teacher teacher) {
        if (isSuperAdmin()) {
            return;
        }
        
        if (teacher == null || teacher.getFaculty() == null) {
            throw new SecurityException("Преподаватель не имеет факультета");
        }
        
        if (!hasAccessToFaculty(teacher.getFaculty().getId())) {
            throw new SecurityException("Нет доступа к данному факультету");
        }
    }
}

