package com.freelance.project.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.freelance.project.event.ProjectEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class ProjectKafkaProducer {

    private static final Logger log = LoggerFactory.getLogger(ProjectKafkaProducer.class);
    private static final String TOPIC = "project-events";

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    public void sendProjectEvent(ProjectEvent event) {
        try {
            if (kafkaTemplate != null) {
                String payload = objectMapper.writeValueAsString(event);
                kafkaTemplate.send(TOPIC, String.valueOf(event.getProjectId()), payload);
                log.info("Emitted Kafka event to {}: {}", TOPIC, payload);
            } else {
                log.warn("KafkaTemplate not initialized, skipping event: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Failed to publish Kafka event to {}: {}", TOPIC, e.getMessage());
        }
    }
}
