package com.freelance.project.repository;

import com.freelance.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByClientId(Long clientId);
    List<Project> findByFreelancerId(Long freelancerId);
    List<Project> findByStatus(String status);

    @Query("SELECT p FROM Project p WHERE p.status = 'OPEN' AND " +
           "(:query IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:skill IS NULL OR LOWER(p.skills) LIKE LOWER(CONCAT('%', :skill, '%')))")
    List<Project> searchOpenProjects(@Param("query") String query, @Param("skill") String skill);
}
