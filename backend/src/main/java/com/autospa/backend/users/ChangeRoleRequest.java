package com.autospa.backend.users;

import java.util.Set;

public record ChangeRoleRequest(Set<UserRole> roles) {}
