package com.freelance.user.controller;

import com.freelance.user.entity.AdminDelegation;
import com.freelance.user.entity.Profile;
import com.freelance.user.entity.Role;
import com.freelance.user.entity.User;
import com.freelance.user.repository.AdminDelegationRepository;
import com.freelance.user.repository.ProfileRepository;
import com.freelance.user.repository.UserRepository;
import com.freelance.user.service.JwtService;
import com.freelance.user.service.UserEventPublisher;
import com.freelance.user.event.UserEvent;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private AdminDelegationRepository delegationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserEventPublisher eventPublisher;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is already taken");
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid Role. Must be CLIENT, FREELANCER, ADMIN or ASSISTANT");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        User savedUser = userRepository.save(user);

        Profile profile = Profile.builder()
                .user(savedUser)
                .companyName(request.getCompanyName())
                .skills(request.getSkills())
                .experience(request.getExperience())
                .portfolio(request.getPortfolio())
                .build();

        profileRepository.save(profile);

        // Emit domain event
        eventPublisher.sendUserEvent(UserEvent.builder()
                .eventType("USER_REGISTERED")
                .userId(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        // Fetch privileges if user is ASSISTANT
        List<String> privileges = new ArrayList<>();
        if (user.getRole() == Role.ASSISTANT) {
            privileges = delegationRepository.findByAssistantIdAndIsActiveTrue(user.getId())
                    .stream()
                    .map(AdminDelegation::getPrivilege)
                    .collect(Collectors.toList());
        }

        String token = jwtService.generateToken(user, privileges);

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().name());
        response.setPrivileges(privileges);

        return ResponseEntity.ok(response);
    }

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String role;
        private String companyName;
        private String skills;
        private String experience;
        private String portfolio;
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class LoginResponse {
        private String token;
        private Long id;
        private String name;
        private String email;
        private String role;
        private List<String> privileges;
    }
}