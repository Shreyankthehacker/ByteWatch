package com.bytewatch.video.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class FfmpegService {
    

private final String ffmpegPath;

public FfmpegService(@Value("${ffmpeg.path}") String fpath){
    
    this.ffmpegPath = fpath;
}

public void generateHls(Path inputFile , Long videoId , String bitrate) throws IOException,InterruptedException{
    

Path hlsDir = inputFile.getParent().getParent().resolve("hls").resolve(bitrate);
Files.createDirectories(hlsDir);;
Path playlist = hlsDir.resolve("playlist.m3u8");
Path segPath = hlsDir.resolve("segment%03d.ts");

        ProcessBuilder processBuilder = new ProcessBuilder(
                ffmpegPath,

                "-i",
                inputFile.toString(),

                "-c:v",
                "libx264",

                "-c:a",
                "aac",

                "-vf",
                "scale=-2:"+bitrate,

                "-b:v",
                "2500k",

                "-b:a",
                "128k",

                "-f",
                "hls",

                "-hls_time",
                "6",

                "-hls_playlist_type",
                "vod",

                "-hls_segment_filename",
                segPath.toString(),

                playlist.toString()
        );

        processBuilder.inheritIO();
        Process process =processBuilder.start();
        int exitCode = process.waitFor();
        if(exitCode!=0){
            throw new RuntimeException("FFMpeg failed with exit code");
        }

}

}
