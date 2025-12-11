package org.ksu.schedule.rest.controller;

import lombok.Data;

@Data
public class TokenRefreshRequest {
    private String refreshToken;
}

