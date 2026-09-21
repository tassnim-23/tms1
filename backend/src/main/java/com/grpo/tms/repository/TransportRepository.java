package com.grpo.tms.repository;

import com.grpo.tms.entity.Transport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TransportRepository extends JpaRepository<Transport, Long> {

    Page<Transport> findByStatut(String statut, Pageable pageable);

    long countByStatut(String statut);

    @Query("""
        SELECT t FROM Transport t WHERE
            LOWER(COALESCE(t.reference, ''))   LIKE LOWER(CONCAT('%', :s, '%')) OR
            LOWER(COALESCE(t.origine, ''))     LIKE LOWER(CONCAT('%', :s, '%')) OR
            LOWER(COALESCE(t.destination, '')) LIKE LOWER(CONCAT('%', :s, '%')) OR
            LOWER(COALESCE(t.statut, ''))      LIKE LOWER(CONCAT('%', :s, '%'))
    """)
    Page<Transport> search(@Param("s") String search, Pageable pageable);
}
