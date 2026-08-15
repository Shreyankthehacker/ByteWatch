package com.bytewatch.video.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class VideoStorageService {
    


    private final Path storageRoot;

    public VideoStorageService(@Value("${video.storage.path}") String path){
        this.storageRoot = Paths.get(path).toAbsolutePath().normalize();
    }

    public Path saveVideo(Long videoId , MultipartFile file ) throws IOException{
        Path videoDir = storageRoot.resolve(String.valueOf(videoId)).resolve("original");
        Files.createDirectories(videoDir);
        String fileName = Paths.get(file.getOriginalFilename()).getFileName().toString();
        Path targetFile = videoDir.resolve(fileName);
        file.transferTo(targetFile);
        return targetFile;
    }

    public  void createMasterPlaylist(Long videoId) throws IOException {

    String content = """
            #EXTM3U

            #EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
            1080p/playlist.m3u8

            #EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
            720p/playlist.m3u8

            #EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480
            480p/playlist.m3u8

            #EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
            360p/playlist.m3u8
            """;

    Files.writeString(
        storageRoot.resolve(String.valueOf(videoId)).resolve("master.m3u8"),
        content
    );
}

    public Path saveThumbnail(Long videoId , MultipartFile file ) throws IOException{
        Path videoDir = storageRoot.resolve(String.valueOf(videoId)).resolve("thumbnail");
        Files.createDirectories(videoDir);
        String fileName = Paths.get(file.getOriginalFilename()).getFileName().toString();
        Path targetFile = videoDir.resolve(fileName);
        file.transferTo(targetFile);
        return targetFile;
    }



}
