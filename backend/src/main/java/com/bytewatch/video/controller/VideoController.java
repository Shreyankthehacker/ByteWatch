package com.bytewatch.video.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.bytewatch.video.entity.Video;
import com.bytewatch.video.service.VideoService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/videos")
public class VideoController {
    
    private final VideoService videoService;

    public VideoController(VideoService serv){this.videoService = serv;}

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Video uploadVideo(
        @RequestParam String title,
        @RequestParam String description,
        @RequestParam MultipartFile file,
        @RequestParam Integer visibility,
        @RequestParam MultipartFile thumbnail
    ){
        return videoService.upload(title, description, file,visibility,thumbnail);
    }

    @GetMapping("/public")
    public List<Video> getPublicVideos() {
        return videoService.getPublicVideos();
    }

    @GetMapping("/{videoId}")
    public ResponseEntity<Video> getVideoMetadata(@PathVariable Long videoId) {
        Video video = videoService.getVideoById(videoId);
        if (video == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(video);
    }

    @GetMapping("/{videoId}/thumbnail")
    public ResponseEntity<Resource> getThumbnail(@PathVariable Long videoId) throws IOException {
        Video video = videoService.getVideoById(videoId);
        if (video == null || video.getThumbnail() == null) {
            return ResponseEntity.notFound().build();
        }
        Path path = Paths.get(video.getThumbnail());
        if (!Files.exists(path) || !Files.isRegularFile(path)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(path);
        String contentType = Files.probeContentType(path);
        if (contentType == null) {
            contentType = "image/jpeg";
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }
}
