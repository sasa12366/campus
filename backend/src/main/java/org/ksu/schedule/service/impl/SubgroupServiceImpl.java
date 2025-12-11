package org.ksu.schedule.service.impl;

import lombok.RequiredArgsConstructor;
import org.ksu.schedule.domain.Group;
import org.ksu.schedule.domain.Subgroup;
import org.ksu.schedule.repository.GroupRepository;
import org.ksu.schedule.repository.SubgroupRepository;
import org.ksu.schedule.service.SubgroupService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Реализация интерфейса {@link SubgroupService}.
 *
 * @version 1.0
 * @autor Егор Гришанов
 */
@Service
@RequiredArgsConstructor
public class SubgroupServiceImpl implements SubgroupService {

    private final SubgroupRepository subgroupRepository;
    private final GroupRepository groupRepository;

    /**
     * Вставляет новую подгруппу.
     *
     * @param id идентификатор подгруппы
     * @param number номер подгруппы
     * @param group_number номер группы
     * @return сохраненная подгруппа
     */
    @Override
    public Subgroup insert(String number, String group_number, Integer size) {
        if (group_number == null) {
            throw new RuntimeException("Номер группы обязателен для подгруппы");
        }
        Group groupId = groupRepository.findByNumber(group_number);

        if (groupId == null) {
            throw new RuntimeException("Группа не найдена");
        }

        Subgroup subgroup = Subgroup.builder()
                .number(number)
                .group(groupId)
                .size(size != null ? size : 0)
                .build();
        return subgroupRepository.saveAndFlush(subgroup);
    }

    /**
     * Обновляет подгруппу.
     *
     * @param id идентификатор подгруппы
     * @param number номер подгруппы
     * @param group_number номер группы
     * @return обновленная подгруппа
     */
    @Override
    public Subgroup update(int id, String number, String group_number, Integer size) {
        if (group_number == null) {
            throw new RuntimeException("Номер группы обязателен для подгруппы");
        }
        Group groupId = groupRepository.findByNumber(group_number);
        if (groupId == null) {
            throw new RuntimeException("Группа не найдена");
        }

        Subgroup existing = subgroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Подгруппа не найдена"));
        existing.setNumber(number);
        existing.setGroup(groupId);
        existing.setSize(size != null ? size : existing.getSize());

        return subgroupRepository.saveAndFlush(existing);
    }

    /**
     * Получает подгруппу по номеру.
     *
     * @param number номер подгруппы
     * @return подгруппа
     */
    @Override
    public Subgroup getByNumber(String number) {
        return subgroupRepository.findByNumber(number);
    }

    /**
     * Получает подгруппы по идентификатору группы.
     *
     * @param group_id идентификатор группы
     * @return список подгрупп
     */
    @Override
    public List<Subgroup> getByGroupId(int group_id) {
        return subgroupRepository.findByGroupId(group_id);
    }

    /**
     * Удаляет подгруппу по идентификатору.
     *
     * @param id идентификатор подгруппы
     */
    @Override
    public void deleteById(int id) {
        subgroupRepository.deleteById(id);
    }

    /**
     * Удаляет подгруппы по идентификатору группы.
     *
     * @param group_id идентификатор группы
     */
    @Override
    public void deleteByGroupId(int group_id) {
        subgroupRepository.deleteByGroupId(group_id);
    }

    /**
     * Получает все подгруппы.
     *
     * @return список всех подгрупп
     */
    @Override
    public List<Subgroup> getAll() {
        return subgroupRepository.findAll();
    }

    /**
     * Получает подгруппы по номеру группы.
     *
     * @param groupNumber номер группы
     * @return список подгрупп
     */
    @Override
    public List<Subgroup> getByGroupNumber(String groupNumber) {
        return subgroupRepository.findByGroupNumber(groupNumber);
    }
}
