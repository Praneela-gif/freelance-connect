package com.freelance.project.service;

import com.freelance.project.event.ProjectEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ProjectEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(ProjectEventPublisher.class);

    public void sendProjectEvent(ProjectEvent event) {
        log.info("Domain Event [{}]: Project ID={}, Client ID={}, Details={}",
                event.getEventType(), event.getProjectId(), event.getClientId(), event.getDetails());
    }
}