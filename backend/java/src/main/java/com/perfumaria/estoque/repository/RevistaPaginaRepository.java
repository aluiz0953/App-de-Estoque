package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.RevistaPagina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface RevistaPaginaRepository extends JpaRepository<RevistaPagina, Long> {

    /** Just the image bytes - no entity, no lazy revista. */
    @Query("select p.imagem from RevistaPagina p where p.revista.id = :revistaId and p.numero = :numero")
    Optional<byte[]> findImagem(@Param("revistaId") Long revistaId, @Param("numero") int numero);

    @Transactional
    @Modifying
    @Query("delete from RevistaPagina p where p.revista.id = :revistaId")
    void deleteByRevistaId(@Param("revistaId") Long revistaId);
}
