package com.bytewatch.user.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import com.bytewatch.user.entity.User;
// import org.springframework.security.core.userdetails.User ;   cant use this lol name conflict

@Service
public class CustomUserDetailService  implements UserDetailsService{


private final UserService userService;


CustomUserDetailService(UserService userService){this.userService = userService;}



@Override
public UserDetails loadUserByUsername(String email){

System.out.println(">>> UserDetailsService received: " + email);

User user;
    try{
     user = userService.getUserbyEmail(email);
    }
    catch (RuntimeException e){
        throw new UsernameNotFoundException("User not found");
    }
    
System.out.println(">>> Found user: " + user.getEmail());
    return org.springframework.security.core.userdetails.User
    .withUsername(user.getEmail())
    .password(user.getPassword())
    .roles(user.getRole())
    .build();
}


    
}
