package com.autospa.backend.users;

import java.util.Set;

public record UserSummary(Long id, String fullName, String email, Set<UserRole> roles, boolean active) {
    public static UserSummary from(UserEntity user) {
        return new UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getRoles(), user.isActive());
    }
}
