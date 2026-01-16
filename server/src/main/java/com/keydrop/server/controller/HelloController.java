package com.keydrop.server.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/api/test")
    public String testConnection() {
        return "성공! 스프링부트와 연결되었습니다! 🎉";
    }
}