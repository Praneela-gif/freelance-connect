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
public class UserEvent {
    private String eventType; // USER_REGISTERED, USER_BLOCKED, USER_UNBLOCKED
    private Long userId;
    private String name;
    private String email;
    private String role;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
