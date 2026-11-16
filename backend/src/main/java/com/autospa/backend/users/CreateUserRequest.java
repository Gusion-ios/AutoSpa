package com.autospa.backend.users;

import java.util.Set;

public record CreateUserRequest(String fullName, String email, String password, Set<UserRole> roles) {}
