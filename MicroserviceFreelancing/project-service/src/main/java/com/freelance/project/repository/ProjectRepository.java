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
           "(CAST(:query AS string) IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))) AND " +
           "(CAST(:skill AS string) IS NULL OR LOWER(p.skills) LIKE LOWER(CONCAT('%', CAST(:skill AS string), '%')))")
    List<Project> searchOpenProjects(@Param("query") String query, @Param("skill") String skill);
}