package com.grpo.tms.service;

import com.grpo.tms.entity.User;
import com.grpo.tms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {

        // Cherche par username, sinon par email
        Optional<User> userOpt = userRepository.findByUsername(usernameOrEmail);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(usernameOrEmail);
        }

        User user = userOpt.orElseThrow(() -> {
            log.error("Utilisateur non trouvé: {}", usernameOrEmail);
            return new UsernameNotFoundException("Utilisateur non trouvé: " + usernameOrEmail);
        });

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(user.getRoles().stream()
                        .map(role -> {
    String r = role.toUpperCase();
    return new SimpleGrantedAuthority(r.startsWith("ROLE_") ? r : "ROLE_" + r);
})
                        .collect(Collectors.toList()))
                .build();
    }
}