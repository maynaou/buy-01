package com.example.media_service.mapper;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;
import java.util.List;
import com.example.media_service.entity.Media;

import com.example.media_service.dto.MediaResponse;

@Component
public class MediaMapper {
    public MediaResponse fromMedia(Media media) {
        MediaResponse mediaresponse = new MediaResponse();
        BeanUtils.copyProperties(media, mediaresponse);
        return mediaresponse;
    }

    public List<MediaResponse> fromMedia(List<Media> medias) {
        return medias.stream()
                .map(media -> fromMedia(media))
                .toList();

    }
}
