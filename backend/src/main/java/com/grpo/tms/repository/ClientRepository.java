package com.grpo.tms.repository;

import com.grpo.tms.entity.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    /**
     * Recherche sur les champs GARANTIS dans Client.java :
     * raisonSociale, matriculeFiscale, email, telephone, adresseComplete
     * (nom/ville/adresse sont optionnels — retirés pour éviter UnknownPathException)
     */
    @Query("""
        SELECT c FROM Client c
        WHERE lower(c.raisonSociale)    LIKE :pattern
           OR lower(c.matriculeFiscale) LIKE :pattern
           OR lower(c.email)            LIKE :pattern
           OR lower(c.telephone)        LIKE :pattern
           OR lower(c.adresseComplete)  LIKE :pattern
        """)
    Page<Client> search(@Param("pattern") String pattern, Pageable pageable);

    long countByActifTrue();
}