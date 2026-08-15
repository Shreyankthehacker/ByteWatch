package com.bytewatch.auth.controller;


import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bytewatch.auth.dto.LoginRequest;
import com.bytewatch.auth.dto.LoginResponse;
import com.bytewatch.auth.service.AuthService;



@RestController
@RequestMapping("/auth")
public class AuthController {

private final AuthService authservice;


public AuthController(AuthService authservice){this.authservice = authservice;}

@PostMapping("/login")
public LoginResponse login(@RequestBody LoginRequest request){

    System.out.println("REQUEST EMAIL = " + request.getEmail());
    System.out.println("REQUEST PASSWORD = " + request.getPassword());
    
    return authservice.login(request);
    

    }


    
}
