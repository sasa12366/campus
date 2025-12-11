package org.ksu.schedule.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.rememberme.JdbcTokenRepositoryImpl;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.sql.DataSource;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Autowired
    private DataSource dataSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CORS по нашему конфигу ниже
                .cors(Customizer.withDefaults())
                .csrf().disable()
                .authorizeHttpRequests()
                // публичные эндпоинты
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/schedule/**").permitAll()
                .requestMatchers("/api/v1/teacher/**").permitAll()
                .requestMatchers("/api/v1/subject/**").permitAll()
                .requestMatchers("/api/v1/group/**").permitAll()
                .requestMatchers("/api/v1/subgroup/**").permitAll()
                .requestMatchers("/api/v1/faculty/**").permitAll()

                // админские
                .requestMatchers("/api/v1/admin/**").hasAnyAuthority("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/v1/excel/import").hasAnyAuthority("ADMIN", "SUPER_ADMIN")

                // обновление профилей
                .requestMatchers("/api/v1/user/update/student/").hasAuthority("STUDENT")
                .requestMatchers("/api/v1/user/update/teacher/").hasAuthority("TEACHER")

                // остальное пока тоже открыто
                .anyRequest().permitAll()
                .and()
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .rememberMe()
                .key(secretKey)
                .tokenRepository(tokenRepository())
                .tokenValiditySeconds(14 * 24 * 60 * 60)
                .and()
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PersistentTokenRepository tokenRepository() {
        JdbcTokenRepositoryImpl tokenRepository = new JdbcTokenRepositoryImpl();
        tokenRepository.setDataSource(dataSource);
        return tokenRepository;
    }

    // ВАЖНО: CORS-конфигурация
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Откуда разрешаем фронту ходить на backend
        config.setAllowedOrigins(List.of(
                "http://ksukursk.ru:3000",
                "http://www.ksukursk.ru:3000",
                "http://31.130.155.26:3000",
                "http://localhost:3000"
        ));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
