package com.autospa.backend.users;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) { this.userService = userService; }

    @GetMapping
    public List<UserSummary> findAll() { return userService.findAll(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummary create(@RequestBody CreateUserRequest request, JwtAuthenticationToken actor) {
        return userService.create(request, actor.getName(), roles(actor));
    }

    @PatchMapping("/{id}/role")
    public UserSummary changeRole(@PathVariable long id, @RequestBody ChangeRoleRequest request, JwtAuthenticationToken actor) {
        return userService.changeRole(id, request, actor.getName(), roles(actor));
    }

    @PatchMapping("/{id}/active")
    public UserSummary setActive(@PathVariable long id, @RequestBody SetActiveRequest request, JwtAuthenticationToken actor) {
        return userService.setActive(id, request, actor.getName(), roles(actor));
    }

    private static Set<UserRole> roles(JwtAuthenticationToken actor) {
        return actor.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .filter(name -> name.startsWith("ROLE_"))
                .map(name -> UserRole.valueOf(name.substring(5)))
                .collect(Collectors.toUnmodifiableSet());
    }
}
