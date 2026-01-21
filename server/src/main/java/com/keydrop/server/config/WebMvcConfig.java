package com.keydrop.server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  @Value("${app.media.dir}")
  private String mediaDir;

  @Value("${app.media.urlPrefix}") // e.g. "/media"
  private String mediaUrlPrefix;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // Ensure the path ends with a slash for the resource handler
    String location = Paths.get(mediaDir).toUri().toString();
    if (!location.endsWith("/")) {
      location += "/";
    }
    
    // Map URL /media/** -> File System Path
    registry.addResourceHandler(mediaUrlPrefix + "/**")
        .addResourceLocations(location);
  }
}
