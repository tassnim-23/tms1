package com.grpo.tms.config;

import com.grpo.tms.service.UserDetailsServiceImpl;
import com.grpo.tms.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil                jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;

    /**
     * Routes vraiment publiques — le filtre JWT est ignoré pour ces chemins.
     *
     * ⚠️  RÈGLE : n'ajouter ici QUE les routes accessibles sans compte.
     *     GET /inscription/demandes est ADMIN → ne pas mettre /inscription/** ici.
     */
    private static final List<String> PUBLIC_URLS = List.of(
        "/auth/**",
        "/api/auth/**",
        "/actuator/**",
        "/error",
        "/swagger-ui/**",
        "/v3/api-docs/**",
        "/public/**",                   // Confirmation livraison client (API JSON)
        "/confirmation/confirmer",      // Page HTML confirmation (lien email)
        "/confirmation/refuser",        // Page HTML refus (lien email)
        "/localites/**",                // Autocomplete GPS frontend
        "/inscription/demande",         // POST : soumettre une inscription (public)
        "/inscription/verifier-code"    // POST : vérifier code email (public)
    );

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        boolean isPublic = PUBLIC_URLS.stream()
            .anyMatch(pattern -> pathMatcher.match(pattern, path));
        if (isPublic) log.debug("Route publique ignorée par JWT filter: {}", path);
        return isPublic;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest  request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain         filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {
            final String username = jwtUtil.extractUsername(jwt);

            if (username != null
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtUtil.validateToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                        );
                    authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("Utilisateur '{}' authentifié via JWT", username);
                }
            }
        } catch (Exception e) {
            log.warn("Token JWT invalide pour {}: {}", request.getServletPath(), e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}