package org.ksu.schedule.service;

import java.io.ByteArrayOutputStream;

/**
 * Сервис для экспорта расписания в PDF формат.
 *
 * @version 1.0
 * @author System
 */
public interface PDFExportService {

    /**
     * Генерировать PDF расписание для группы.
     *
     * @param groupNumber номер группы
     * @return PDF файл в виде байтового массива
     */
    byte[] generateSchedulePDF(String groupNumber);
}

