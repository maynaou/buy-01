package com.example.user_service.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.stream.function.StreamBridge;

import com.example.user_service.dto.UserDTO;
import com.example.user_service.entities.User;
import com.example.user_service.exception.UserNotFoundException;
import com.example.user_service.mappers.UserMapper;
import com.example.user_service.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private StreamBridge streamBridge;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, userMapper, streamBridge);
    }

    @Test
    @DisplayName("getProfle - utilisateur trouvé → retourne le UserDTO")
    void getProfle_UserExists_ShouldReturnUserDTO() {
        User user = new User();
        user.setUsername("testuser");

        UserDTO userDTO = new UserDTO();
        userDTO.setUsername("testuser");

        when(userRepository.findById("user-id-1")).thenReturn(Optional.of(user));
        when(userMapper.fromUser(user)).thenReturn(userDTO);

        UserDTO result = userService.getProfle("user-id-1");

        assertThat(result.getUsername()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("getProfle - utilisateur introuvable → lève UserNotFoundException")
    void getProfle_UserNotFound_ShouldThrow() {
        when(userRepository.findById("ghost-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getProfle("ghost-id"))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessage("User not found");
    }

    @Test
    @DisplayName("updateProfile - met à jour, sauvegarde et publie un event")
    void updateProfile_UserExists_ShouldUpdateSaveAndPublish() {
        User existingUser = new User();
        existingUser.setUsername("oldname");
        existingUser.setEmail("old@example.com");

        UserDTO requestDTO = new UserDTO();
        requestDTO.setUsername("newname");
        requestDTO.setEmail("new@example.com");

        UserDTO responseDTO = new UserDTO();
        responseDTO.setUsername("newname");

        when(userRepository.findById("user-id-1")).thenReturn(Optional.of(existingUser));
        when(userMapper.fromUser(existingUser)).thenReturn(responseDTO);

        UserDTO result = userService.updateProfile("user-id-1", requestDTO);

        assertThat(result.getUsername()).isEqualTo("newname");
        assertThat(existingUser.getUsername()).isEqualTo("newname"); // confirme la mutation
        assertThat(existingUser.getEmail()).isEqualTo("new@example.com");

        verify(userRepository, times(1)).save(existingUser);
        verify(streamBridge, times(1)).send(eq("userProducer-out-0"), any());
    }

    @Test
    @DisplayName("updateProfile - utilisateur introuvable → lève UserNotFoundException et ne sauvegarde rien")
    void updateProfile_UserNotFound_ShouldThrowAndNotSave() {
        UserDTO requestDTO = new UserDTO();
        requestDTO.setUsername("newname");

        when(userRepository.findById("ghost-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateProfile("ghost-id", requestDTO))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessage("User not found");

        verify(userRepository, never()).save(any(User.class));
        verify(streamBridge, never()).send(any(), any());
    }
}