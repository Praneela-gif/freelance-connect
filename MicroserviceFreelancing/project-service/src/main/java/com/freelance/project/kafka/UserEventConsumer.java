package com.freelance.project.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.freelance.project.event.UserEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class UserEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(UserEventConsumer.class);
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @KafkaListener(topics = "user-events", groupId = "project-service-group", autoStartup = "${spring.kafka.enabled:true}")
    public void consumeUserEvent(String message) {
        try {
            UserEvent event = objectMapper.readValue(message, UserEvent.class);
            log.info("Received user event from Kafka [user-events]: {} for user ID: {} ({})",
                    event.getEventType(), event.getUserId(), event.getEmail());
            // Project service is notified of user registrations / block status changes
        } catch (Exception e) {
            log.error("Error processing message from user-events: {}", e.getMessage());
        }
    }
}
