package com.freelance.project.controller;

import com.freelance.project.entity.Project;
import com.freelance.project.event.ProjectEvent;
import com.freelance.project.kafka.ProjectKafkaProducer;
import com.freelance.project.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectKafkaProducer kafkaProducer;

    @PostMapping
    public ResponseEntity<?> createProject(@RequestHeader(value = "X-User-Id", required = false) Long clientId,
                                           @RequestHeader(value = "X-User-Role", required = false) String role,
                                           @RequestBody ProjectRequest request) {
        if (clientId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        if (!"CLIENT".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only CLIENT users can post projects");
        }

        Project project = Project.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .budget(request.getBudget())
                .deadline(request.getDeadline())
                .clientId(clientId)
                .skills(request.getSkills())
                .status("OPEN")
                .build();

        Project savedProject = projectRepository.save(project);

        // Emit Kafka event
        kafkaProducer.sendProjectEvent(ProjectEvent.builder()
                .eventType("PROJECT_CREATED")
                .projectId(savedProject.getProjectId())
                .clientId(clientId)
                .details("Created project: " + savedProject.getTitle() + " with budget ₹" + savedProject.getBudget())
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(savedProject);
    }

    @GetMapping
    public ResponseEntity<?> getProjects(@RequestParam(required = false) String query,
                                         @RequestParam(required = false) String skill) {
        List<Project> projects = projectRepository.searchOpenProjects(query, skill);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<?> getProjectById(@PathVariable Long projectId) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found");
        }
        return ResponseEntity.ok(projectOpt.get());
    }

    @GetMapping("/client")
    public ResponseEntity<?> getClientProjects(@RequestHeader(value = "X-User-Id", required = false) Long clientId) {
        if (clientId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        List<Project> projects = projectRepository.findByClientId(clientId);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/freelancer")
    public ResponseEntity<?> getFreelancerProjects(@RequestHeader(value = "X-User-Id", required = false) Long freelancerId) {
        if (freelancerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        List<Project> projects = projectRepository.findByFreelancerId(freelancerId);
        return ResponseEntity.ok(projects);
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<?> updateProject(@RequestHeader(value = "X-User-Id", required = false) Long clientId,
                                           @PathVariable Long projectId,
                                           @RequestBody ProjectRequest request) {
        if (clientId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found");
        }

        Project project = projectOpt.get();
        if (!project.getClientId().equals(clientId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only modify your own projects");
        }

        if (request.getTitle() != null) project.setTitle(request.getTitle());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getBudget() != null) project.setBudget(request.getBudget());
        if (request.getDeadline() != null) project.setDeadline(request.getDeadline());
        if (request.getSkills() != null) project.setSkills(request.getSkills());

        Project savedProject = projectRepository.save(project);
        return ResponseEntity.ok(savedProject);
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteProject(@RequestHeader(value = "X-User-Id", required = false) Long userId,
                                           @RequestHeader(value = "X-User-Role", required = false) String role,
                                           @RequestHeader(value = "X-User-Privileges", required = false) String privileges,
                                           @PathVariable Long projectId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found");
        }

        Project project = projectOpt.get();

        boolean isOwner = "CLIENT".equals(role) && project.getClientId().equals(userId);
        boolean isAdmin = "ADMIN".equals(role);
        boolean isAssistantWithPrivilege = false;

        if ("ASSISTANT".equals(role) && privileges != null) {
            List<String> privList = Arrays.asList(privileges.split(","));
            isAssistantWithPrivilege = privList.contains("REMOVE_PROJECTS");
        }

        if (!isOwner && !isAdmin && !isAssistantWithPrivilege) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Insufficient permissions to delete project.");
        }

        projectRepository.delete(project);

        // Emit Kafka event
        kafkaProducer.sendProjectEvent(ProjectEvent.builder()
                .eventType("PROJECT_DELETED")
                .projectId(projectId)
                .clientId(project.getClientId())
                .details("Project deleted by role " + role)
                .build());

        return ResponseEntity.ok("Project deleted successfully");
    }

    @PutMapping("/{projectId}/hire")
    public ResponseEntity<?> hireFreelancer(@RequestHeader(value = "X-User-Id", required = false) Long clientId,
                                            @PathVariable Long projectId,
                                            @RequestParam Long freelancerId) {
        if (clientId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found");
        }

        Project project = projectOpt.get();
        if (!project.getClientId().equals(clientId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only the project owner can hire freelancers");
        }

        project.setFreelancerId(freelancerId);
        project.setStatus("IN_PROGRESS");
        Project savedProject = projectRepository.save(project);

        // Emit Kafka event
        kafkaProducer.sendProjectEvent(ProjectEvent.builder()
                .eventType("FREELANCER_HIRED")
                .projectId(projectId)
                .clientId(clientId)
                .freelancerId(freelancerId)
                .details("Client hired Freelancer ID: " + freelancerId)
                .build());

        return ResponseEntity.ok(savedProject);
    }

    @PutMapping("/{projectId}/complete")
    public ResponseEntity<?> completeProject(@RequestHeader(value = "X-User-Id", required = false) Long userId,
                                             @RequestHeader(value = "X-User-Role", required = false) String role,
                                             @PathVariable Long projectId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication required");
        }
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found");
        }

        Project project = projectOpt.get();
        boolean isClient = "CLIENT".equals(role) && project.getClientId().equals(userId);
        boolean isFreelancer = "FREELANCER".equals(role) && userId.equals(project.getFreelancerId());
        boolean isAdmin = "ADMIN".equals(role);

        if (!isClient && !isFreelancer && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only involved client, hired freelancer, or admin can complete the project");
        }

        project.setStatus("COMPLETED");
        Project savedProject = projectRepository.save(project);

        // Emit Kafka event
        kafkaProducer.sendProjectEvent(ProjectEvent.builder()
                .eventType("PROJECT_COMPLETED")
                .projectId(projectId)
                .clientId(project.getClientId())
                .freelancerId(project.getFreelancerId())
                .details("Project marked as COMPLETED")
                .build());

        return ResponseEntity.ok(savedProject);
    }

    @lombok.Data
    public static class ProjectRequest {
        private String title;
        private String description;
        private BigDecimal budget;
        private LocalDate deadline;
        private String skills;
    }
}
