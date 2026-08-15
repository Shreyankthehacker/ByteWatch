package com.bytewatch.auth.dto;

public class LoginResponse {

    
private String token;
private int userId;

public LoginResponse(String token , int id){this.token = token; this.userId= id;}

public String getToken(){return this.token;}
public int getUserId(){return this.userId;}


}
