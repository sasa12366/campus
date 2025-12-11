package org.ksu.schedule.rest.controller;

import lombok.RequiredArgsConstructor;
import org.ksu.schedule.service.PDFExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Контроллер для экспорта расписания в PDF.
 *
 * @version 1.0
 * @author System
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/schedule/export")
public class PDFExportController {

    private final PDFExportService pdfExportService;

    /**
     * Экспортировать расписание группы в PDF.
     *
     * @param groupNumber номер группы
     * @return PDF файл
     */
    @GetMapping("/pdf/{groupNumber}")
    public ResponseEntity<byte[]> exportScheduleToPDF(@PathVariable String groupNumber) {
        try {
            byte[] pdfBytes = pdfExportService.generateSchedulePDF(groupNumber);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "schedule_" + groupNumber + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error generating PDF for group " + groupNumber + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
