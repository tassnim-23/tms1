package com.grpo.tms.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Gestionnaire global d'exceptions pour l'API REST TMS.
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Construit un corps de réponse d'erreur standardisé.
     */
    private Map<String, Object> buildErrorBody(int status, String error, String message, String path) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status);
        body.put("error", error);
        body.put("message", message);
        body.put("path", path);
        return body;
    }

    /**
     * Gère les ressources non trouvées (404).
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ResponseBody
    public Map<String, Object> handleResourceNotFoundException(
            ResourceNotFoundException ex, HttpServletRequest request) {
        log.error("Resource non trouvée: {}", ex.getMessage());
        return buildErrorBody(404, "Not Found", ex.getMessage(), request.getRequestURI());
    }

    /**
     * Gère les requêtes invalides (400).
     */
    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public Map<String, Object> handleBadRequestException(
            BadRequestException ex, HttpServletRequest request) {
        log.error("Requête invalide: {}", ex.getMessage());
        return buildErrorBody(400, "Bad Request", ex.getMessage(), request.getRequestURI());
    }

    /**
     * Gère les erreurs de validation Bean Validation (400).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public Map<String, Object> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });

        Map<String, Object> body = buildErrorBody(400, "Validation Failed",
                "Des erreurs de validation ont été détectées", request.getRequestURI());
        body.put("errors", fieldErrors);
        log.error("Erreurs de validation: {}", fieldErrors);
        return body;
    }

    /**
     * Gère les violations de contraintes d'intégrité (409).
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    @ResponseBody
    public Map<String, Object> handleDataIntegrityViolation(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        log.error("Violation d'intégrité des données: {}", ex.getMessage());
        return buildErrorBody(409, "Conflict",
                "Cette opération viole une contrainte d'intégrité (données dupliquées).",
                request.getRequestURI());
    }

    /**
     * Gère les erreurs d'authentification (401).
     */
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    @ResponseBody
    public Map<String, Object> handleAuthenticationException(
            AuthenticationException ex, HttpServletRequest request) {
        log.error("Erreur d'authentification: {}", ex.getMessage());
        return buildErrorBody(401, "Unauthorized",
                "Authentification requise. Vérifiez vos identifiants.", request.getRequestURI());
    }

    /**
     * Gère les accès refusés (403).
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    @ResponseBody
    public Map<String, Object> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {
        log.error("Accès refusé: {}", ex.getMessage());
        return buildErrorBody(403, "Forbidden",
                "Vous n'avez pas les droits nécessaires pour accéder à cette ressource.",
                request.getRequestURI());
    }

    /**
     * Gère les erreurs génériques (500).
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ResponseBody
    public Map<String, Object> handleGenericException(
            Exception ex, HttpServletRequest request) {
        log.error("Erreur interne du serveur: {}", ex.getMessage(), ex);
        return buildErrorBody(500, "Internal Server Error",
                "Une erreur interne s'est produite. Veuillez réessayer ultérieurement.",
                request.getRequestURI());
    }
}
