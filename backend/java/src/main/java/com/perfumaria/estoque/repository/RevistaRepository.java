package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.Revista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RevistaRepository extends JpaRepository<Revista, Long> {

    /** Fetches the marca in the same query; archived brands' magazines are hidden with them. */
    @Query("select r from Revista r join fetch r.marca m where m.active = true order by m.nome, r.titulo")
    List<Revista> findAllActive();
}
