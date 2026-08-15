package com.bytewatch.auth.service;

// import javax.management.RuntimeErrorException;

// import org.springframework.security.authentication.AuthenticationManager;
// import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.bytewatch.auth.dto.LoginRequest;
import com.bytewatch.auth.dto.LoginResponse;
import com.bytewatch.security.JwtService;
import com.bytewatch.user.entity.User;
import com.bytewatch.user.service.UserService;


@Service
public class AuthService {


    // private final AuthenticationManager authenticationManager;

    // public AuthService(AuthenticationManager manager){this.authenticationManager = manager;}

    // public Authentication login(LoginRequest request){
    //     System.out.println("Auth manager got the email"+request.getEmail());
    //     Authentication auth = authenticationManager.authenticate(
    //         new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
    //     );


    //     return auth;
    // }


    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;


    public AuthService(UserService user , JwtService jwt , PasswordEncoder pass){
        this.jwtService = jwt;
        this.userService = user;
        this.passwordEncoder = pass;

    }

    public LoginResponse login(LoginRequest request) {
        User user = userService.getUserbyEmail(request.getEmail());
        if(!passwordEncoder.matches(request.getPassword(),user.getPassword())){
            throw new RuntimeException("Invalid password");
        }
        String token = jwtService.generateToken(user.getEmail());
        return new LoginResponse(token,user.getId());
    }
    
}
