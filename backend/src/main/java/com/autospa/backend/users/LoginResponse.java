package com.autospa.backend.users;

public record LoginResponse(String token, UserSummary user) {}
