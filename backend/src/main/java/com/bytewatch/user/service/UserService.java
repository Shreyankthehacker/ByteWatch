package com.bytewatch.user.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.bytewatch.user.entity.User;
import com.bytewatch.user.repository.UserRepository;

@Service
public class UserService {

	
	private final UserRepository userRepo;
	private final PasswordEncoder passwordEncoder;


	public UserService(UserRepository repo , PasswordEncoder passwordEncoder)
	{
		this.userRepo = repo;
		this.passwordEncoder = passwordEncoder;
	}
	
	public User createUser(User user) {
		user.setPassword(passwordEncoder.encode(user.getPassword()));
		return userRepo.save(user);
	}
	
	public List<User> getAllUsers(){
		return userRepo.findAll();
	}
	
	public User getUserbyId(Integer id) {
		Optional<User> user = userRepo.findById(id);
		if (user.isEmpty()){
			throw new RuntimeException("No user found with "+id);
		}
		return user.get();
		
	}
	

	public User getUserbyEmail(String email){
		Optional<User> user = userRepo.findByEmail(email);
		if(user.isEmpty()){
			throw new RuntimeException("No user with such "+email);
		}
		return user.get();
	}


	public void deleteUser(Integer id) {
		userRepo.deleteById(id);
	}
	
	
	
}
