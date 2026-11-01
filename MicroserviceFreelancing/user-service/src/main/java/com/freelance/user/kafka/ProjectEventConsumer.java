package com.freelance.user.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.freelance.user.event.ProjectEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class ProjectEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(ProjectEventConsumer.class);
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @KafkaListener(topics = "project-events", groupId = "user-service-group", autoStartup = "${spring.kafka.enabled:true}")
    public void consumeProjectEvent(String message) {
        try {
            ProjectEvent event = objectMapper.readValue(message, ProjectEvent.class);
            log.info("Received project event from Kafka [project-events]: {} for Project ID: {}, Client: {}, Freelancer: {}",
                    event.getEventType(), event.getProjectId(), event.getClientId(), event.getFreelancerId());
        } catch (Exception e) {
            log.error("Error processing message from project-events: {}", e.getMessage());
        }
    }
}
