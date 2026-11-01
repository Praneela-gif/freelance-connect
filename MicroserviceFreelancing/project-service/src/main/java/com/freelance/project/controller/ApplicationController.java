package com.freelance.project.controller;

import com.freelance.project.entity.Application;
import com.freelance.project.event.ProjectEvent;
import com.freelance.project.kafka.ProjectKafkaProducer;
import com.freelance.project.repository.ApplicationRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ProjectKafkaProducer kafkaProducer;

    @PostMapping
    public ResponseEntity<?> applyForProject(@RequestHeader(value = "X-User-Id", required = false) Long freelancerId,
                                             @RequestHeader(value = "X-User-Role", required = false) String role,
                                             @RequestBody ApplicationRequest request) {
        if (freelancerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        if (!"FREELANCER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only FREELANCER users can apply for projects");
        }

        // Check if already applied
        Optional<Application> existing = applicationRepository.findByProjectIdAndFreelancerId(request.getProjectId(), freelancerId);
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("You have already applied for this project");
        }

        Application application = Application.builder()
                .projectId(request.getProjectId())
                .freelancerId(freelancerId)
                .proposal(request.getProposal())
                .bidAmount(request.getBidAmount())
                .status("PENDING")
                .build();

        Application saved = applicationRepository.save(application);

        // Emit Kafka event
        kafkaProducer.sendProjectEvent(ProjectEvent.builder()
                .eventType("BID_SUBMITTED")
                .projectId(request.getProjectId())
                .freelancerId(freelancerId)
                .details("Bid submitted for amount: ₹" + request.getBidAmount())
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getProjectApplications(@PathVariable Long projectId) {
        List<Application> applications = applicationRepository.findByProjectId(projectId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/freelancer")
    public ResponseEntity<?> getFreelancerApplications(@RequestHeader(value = "X-User-Id", required = false) Long freelancerId) {
        if (freelancerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        List<Application> applications = applicationRepository.findByFreelancerId(freelancerId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getApplicationById(@PathVariable Long id) {
        Optional<Application> appOpt = applicationRepository.findById(id);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Application not found");
        }
        return ResponseEntity.ok(appOpt.get());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Long id,
                                                     @RequestParam String status) {
        Optional<Application> appOpt = applicationRepository.findById(id);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Application not found");
        }

        String appStatus = status.toUpperCase();
        if (!List.of("ACCEPTED", "REJECTED").contains(appStatus)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid status. Must be ACCEPTED or REJECTED");
        }

        Application application = appOpt.get();
        application.setStatus(appStatus);

        // If accepted, set other applications for same project to REJECTED
        if ("ACCEPTED".equals(appStatus)) {
            List<Application> projectApps = applicationRepository.findByProjectId(application.getProjectId());
            for (Application other : projectApps) {
                if (!other.getId().equals(application.getId())) {
                    other.setStatus("REJECTED");
                    applicationRepository.save(other);
                }
            }
        }

        Application saved = applicationRepository.save(application);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/submit-work")
    public ResponseEntity<?> submitWork(@RequestHeader(value = "X-User-Id", required = false) Long freelancerId,
                                        @RequestHeader(value = "X-User-Role", required = false) String role,
                                        @PathVariable Long id,
                                        @RequestBody WorkSubmissionRequest request) {
        if (freelancerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        if (!"FREELANCER".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only FREELANCER users can submit work");
        }

        Optional<Application> appOpt = applicationRepository.findById(id);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Application record not found");
        }

        Application application = appOpt.get();
        if (!application.getFreelancerId().equals(freelancerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not the hired freelancer for this project");
        }

        application.setDeliverableUrl(request.getDeliverableUrl());
        application.setDeliveryStatus("PENDING");
        application.setDeliveryNotes(request.getNotes());

        Application saved = applicationRepository.save(application);

        // Emit Kafka event
        kafkaProducer.sendProjectEvent(ProjectEvent.builder()
                .eventType("DELIVERABLE_SUBMITTED")
                .projectId(application.getProjectId())
                .freelancerId(freelancerId)
                .details("Deliverables submitted: " + request.getDeliverableUrl())
                .build());

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/review-work")
    public ResponseEntity<?> reviewWork(@PathVariable Long id,
                                        @RequestBody WorkReviewRequest request) {
        Optional<Application> appOpt = applicationRepository.findById(id);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Application record not found");
        }

        String status = request.getDeliveryStatus().toUpperCase();
        if (!List.of("APPROVED", "REJECTED", "CHANGES_REQUESTED").contains(status)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid review status. Must be APPROVED, REJECTED, or CHANGES_REQUESTED");
        }

        Application application = appOpt.get();
        application.setDeliveryStatus(status);
        if (request.getNotes() != null) {
            application.setDeliveryNotes(request.getNotes());
        }

        Application saved = applicationRepository.save(application);

        // Emit Kafka event
        kafkaProducer.sendProjectEvent(ProjectEvent.builder()
                .eventType("DELIVERABLE_REVIEWED")
                .projectId(application.getProjectId())
                .freelancerId(application.getFreelancerId())
                .details("Deliverable reviewed outcome: " + status)
                .build());

        return ResponseEntity.ok(saved);
    }

    @Data
    public static class ApplicationRequest {
        private Long projectId;
        private String proposal;
        private BigDecimal bidAmount;
    }

    @Data
    public static class WorkSubmissionRequest {
        private String deliverableUrl;
        private String notes;
    }

    @Data
    public static class WorkReviewRequest {
        private String deliveryStatus;
        private String notes;
    }
}
