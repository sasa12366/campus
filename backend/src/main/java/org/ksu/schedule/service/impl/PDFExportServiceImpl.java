package org.ksu.schedule.service.impl;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.ksu.schedule.domain.Schedule;
import org.ksu.schedule.domain.Subgroup;
import org.ksu.schedule.repository.SubgroupRepository;
import org.ksu.schedule.service.PDFExportService;
import org.ksu.schedule.service.ScheduleService;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Реализация сервиса для экспорта расписания в PDF.
 *
 * @version 1.0
 * @author System
 */
@Service
@RequiredArgsConstructor
public class PDFExportServiceImpl implements PDFExportService {

    private final ScheduleService scheduleService;
    private final SubgroupRepository subgroupRepository;

    private static final String[] DAYS_OF_WEEK = {
            "ПОНЕДЕЛЬНИК", "ВТОРНИК", "СРЕДА", "ЧЕТВЕРГ", "ПЯТНИЦА", "СУББОТА"
    };

    @Override
    public byte[] generateSchedulePDF(String groupNumber) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Заголовок
            Paragraph title = new Paragraph("Расписание занятий группы " + groupNumber)
                    .setFontSize(16)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER);
            document.add(title);
            document.add(new Paragraph("\n"));

            // Получить все подгруппы для группы
            List<Subgroup> subgroups = subgroupRepository.findByGroupNumber(groupNumber);
            
            if (subgroups.isEmpty()) {
                document.add(new Paragraph("Подгруппы для группы " + groupNumber + " не найдены."));
                document.close();
                return baos.toByteArray();
            }

            // Получить расписание для всех подгрупп группы
            List<Schedule> schedules = new ArrayList<>();
            for (Subgroup subgroup : subgroups) {
                List<Schedule> subgroupSchedules = scheduleService.getBySubgroupNumber(subgroup.getNumber());
                schedules.addAll(subgroupSchedules);
            }

            if (schedules.isEmpty()) {
                document.add(new Paragraph("Расписание для группы " + groupNumber + " не найдено."));
                document.close();
                return baos.toByteArray();
            }

            // Группировать по дням недели
            Map<String, List<Schedule>> schedulesByDay = schedules.stream()
                    .collect(Collectors.groupingBy(Schedule::getDayWeek));

            // Создать таблицу для каждого дня
            for (String day : DAYS_OF_WEEK) {
                List<Schedule> daySchedules = schedulesByDay.get(day);
                if (daySchedules == null || daySchedules.isEmpty()) {
                    continue;
                }

                // Заголовок дня
                Paragraph dayTitle = new Paragraph(day)
                        .setFontSize(14)
                        .setBold()
                        .setMarginTop(10);
                document.add(dayTitle);

                // Таблица расписания
                float[] columnWidths = {1, 2, 4, 3, 2, 2};
                Table table = new Table(UnitValue.createPercentArray(columnWidths));
                table.setWidth(UnitValue.createPercentValue(100));

                // Заголовки столбцов
                table.addHeaderCell(createHeaderCell("Время"));
                table.addHeaderCell(createHeaderCell("Тип"));
                table.addHeaderCell(createHeaderCell("Дисциплина"));
                table.addHeaderCell(createHeaderCell("Преподаватель"));
                table.addHeaderCell(createHeaderCell("Аудитория"));
                table.addHeaderCell(createHeaderCell("Периодичность"));

                // Сортировать по времени
                daySchedules.sort(Comparator.comparing(Schedule::getTimeStart));

                // Добавить строки
                for (Schedule schedule : daySchedules) {
                    String time = schedule.getTimeStart() + " - " + schedule.getTimeEnd();
                    String type = schedule.getSubject() != null ? schedule.getSubject().getType() : "";
                    String subject = schedule.getSubject() != null ? schedule.getSubject().getName() : "";
                    String teacher = schedule.getTeacher() != null ? schedule.getTeacher().getName() : "";
                    String classroom = schedule.getClassroom() != null ? schedule.getClassroom() : "";
                    String parity = schedule.getParity();

                    table.addCell(createCell(time));
                    table.addCell(createCell(type));
                    table.addCell(createCell(subject));
                    table.addCell(createCell(teacher));
                    table.addCell(createCell(classroom));
                    table.addCell(createCell(parity));
                }

                document.add(table);
            }

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Ошибка генерации PDF: " + e.getMessage(), e);
        }
    }

    private Cell createHeaderCell(String content) {
        return new Cell()
                .add(new Paragraph(content).setBold())
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY);
    }

    private Cell createCell(String content) {
        return new Cell()
                .add(new Paragraph(content != null ? content : ""))
                .setTextAlignment(TextAlignment.LEFT);
    }
}
