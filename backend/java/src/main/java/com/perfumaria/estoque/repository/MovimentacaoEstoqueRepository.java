package com.perfumaria.estoque.repository;

import com.perfumaria.estoque.model.MovimentacaoEstoque;
import com.perfumaria.estoque.model.MovimentacaoEstoque.TipoMovimentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

import java.time.LocalDateTime;
import java.util.List;

@RepositoryRestResource(exported = false) // fronted by InventoryController at /api/estoque instead
public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {

    List<MovimentacaoEstoque> findByTipoAndDataMovimentacaoBetween(
            TipoMovimentacao tipo, LocalDateTime inicio, LocalDateTime fim);
}
