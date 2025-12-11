package org.ksu.schedule.service.impl.exception;

import lombok.Getter;
import org.ksu.schedule.domain.Schedule;

@Getter
public class ScheduleConflictException extends RuntimeException {
    private final Schedule conflict;

    public ScheduleConflictException(Schedule conflict, String message) {
        super(message);
        this.conflict = conflict;
    }
}

