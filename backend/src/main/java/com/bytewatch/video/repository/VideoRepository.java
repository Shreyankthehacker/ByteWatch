package com.bytewatch.video.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bytewatch.video.entity.Video;

public interface VideoRepository extends JpaRepository<Video , Long>{
     List<Video> findByVisibility(Integer visibility);

}
