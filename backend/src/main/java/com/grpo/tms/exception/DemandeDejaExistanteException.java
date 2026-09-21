package com.grpo.tms.exception;

public class DemandeDejaExistanteException extends RuntimeException {
    public DemandeDejaExistanteException(String message) {
        super(message);
    }
}