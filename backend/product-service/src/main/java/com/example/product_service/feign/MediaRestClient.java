package com.example.product_service.feign;

import java.util.List;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.example.product_service.dto.MediaDTO;

@FeignClient(name = "MEDIA-SERVICE")
public interface MediaRestClient {
    @GetMapping("/api/medias/{id}")
    List<MediaDTO> getMediaByProducId(@PathVariable String id);
}
