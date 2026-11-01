package com.freelance.user.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.freelance.user.event.UserEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class UserKafkaProducer {

    private static final Logger log = LoggerFactory.getLogger(UserKafkaProducer.class);
    private static final String TOPIC = "user-events";

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    public void sendUserEvent(UserEvent event) {
        try {
            if (kafkaTemplate != null) {
                String payload = objectMapper.writeValueAsString(event);
                kafkaTemplate.send(TOPIC, String.valueOf(event.getUserId()), payload);
                log.info("Emitted Kafka event to {}: {}", TOPIC, payload);
            } else {
                log.warn("KafkaTemplate not initialized, skipping event: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Failed to publish Kafka event to {}: {}", TOPIC, e.getMessage());
        }
    }
}
