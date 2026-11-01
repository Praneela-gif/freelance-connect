package com.freelance.user.repository;

import com.freelance.user.entity.AdminDelegation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminDelegationRepository extends JpaRepository<AdminDelegation, Long> {
    List<AdminDelegation> findByAssistantIdAndIsActiveTrue(Long assistantId);
    Optional<AdminDelegation> findByAssistantIdAndPrivilegeAndIsActiveTrue(Long assistantId, String privilege);
    List<AdminDelegation> findByAdminId(Long adminId);
}
