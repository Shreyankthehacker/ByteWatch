package com.bytewatch.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

// import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(
            JwtService jwt,
            UserDetailsService user) {

        this.jwtService = jwt;
        this.userDetailsService = user;
    }

    
    @Override
protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterchain)
        throws ServletException, IOException {

    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
        filterchain.doFilter(request, response);
        return;
    }

    final String authHeader = request.getHeader("Authorization");

    System.out.println("================================");
    System.out.println("REQUEST  = " + request.getRequestURI());
    System.out.println("METHOD   = " + request.getMethod());
    System.out.println("AUTH     = [" + authHeader + "]");

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        filterchain.doFilter(request, response);
        return;
    }

    final String token = authHeader.substring(7).trim();

    try {

        String email = jwtService.extractEmail(token);

        if (email != null &&
                SecurityContextHolder.getContext()
                        .getAuthentication() == null) {

            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(email);

            if (jwtService.isTokenValid(
                    token,
                    userDetails.getUsername())) {

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
            }
        }

    } catch (Exception e) {
        System.out.println("JWT ERROR = " + e.getMessage());
    }

    filterchain.doFilter(request, response);
}
//     protected void doFilterInternal(
//             HttpServletRequest request,
//             HttpServletResponse response,
//             FilterChain filterchain)
//             throws ServletException, IOException {

// final String authHeader = request.getHeader("Authorization");

// System.out.println("================================");
// System.out.println("REQUEST  = " + request.getRequestURI());
// System.out.println("AUTH     = [" + authHeader + "]");

// if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//     filterchain.doFilter(request, response);
//     return;
// }

// final String token = authHeader.substring(7).trim();

// System.out.println("TOKEN    = [" + token + "]");
// System.out.println("DOT COUNT = " + token.chars()
//         .filter(c -> c == '.')
//         .count());

// try {

//     String email = jwtService.extractEmail(token);

//     System.out.println("EMAIL    = " + email);

//     if (email != null &&
//             SecurityContextHolder.getContext()
//                     .getAuthentication() == null) {

//         UserDetails userDetails =
//                 userDetailsService.loadUserByUsername(email);

//         if (jwtService.isTokenValid(
//                 token,
//                 userDetails.getUsername())) {

//             UsernamePasswordAuthenticationToken authentication =
//                     new UsernamePasswordAuthenticationToken(
//                             userDetails,
//                             null,
//                             userDetails.getAuthorities()
//                     );

//             authentication.setDetails(
//                     new WebAuthenticationDetailsSource()
//                             .buildDetails(request)
//             );

//             SecurityContextHolder.getContext()
//                     .setAuthentication(authentication);
//         }
//     }

// } catch (Exception e) {

//     System.out.println("JWT ERROR = " + e.getMessage());
//     e.printStackTrace();
// }

// filterchain.doFilter(request, response);
//     }


}