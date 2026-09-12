package com.careeros.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * JPA entity that also acts as the Spring Security principal.
 * Implementing {@link UserDetails} means Spring's {@code @AuthenticationPrincipal}
 * can inject a {@code User} directly in controller methods - no wrapper required.
 */
@Getter
@Setter
@Entity
@Table(name = "app_user")
public class User extends BaseEntity implements UserDetails {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    // - UserDetails contract -

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    /** Spring Security uses this to verify the stored credential. */
    @Override
    public String getPassword() {
        return passwordHash;
    }

    /** Spring Security uses this as the unique identifier for the principal. */
    @Override
    public String getUsername() {
        return email;
    }

    @Override public boolean isAccountNonExpired()  { return true; }
    @Override public boolean isAccountNonLocked()   { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()            { return true; }
}
