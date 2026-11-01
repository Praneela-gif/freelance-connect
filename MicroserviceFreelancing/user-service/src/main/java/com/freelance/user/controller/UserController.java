package com.freelance.user.controller;

import com.freelance.user.entity.Profile;
import com.freelance.user.entity.Role;
import com.freelance.user.entity.User;
import com.freelance.user.repository.ProfileRepository;
import com.freelance.user.repository.UserRepository;
import com.freelance.user.event.UserEvent;
import com.freelance.user.service.UserEventPublisher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserEventPublisher eventPublisher;

    @GetMapping("/profile")
    public ResponseEntity<?> getMyProfile(@RequestHeader("X-User-Id") Long userId) {
        Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Profile not found");
        }
        return ResponseEntity.ok(profileOpt.get());
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long userId) {
        Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Profile not found");
        }
        return ResponseEntity.ok(profileOpt.get());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestHeader("X-User-Id") Long userId,
                                           @RequestBody ProfileUpdateRequest request) {
        Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Profile not found");
        }

        Profile profile = profileOpt.get();
        if (request.getCompanyName() != null) profile.setCompanyName(request.getCompanyName());
        if (request.getSkills() != null) profile.setSkills(request.getSkills());
        if (request.getExperience() != null) profile.setExperience(request.getExperience());
        if (request.getPortfolio() != null) profile.setPortfolio(request.getPortfolio());

        Profile savedProfile = profileRepository.save(profile);
        return ResponseEntity.ok(savedProfile);
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers(@RequestHeader("X-User-Role") String userRole,
                                         @RequestHeader(value = "X-User-Privileges", required = false) String privileges) {
        if (!isAdminOrHasPrivilege(userRole, privileges, "MANAGE_USERS")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Insufficient permissions.");
        }
        List<User> users = userRepository.findAll();
        // Clear passwords for safety
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @PostMapping("/{targetUserId}/block")
    public ResponseEntity<?> blockUser(@RequestHeader("X-User-Role") String userRole,
                                       @RequestHeader(value = "X-User-Privileges", required = false) String privileges,
                                       @PathVariable Long targetUserId) {
        if (!isAdminOrHasPrivilege(userRole, privileges, "MANAGE_USERS")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Insufficient permissions.");
        }

        Optional<User> userOpt = userRepository.findById(targetUserId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOpt.get();
        user.setBlocked(true);
        userRepository.save(user);

        eventPublisher.sendUserEvent(UserEvent.builder()
                .eventType("USER_BLOCKED")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build());

        return ResponseEntity.ok("User blocked successfully");
    }

    @PostMapping("/{targetUserId}/unblock")
    public ResponseEntity<?> unblockUser(@RequestHeader("X-User-Role") String userRole,
                                         @RequestHeader(value = "X-User-Privileges", required = false) String privileges,
                                         @PathVariable Long targetUserId) {
        if (!isAdminOrHasPrivilege(userRole, privileges, "MANAGE_USERS")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Insufficient permissions.");
        }

        Optional<User> userOpt = userRepository.findById(targetUserId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOpt.get();
        user.setBlocked(false);
        userRepository.save(user);

        eventPublisher.sendUserEvent(UserEvent.builder()
                .eventType("USER_UNBLOCKED")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build());

        return ResponseEntity.ok("User unblocked successfully");
    }

    private boolean isAdminOrHasPrivilege(String role, String privileges, String requiredPrivilege) {
        if ("ADMIN".equals(role)) {
            return true;
        }
        if ("ASSISTANT".equals(role) && privileges != null) {
            List<String> privList = Arrays.asList(privileges.split(","));
            return privList.contains(requiredPrivilege);
        }
        return false;
    }

    @lombok.Data
    public static class ProfileUpdateRequest {
        private String companyName;
        private String skills;
        private String experience;
        private String portfolio;
    }
}