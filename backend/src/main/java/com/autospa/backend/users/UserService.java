package com.autospa.backend.users;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {
    private static final Set<UserRole> OPERATIONAL_ROLES = Set.of(
            UserRole.RECEPCION, UserRole.TECNICO, UserRole.CAJA);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserSummary> findAll() {
        return users.findAllByOrderByFullNameAsc().stream().map(UserSummary::from).toList();
    }

    @Transactional
    public UserSummary create(CreateUserRequest request, String actorEmail, Set<UserRole> actorRoles) {
        if (request == null) throw badRequest("Completa los datos del empleado.");
        String name = required(request.fullName(), "El nombre es obligatorio.");
        if (name.length() > 120) throw badRequest("El nombre no puede superar 120 caracteres.");
        String email = required(request.email(), "El correo es obligatorio.").toLowerCase(Locale.ROOT);
        String password = request.password() == null ? "" : request.password();
        validatePassword(password);
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) throw badRequest("El correo no tiene un formato válido.");
        if (users.existsByEmailIgnoreCase(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese correo.");
        validateAssignableRoles(request.roles(), actorRoles);

        UserEntity created = users.save(new UserEntity(name, email, passwordEncoder.encode(password), request.roles(), true));
        return UserSummary.from(created);
    }

    @Transactional
    public UserSummary changeRole(long id, ChangeRoleRequest request, String actorEmail, Set<UserRole> actorRoles) {
        if (request == null) throw badRequest("Selecciona un rol.");
        UserEntity target = findById(id);
        protectSupremeAccount(target, actorEmail, actorRoles);
        validateAssignableRoles(request.roles(), actorRoles);
        target.changeRoles(request.roles());
        return UserSummary.from(users.save(target));
    }

    @Transactional
    public UserSummary setActive(long id, SetActiveRequest request, String actorEmail, Set<UserRole> actorRoles) {
        if (request == null) throw badRequest("Indica si la cuenta debe estar activa.");
        UserEntity target = findById(id);
        protectSupremeAccount(target, actorEmail, actorRoles);
        target.setActive(request.active());
        return UserSummary.from(users.save(target));
    }

    @Transactional(readOnly = true)
    public UserSummary findByEmail(String email) {
        return users.findByEmailIgnoreCase(email).map(UserSummary::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "La sesión no es válida."));
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        UserEntity user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña actual no coincide.");
        }
        validatePassword(newPassword);
        user.changePassword(passwordEncoder.encode(newPassword));
        users.save(user);
    }

    private UserEntity findById(long id) {
        return users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró la cuenta."));
    }

    private static void protectSupremeAccount(UserEntity target, String actorEmail, Set<UserRole> actorRoles) {
        boolean targetIsHigherThanOperational = target.getRoles().stream().anyMatch(role -> !OPERATIONAL_ROLES.contains(role));
        if (target.getRoles().contains(UserRole.ADMIN_SUPREMO) || target.getEmail().equalsIgnoreCase(actorEmail)
                || (actorRoles.contains(UserRole.ADMINISTRADOR) && targetIsHigherThanOperational)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta cuenta no se puede modificar desde esta pantalla.");
        }
    }

    private static void validateAssignableRoles(Set<UserRole> roles, Set<UserRole> actorRoles) {
        if (roles == null || roles.isEmpty()) throw badRequest("Selecciona al menos un rol para el empleado.");
        if (roles.contains(UserRole.ADMIN_SUPREMO)) throw badRequest("El rol supremo no se puede asignar desde la gestión de empleados.");
        if (actorRoles.contains(UserRole.ADMINISTRADOR) && roles.stream().anyMatch(role -> !OPERATIONAL_ROLES.contains(role))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Un administrador solo puede asignar roles operativos.");
        }
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) throw badRequest(message);
        String result = value.trim();
        if (result.length() > 180) throw badRequest("Uno de los datos supera la longitud permitida.");
        return result;
    }

    public static void validatePassword(String password) {
        if (password == null || password.length() < 12 || password.length() > 72) {
            throw badRequest("La contraseña debe tener entre 12 y 72 caracteres.");
        }
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
