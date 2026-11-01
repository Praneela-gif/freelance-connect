package com.freelance.user.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_delegations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDelegation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assistant_id", nullable = false)
    private User assistant;

    @Column(nullable = false)
    private String privilege; // MANAGE_USERS, REMOVE_PROJECTS, VIEW_REPORTS

    private LocalDateTime expiresAt;

    @Builder.Default
    private boolean isActive = true;
}
