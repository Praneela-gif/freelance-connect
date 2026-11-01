package com.freelance.user.config;

import com.freelance.user.entity.AdminDelegation;
import com.freelance.user.entity.Profile;
import com.freelance.user.entity.Role;
import com.freelance.user.entity.User;
import com.freelance.user.repository.AdminDelegationRepository;
import com.freelance.user.repository.ProfileRepository;
import com.freelance.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class UserDataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private AdminDelegationRepository delegationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            // 1. Admin
            User admin = User.builder()
                    .name("System Administrator")
                    .email("admin@platform.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();
            User savedAdmin = userRepository.save(admin);
            profileRepository.save(Profile.builder().user(savedAdmin).build());

            // 2. Client
            User client = User.builder()
                    .name("TechCorp Solutions")
                    .email("client@techcorp.com")
                    .password(passwordEncoder.encode("client123"))
                    .role(Role.CLIENT)
                    .build();
            User savedClient = userRepository.save(client);
            profileRepository.save(Profile.builder()
                    .user(savedClient)
                    .companyName("TechCorp Global Inc.")
                    .build());

            // 3. Freelancer
            User freelancer = User.builder()
                    .name("Alex Rivera")
                    .email("freelancer@dev.com")
                    .password(passwordEncoder.encode("free123"))
                    .role(Role.FREELANCER)
                    .build();
            User savedFreelancer = userRepository.save(freelancer);
            profileRepository.save(Profile.builder()
                    .user(savedFreelancer)
                    .skills("React, Spring Boot, Kafka, Docker, Java")
                    .experience("5 years of full stack architecture")
                    .portfolio("https://github.com/freelancer-alex")
                    .build());

            // 4. Assistant
            User assistant = User.builder()
                    .name("Morgan Assistant")
                    .email("assistant@platform.com")
                    .password(passwordEncoder.encode("assist123"))
                    .role(Role.ASSISTANT)
                    .build();
            User savedAssistant = userRepository.save(assistant);
            profileRepository.save(Profile.builder().user(savedAssistant).build());

            // Seed active delegations for assistant
            delegationRepository.save(AdminDelegation.builder()
                    .admin(savedAdmin)
                    .assistant(savedAssistant)
                    .privilege("MANAGE_USERS")
                    .expiresAt(LocalDateTime.now().plusDays(30))
                    .isActive(true)
                    .build());

            delegationRepository.save(AdminDelegation.builder()
                    .admin(savedAdmin)
                    .assistant(savedAssistant)
                    .privilege("REMOVE_PROJECTS")
                    .expiresAt(LocalDateTime.now().plusDays(30))
                    .isActive(true)
                    .build());
        }
    }
}
