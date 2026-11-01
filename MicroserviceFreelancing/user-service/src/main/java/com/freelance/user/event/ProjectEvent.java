package com.freelance.user.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectEvent {
    private String eventType;
    private Long projectId;
    private Long clientId;
    private Long freelancerId;
    private String details;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
