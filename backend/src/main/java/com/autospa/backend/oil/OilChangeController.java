package com.autospa.backend.oil;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/oil-changes")
public class OilChangeController {
    private final OilChangeService oilChangeService;

    public OilChangeController(OilChangeService oilChangeService) {
        this.oilChangeService = oilChangeService;
    }

    @GetMapping
    public List<OilChange> findAll() {
        return oilChangeService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OilChange create(@RequestBody CreateOilChangeRequest request) {
        return oilChangeService.create(request);
    }
}
