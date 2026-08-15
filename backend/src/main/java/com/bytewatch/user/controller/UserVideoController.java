package com.bytewatch.user.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bytewatch.video.entity.Video;
import com.bytewatch.video.service.VideoService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/user/video")
@SecurityRequirement(name = "bearerAuth")
public class UserVideoController {
    

private final VideoService videoService;

public UserVideoController(VideoService videoService){
    this.videoService = videoService;
}


@GetMapping("/user-videos")
public List<Video> getUserVideos(int userId){
    
return videoService.getVideoForUser(userId);

} 


}
