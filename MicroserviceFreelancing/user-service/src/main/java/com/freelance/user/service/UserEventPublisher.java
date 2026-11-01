package com.freelance.user.service;

import com.freelance.user.event.UserEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class UserEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(UserEventPublisher.class);

    public void sendUserEvent(UserEvent event) {
        log.info("Domain Event [{}]: User ID={}, Name={}, Role={}",
                event.getEventType(), event.getUserId(), event.getName(), event.getRole());
    }
}