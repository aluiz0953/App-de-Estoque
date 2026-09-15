package com.perfumaria.estoque;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application class for the Perfume Inventory Management System.
 * This is a Spring Boot application that provides REST APIs for inventory management.
 */
@SpringBootApplication
@EnableScheduling
public class PerfumariaEstoqueApplication {

    public static void main(String[] args) {
        SpringApplication.run(PerfumariaEstoqueApplication.class, args);
    }
}