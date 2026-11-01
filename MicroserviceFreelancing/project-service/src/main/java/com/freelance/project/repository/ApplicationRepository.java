package com.freelance.project.repository;

import com.freelance.project.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByProjectId(Long projectId);
    List<Application> findByFreelancerId(Long freelancerId);
    Optional<Application> findByProjectIdAndFreelancerId(Long projectId, Long freelancerId);
}
