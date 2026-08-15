package com.bytewatch.video.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/videos")
public class VideoPlayerController {

    private final Path storageRoot;

    public VideoPlayerController(
            @Value("${video.storage.path}") String storagePath) {

        this.storageRoot = Paths.get(storagePath)
                .toAbsolutePath()
                .normalize();

        System.out.println(
                "Video storage path: " + storageRoot
        );
    }

    @GetMapping(
        value = "/{videoId}/hls/master.m3u8",
        produces = "application/vnd.apple.mpegurl"
    )
    public ResponseEntity<Resource> getMasterPlaylist(
            @PathVariable String videoId) throws IOException {

        Path path = storageRoot
                .resolve(videoId)
                // .resolve("hls")
                .resolve("master.m3u8");

        return serveFile(
                path,
                "application/vnd.apple.mpegurl"
        );
    }

    @GetMapping(
        value = "/{videoId}/hls/{quality}/playlist.m3u8",
        produces = "application/vnd.apple.mpegurl"
    )
    public ResponseEntity<Resource> getQualityPlaylist(
            @PathVariable String videoId,
            @PathVariable String quality) throws IOException {

        Path path = storageRoot
                .resolve(videoId)
                .resolve("hls")
                .resolve(quality)
                .resolve("playlist.m3u8");

        return serveFile(
                path,
                "application/vnd.apple.mpegurl"
        );
    }

    @GetMapping(
        value = "/{videoId}/hls/{quality}/{segment}.ts",
        produces = "video/mp2t"
    )
    public ResponseEntity<Resource> getSegment(
            @PathVariable String videoId,
            @PathVariable String quality,
            @PathVariable String segment) throws IOException {
                segment = "000"+segment;
        segment = segment.substring(segment.length()-3, segment.length());
        System.err.println(segment);
        Path path = storageRoot
                .resolve(videoId)
                .resolve("hls")
                .resolve(quality)
                .resolve("segment"+segment + ".ts");

        return serveFile(
                path,
                "video/mp2t"
        );
    }

    private ResponseEntity<Resource> serveFile(
            Path path,
            String contentType) throws IOException {

        if (!path.startsWith(storageRoot)) {
            return ResponseEntity.badRequest().build();
        }

        if (!Files.exists(path) ||
            !Files.isRegularFile(path)) {

            return ResponseEntity.notFound().build();
        }

        Resource resource =
                new FileSystemResource(path);

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(contentType)
                )
                .body(resource);
    }
}