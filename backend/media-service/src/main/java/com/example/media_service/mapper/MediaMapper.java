package com.example.media_service.mapper;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;
import java.util.List;
import com.example.media_service.dto.MediaDTO;
import com.example.media_service.entities.Media;

@Component
public class MediaMapper {
    public MediaDTO fromMedia(Media media) {
        MediaDTO mediaresponse = new MediaDTO();
        BeanUtils.copyProperties(media, mediaresponse);
        return mediaresponse;
    }

    public List<MediaDTO> fromMedia(List<Media> medias) {
        return medias.stream()
                .map(media -> fromMedia(media))
                .toList();

    }
}
