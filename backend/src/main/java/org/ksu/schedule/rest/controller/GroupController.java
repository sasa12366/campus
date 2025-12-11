package org.ksu.schedule.rest.controller;

import lombok.RequiredArgsConstructor;
import org.ksu.schedule.domain.Group;
import org.ksu.schedule.rest.dto.GroupDto;
import org.ksu.schedule.service.FacultyAccessService;
import org.ksu.schedule.service.GroupService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Контроллер для управления группами.
 *
 * @version 1.0
 * @autor Егор Гришанов
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class GroupController {

    private final GroupService groupService;
    private final FacultyAccessService facultyAccessService;

    /**
     * Получение всех групп.
     * Фильтруется по факультету для обычных администраторов.
     *
     * @return список всех групп в формате GroupDto
     */
    @GetMapping("/batches")
    public List<GroupDto> getAllGroups() {
        List<Group> groups = groupService.getAll();
        
        // Фильтрация по доступу к факультетам
        if (facultyAccessService.isAdmin()) {
            groups = facultyAccessService.filterGroupsByAccess(groups);
        }
        
        return groups.stream()
                .map(GroupDto::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Добавление новой группы.
     * Проверяется доступ к факультету группы.
     *
     * @param groupDto данные новой группы
     * @return добавленная группа в формате GroupDto
     */
    @PostMapping("/batches")
    public GroupDto insertGroup(@RequestBody GroupDto groupDto) {
        Group groupToAdd = GroupDto.toDomain(groupDto);
        
        // Проверка доступа для администраторов
        if (facultyAccessService.isAdmin()) {
            facultyAccessService.checkAccessToGroup(groupToAdd);
        }
        
        Group group = groupService.addGroup(groupToAdd);
        return GroupDto.toDto(group);
    }

    /**
     * Обновление данных группы.
     * Проверяется доступ к факультету группы.
     *
     * @param id        идентификатор группы
     * @param number    номер группы
     * @param direction направление группы
     * @param profile   профиль группы
     * @param facultyId идентификатор факультета
     * @return обновленная группа в формате GroupDto
     */
    @PutMapping("/batches/{id}")
    public GroupDto updateGroup(@PathVariable int id,
                                @RequestParam String number,
                                @RequestParam String direction,
                                @RequestParam String profile,
                                @RequestParam Integer facultyId) {
        // Проверка доступа для администраторов
        if (facultyAccessService.isAdmin() && !facultyAccessService.hasAccessToFaculty(facultyId)) {
            throw new SecurityException("Нет доступа к данному факультету");
        }
        
        Group group = groupService.updateGroup(id, number, direction, profile, facultyId);
        return GroupDto.toDto(group);
    }

    /**
     * Удаление группы.
     * Проверяется доступ к факультету группы.
     *
     * @param id идентификатор группы
     */
    @DeleteMapping("/batches/{id}")
    public void deleteGroup(@PathVariable int id) {
        // Проверка доступа для администраторов
        if (facultyAccessService.isAdmin()) {
            Group group = groupService.getAll().stream()
                    .filter(g -> g.getId() == id)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Группа не найдена"));
            facultyAccessService.checkAccessToGroup(group);
        }
        
        groupService.deleteById(id);
    }

    /**
     * Получение групп по направлению.
     *
     * @param direction направление группы
     * @return список групп в формате GroupDto
     */
    @GetMapping("/batches/direction/{direction}")
    public List<GroupDto> getGroupByDirection(@PathVariable String direction) {
        return groupService.getByDirection(direction)
                .stream()
                .map(GroupDto::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Получение групп по профилю.
     *
     * @param profile профиль группы
     * @return список групп в формате GroupDto
     */
    @GetMapping("/batches/profile/{profile}")
    public List<GroupDto> getGroupByProfile(@PathVariable String profile) {
        return groupService.getByProfile(profile)
                .stream()
                .map(GroupDto::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Получение группы по номеру.
     *
     * @param number номер группы
     * @return группа в формате GroupDto
     */
    @GetMapping("/batches/number/{number}")
    public GroupDto getGroupByNumber(@PathVariable String number) {
        return GroupDto.toDto(groupService.getByNumber(number));
    }

    @GetMapping("/batches/faculty/name/{name}")
    public List<GroupDto> getGroupByFaculty(@PathVariable String name) {
        return groupService.getByFacultyName(name)
                .stream()
                .map(GroupDto::toDto)
                .collect(Collectors.toList());
    }
}
