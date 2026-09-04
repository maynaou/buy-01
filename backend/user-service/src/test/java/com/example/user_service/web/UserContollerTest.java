package com.example.user_service.web;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.example.user_service.dto.UserDTO;
import com.example.user_service.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class UserContollerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UserContoller userContoller;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userContoller).build();
        objectMapper = new ObjectMapper();
        when(authentication.getName()).thenReturn("testuser");
    }

    @Test
    @DisplayName("GET /api/users/me - retourne le profil de l'utilisateur connecté")
    void getProfile_ShouldReturnUserDTO() throws Exception {
        UserDTO userDTO = new UserDTO();
        userDTO.setUsername("testuser");

        when(userService.getProfle("testuser")).thenReturn(userDTO);

        mockMvc.perform(get("/api/users/me")
                        .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"));

        verify(userService, times(1)).getProfle("testuser");
    }

    @Test
    @DisplayName("PUT /api/users/me - met à jour et retourne le profil")
    void updateProfile_ShouldReturnUpdatedUserDTO() throws Exception {
        UserDTO requestDTO = new UserDTO();
        requestDTO.setUsername("newname");
        requestDTO.setEmail("newname@example.com");
        requestDTO.setRole(com.example.user_service.enums.Role.CLIENT);

        UserDTO updatedDTO = new UserDTO();
        updatedDTO.setUsername("newname");
        updatedDTO.setEmail("newname@example.com");
        updatedDTO.setRole(com.example.user_service.enums.Role.CLIENT);

        when(userService.updateProfile("testuser", requestDTO)).thenReturn(updatedDTO);

        mockMvc.perform(put("/api/users/me")
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("newname"));

        verify(userService, times(1)).updateProfile("testuser", requestDTO);
    }
}