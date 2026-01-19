package com.keydrop.server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Value("${app.media.dir}")
  private String mediaDir;

  @Value("${app.media.urlPrefix}")
  private String urlPrefix;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    String location = "file:" + (mediaDir.endsWith("/") ? mediaDir : mediaDir + "/");

    registry.addResourceHandler(urlPrefix + "/**")
        .addResourceLocations(location)
        .setCachePeriod(3600);
  }
/*
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
      .allowedOrigins("http://localhost:5173")
      .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
      .allowedHeaders("*")
      .allowCredentials(true);
  }
  */
}