package com.perfumaria.estoque.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers Hibernate6Module so Jackson can serialize entities with lazy
 * associations (Hibernate proxies) instead of failing on their internal fields.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Hibernate6Module hibernate6Module() {
        Hibernate6Module module = new Hibernate6Module();
        // open-in-view keeps the session around for the response, so it's safe
        // to actually fetch lazy associations instead of writing them as null.
        module.enable(Hibernate6Module.Feature.FORCE_LAZY_LOADING);
        // Otherwise the module treats JPA's @Transient the same as @JsonIgnore, which
        // silently drops computed getters like Produto.getQuantidadeTotal() from the JSON.
        module.disable(Hibernate6Module.Feature.USE_TRANSIENT_ANNOTATION);
        return module;
    }
}
