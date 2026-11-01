package com.freelance.project.config;

import com.freelance.project.entity.Application;
import com.freelance.project.entity.Project;
import com.freelance.project.repository.ApplicationRepository;
import com.freelance.project.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class ProjectDataInitializer implements CommandLineRunner {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Override
    public void run(String... args) {
        if (projectRepository.count() == 0) {
            Project p1 = Project.builder()
                    .title("Full Stack Freelance Marketplace Portal")
                    .description("Looking for an experienced engineer to build responsive dashboards, role-based workflows, and automated milestone tracking.")
                    .budget(new BigDecimal("50000"))
                    .deadline(LocalDate.now().plusDays(30))
                    .clientId(2L)
                    .skills("React, Spring Boot, Kafka, Docker")
                    .status("OPEN")
                    .build();

            Project p2 = Project.builder()
                    .title("Cloud Infrastructure & Containerization Setup")
                    .description("Need DevOps engineer to configure Docker Compose multi-service pipelines and Kafka event brokers for reliable microservice communications.")
                    .budget(new BigDecimal("35000"))
                    .deadline(LocalDate.now().plusDays(20))
                    .clientId(2L)
                    .skills("Docker, Kafka, Linux, CI/CD")
                    .status("OPEN")
                    .build();

            Project p3 = Project.builder()
                    .title("Interactive Analytics Dashboard UI")
                    .description("Design and code a high-performance analytics interface with charts, responsive grid layouts, and smooth animations in React.")
                    .budget(new BigDecimal("40000"))
                    .deadline(LocalDate.now().plusDays(40))
                    .clientId(2L)
                    .skills("React, Vite, CSS Grid, Chart.js")
                    .status("OPEN")
                    .build();

            Project savedP1 = projectRepository.save(p1);
            projectRepository.save(p2);
            projectRepository.save(p3);

            // Seed demo proposal from freelancer (ID 3)
            Application app = Application.builder()
                    .projectId(savedP1.getProjectId())
                    .freelancerId(3L)
                    .proposal("I have 4+ years of full stack experience building Spring Boot and React applications. I can deliver this project with high quality tests and documentation within 3 weeks.")
                    .bidAmount(new BigDecimal("48000"))
                    .status("PENDING")
                    .build();

            applicationRepository.save(app);
        }
    }
}
