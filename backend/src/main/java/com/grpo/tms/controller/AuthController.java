package com.grpo.tms.controller;

import com.grpo.tms.dto.*;
import com.grpo.tms.entity.User;
import com.grpo.tms.exception.BadRequestException;
import com.grpo.tms.repository.UserRepository;
import com.grpo.tms.service.UserDetailsServiceImpl;
import com.grpo.tms.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    // ── Méthode utilitaire : cherche par username OU email ────────────────
    private User findUser(String usernameOrEmail) {
        return userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable: " + usernameOrEmail));
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Tentative de connexion pour: {}", request.getUsername());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        String token = jwtUtil.generateToken(userDetails);

        // ✅ Cherche par username OU email
        User user = findUser(request.getUsername());

        // ── Vérification email obligatoire pour les clients ──────────
        if (user.getRoles().contains("CLIENT")
                && !Boolean.TRUE.equals(user.getEmailVerifie())) {
            return ResponseEntity.status(403).body(
                JwtResponse.builder()
                    .email(user.getEmail())
                    .statutApproval("EMAIL_NON_VERIFIE")
                    .build()
            );
        }

        // ✅ NOUVEAU: Récupérer statutApproval et clientId
        String statutApproval = user.getStatutApproval() != null 
                ? user.getStatutApproval().toString() 
                : "EN_ATTENTE";
        Long clientId = user.getClientId();

        JwtResponse response = JwtResponse.builder()
                .token(token)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoles())
                .role(user.getRoles().contains("ADMIN") ? "ADMIN" : "CLIENT")
                .statutApproval(statutApproval)
                .clientId(clientId)
                .build();

        log.info("Connexion réussie pour: {} (statut: {})", request.getUsername(), statutApproval);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Ce nom d'utilisateur est déjà pris: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Cet email est déjà utilisé: " + request.getEmail());
        }

        Set<String> roles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            roles.addAll(request.getRoles());
        } else {
            roles.add("USER");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(roles)
                .build();

        userRepository.save(user);
        log.info("Nouvel utilisateur enregistré: {}", request.getUsername());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Utilisateur créé avec succès");
        response.put("username", request.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<JwtResponse> refresh(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BadRequestException("Token invalide");
        }

        String oldToken = authHeader.substring(7);
        String username = jwtUtil.extractUsername(oldToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String newToken = jwtUtil.generateToken(userDetails);

        // ✅ Cherche par username OU email
        User user = findUser(username);

        // ✅ NOUVEAU: Récupérer statutApproval et clientId
        String statutApproval = user.getStatutApproval() != null 
                ? user.getStatutApproval().toString() 
                : "EN_ATTENTE";
        Long clientId = user.getClientId();

        JwtResponse response = JwtResponse.builder()
                .token(newToken)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoles())
                .statutApproval(statutApproval)
                .clientId(clientId)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Déconnexion réussie. Supprimez le token côté client.");
        return ResponseEntity.ok(response);
    }
}