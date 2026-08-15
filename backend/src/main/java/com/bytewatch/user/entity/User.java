package com.bytewatch.user.entity;



import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

	
	@Id
	@GeneratedValue(strategy= GenerationType.IDENTITY)
	private Integer userID ; 
	
	@Column(nullable = false)
	private String name;
	
	@Column(nullable = false , unique = true)
	private String email;
	
	@Column(nullable =  false )
	private String password;
	
	enum Role{
		ADMIN ,VIEWER
	}

	@Column(nullable = false )
	private Role role;
	


	public User() {}
	public User(String name , String email , String password , String role) {
		this.name = name ;
		this.email = email;
		this.password = password;
	    if(role==null){
			this.role = Role.VIEWER;
		}
		else if(role.toLowerCase()=="viewer"){
			this.role=Role.VIEWER;
		}
		else if(role.toLowerCase()=="admin"){
			this.role = Role.ADMIN;
		}
		else this.role = Role.VIEWER;
	}
	
	public int getId(){
		return this.userID;
	}
	public String getName() {
		return this.name;
	}
	public void setName(String name ) {
		this.name  = name;
	}
	
	public String getEmail() {
		return this.email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public String getPassword() {
		return this.password;
	}
	public String getRole() {
		return this.role.toString();
	}

	public void setPassword(String password){this.password = password;}
	
	
}
