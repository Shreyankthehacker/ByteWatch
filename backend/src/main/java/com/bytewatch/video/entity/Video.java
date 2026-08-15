package com.bytewatch.video.entity;


import jakarta.persistence.*;

@Entity
@Table(name = "videos")
public class Video {



@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private long id;


private String title;
private String description;
private String originalFileName;
private String storagePath;
private String contentType;
private Long fileSize;
private int visibility;
private String thumbnailPath;


@Enumerated(EnumType.STRING)
@Column(nullable = false)
private VideoStatus status;


public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getThumbnail() {
        return thumbnailPath;
    }

    public void setThumbnail(String thumbNail) {
        this.thumbnailPath = thumbNail;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public VideoStatus getStatus() {
        return status;
    }

    public void setStatus(VideoStatus status) {
        this.status = status;
    }


    public int getVisibility() {
        return visibility;
    }

    public void setVisbility(int vis) {
        this.visibility = vis;
    }
}
