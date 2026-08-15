package com.bytewatch.video.service;

import java.nio.file.Path;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.bytewatch.video.entity.Video;
import com.bytewatch.video.entity.VideoStatus;
import com.bytewatch.video.repository.VideoRepository;

@Service
public class VideoProcessingService {

    
private final FfmpegService ffmpeg;
private final VideoRepository videoRepo;


public VideoProcessingService(FfmpegService ffmpeg , VideoRepository videoRepo){this.ffmpeg = ffmpeg ; this.videoRepo = videoRepo;}



@Async("videoTaskExecutor")
public void processVide(Long videoId , Path StoragePath)
{Video video = videoRepo.findById(videoId).orElseThrow();
    try{
        ffmpeg.generateHls(StoragePath, videoId,"720p");
        ffmpeg.generateHls(StoragePath, videoId,"1080p");
        ffmpeg.generateHls(StoragePath, videoId,"360p");
        video.setStatus(VideoStatus.READY);
        videoRepo.save(video);
    }catch(Exception e){
        video.setStatus(VideoStatus.FAILED);
        videoRepo.save(video);
        e.printStackTrace();
    }
}





}
