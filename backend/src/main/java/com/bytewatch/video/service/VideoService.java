package com.bytewatch.video.service;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.bytewatch.video.entity.Video;
import com.bytewatch.video.entity.VideoStatus;
import com.bytewatch.video.repository.VideoRepository;

@Service
public class VideoService {



private final VideoRepository videoRepo;
private final VideoStorageService videoStorage;
private final VideoProcessingService videoProcessing;

public VideoService(VideoRepository repo , VideoStorageService service , VideoProcessingService videoProcess){this.videoRepo = repo; this.videoStorage = service;this.videoProcessing = videoProcess;}


public Video upload(String title , String description , MultipartFile file, int visibility , MultipartFile thumbNail){


Video video = new Video();
video.setTitle(title);
video.setDescription(description);
video.setOriginalFileName(file.getOriginalFilename());
video.setContentType(file.getContentType());
video.setFileSize(file.getSize());
video.setStatus(VideoStatus.UPLOADING);
video.setVisbility(visibility);

video = videoRepo.save(video);


Path videoPath ,videoThumbnailPath;
videoThumbnailPath = null;
try{

    if(thumbNail!=null){
    videoThumbnailPath = videoStorage.saveThumbnail(video.getId(), thumbNail);
    }
    videoPath= videoStorage.saveVideo(video.getId(), file);
    videoStorage.createMasterPlaylist(video.getId());
    

}catch (IOException e){
    System.out.println("Failed to upload bcz "+e.toString() );
    return null;
}


video.setStoragePath(videoPath.toString());
video.setThumbnail(videoThumbnailPath.toString());
video.setStatus(VideoStatus.PROCESSING);
videoRepo.save(video);


videoProcessing.processVide(video.getId(), videoPath);
return video;
}




public List<Video> getVideoForUser(int userId){
    return videoRepo.findByVisibility(userId);
}

public Video getVideoById(Long id){
    return videoRepo.findById(id).orElse(null);
}

public List<Video> getPublicVideos(){
    return videoRepo.findByVisibility(1);
}
    
}
