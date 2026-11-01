package com.freelance.user.controller;

import com.freelance.user.entity.AdminDelegation;
import com.freelance.user.entity.Role;
import com.freelance.user.entity.User;
import com.freelance.user.repository.AdminDelegationRepository;
import com.freelance.user.repository.UserRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminDelegationRepository delegationRepository;

    @PostMapping("/delegate")
    public ResponseEntity<?> delegatePrivilege(@RequestHeader("X-User-Role") String userRole,
                                               @RequestHeader("X-User-Id") Long adminId,
                                               @RequestBody DelegationRequest request) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin only endpoint.");
        }

        Optional<User> adminOpt = userRepository.findById(adminId);
        Optional<User> assistantOpt = userRepository.findByEmail(request.getAssistantEmail());

        if (adminOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Admin user not found");
        }
        if (assistantOpt.isEmpty() || assistantOpt.get().getRole() != Role.ASSISTANT) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Assistant with specified email not found");
        }

        User admin = adminOpt.get();
        User assistant = assistantOpt.get();

        // Check if privilege is valid
        String privilege = request.getPrivilege().toUpperCase();
        if (!List.of("MANAGE_USERS", "REMOVE_PROJECTS", "VIEW_REPORTS").contains(privilege)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid privilege. Use MANAGE_USERS, REMOVE_PROJECTS, or VIEW_REPORTS");
        }

        // Check if already active
        Optional<AdminDelegation> existing = delegationRepository.findByAssistantIdAndPrivilegeAndIsActiveTrue(assistant.getId(), privilege);
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Privilege already delegated to this assistant");
        }

        LocalDateTime expiresAt = null;
        if (request.getDurationMinutes() != null && request.getDurationMinutes() > 0) {
            expiresAt = LocalDateTime.now().plusMinutes(request.getDurationMinutes());
        }

        AdminDelegation delegation = AdminDelegation.builder()
                .admin(admin)
                .assistant(assistant)
                .privilege(privilege)
                .expiresAt(expiresAt)
                .isActive(true)
                .build();

        delegationRepository.save(delegation);
        return ResponseEntity.ok("Privilege " + privilege + " successfully delegated to assistant " + assistant.getName());
    }

    @GetMapping("/delegations")
    public ResponseEntity<?> getDelegations(@RequestHeader("X-User-Role") String userRole,
                                            @RequestHeader("X-User-Id") Long adminId) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin only endpoint.");
        }
        List<AdminDelegation> delegations = delegationRepository.findByAdminId(adminId);
        return ResponseEntity.ok(delegations);
    }

    @DeleteMapping("/delegate/{delegationId}")
    public ResponseEntity<?> revokeDelegation(@RequestHeader("X-User-Role") String userRole,
                                              @PathVariable Long delegationId) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin only endpoint.");
        }

        Optional<AdminDelegation> delegationOpt = delegationRepository.findById(delegationId);
        if (delegationOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Delegation record not found");
        }

        AdminDelegation delegation = delegationOpt.get();
        delegation.setActive(false);
        delegationRepository.save(delegation);

        return ResponseEntity.ok("Delegation revoked successfully");
    }

    @GetMapping("/assistants")
    public ResponseEntity<?> getAssistants(@RequestHeader("X-User-Role") String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin only endpoint.");
        }
        // Return all assistant users (filter by role)
        List<User> assistants = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ASSISTANT)
                .peek(u -> u.setPassword(null))
                .toList();
        return ResponseEntity.ok(assistants);
    }

    @Data
    public static class DelegationRequest {
        private String assistantEmail;
        private String privilege;
        private Integer durationMinutes;
    }
}
