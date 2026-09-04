import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { Profile } from './profile';
import { UserService } from '../../core/services/user';
import { MediaService } from '../../core/services/media';
import { TokenService } from '../../core/services/token';
import { NotificationError } from '../../core/services/notification-error';

import { UserProfile } from './models/user-profile';
import { AvatarResponse } from './models/avatar-response';

describe('Profile', () => {
    let component: Profile;
    let fixture: ComponentFixture<Profile>;

    let userService: jasmine.SpyObj<UserService>;
    let mediaService: jasmine.SpyObj<MediaService>;
    let tokenService: jasmine.SpyObj<TokenService>;
    let router: jasmine.SpyObj<Router>;
    let notificationError: jasmine.SpyObj<NotificationError>;

    const clientProfile: UserProfile = {
        username: 'testuser',
        email: 'test@example.com',
        role: 'CLIENT',
        avatar: 'https://example.com/avatar.jpg',
    };

    const sellerProfile: UserProfile = {
        username: 'seller',
        email: 'seller@example.com',
        role: 'SELLER',
        avatar: 'https://example.com/seller.jpg',
    };

    const avatarResponse: AvatarResponse = {
        imagePath: 'https://example.com/new-avatar.jpg',
        entityId: 'user-1',
        mediaType: 'image/jpeg',
    };

    beforeEach(async () => {
        userService = jasmine.createSpyObj<UserService>(
            'UserService',
            ['getProfile', 'updateProfile'],
        );

        mediaService = jasmine.createSpyObj<MediaService>(
            'MediaService',
            ['uploadAvatar'],
        );

        tokenService = jasmine.createSpyObj<TokenService>(
            'TokenService',
            ['getUserId'],
        );

        router = jasmine.createSpyObj<Router>(
            'Router',
            ['navigate'],
        );

        notificationError = jasmine.createSpyObj<NotificationError>(
            'NotificationError',
            ['show'],
        );

        /*
         * Profile calls loadProfile() inside its constructor.
         * Therefore getProfile() needs a return value before
         * TestBed.createComponent().
         */
        userService.getProfile.and.returnValue(of(clientProfile));

        await TestBed.configureTestingModule({
            imports: [Profile],
            providers: [
                {
                    provide: UserService,
                    useValue: userService,
                },
                {
                    provide: MediaService,
                    useValue: mediaService,
                },
                {
                    provide: TokenService,
                    useValue: tokenService,
                },
                {
                    provide: Router,
                    useValue: router,
                },
                {
                    provide: NotificationError,
                    useValue: notificationError,
                },
            ],
        })
            .overrideComponent(Profile, {
                set: {
                    template: '',
                },
            })
            .compileComponents();

        fixture = TestBed.createComponent(Profile);
        component = fixture.componentInstance;

        fixture.detectChanges();
    });

    // =========================================================
    // Creation / initial state
    // =========================================================

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should load the profile when the component is created', () => {
        expect(userService.getProfile).toHaveBeenCalledTimes(1);
    });

    it('should store the loaded profile', () => {
        expect(component.profile()).toEqual(clientProfile);
    });

    it('should stop loading after the profile is loaded', () => {
        expect(component.loading()).toBeFalse();
    });

    it('should initialize loadError as empty', () => {
        expect(component.loadError()).toBe('');
    });

    it('should initialize saving as false', () => {
        expect(component.saving()).toBeFalse();
    });

    it('should initialize saveError as empty', () => {
        expect(component.saveError()).toBe('');
    });

    it('should initialize savedMessage as empty', () => {
        expect(component.savedMessage()).toBe('');
    });

    it('should initialize uploading as false', () => {
        expect(component.uploading()).toBeFalse();
    });

    it('should initialize pendingPreviewUrl as null', () => {
        expect(component.pendingPreviewUrl()).toBeNull();
    });

    it('should initialize pendingFileName as empty', () => {
        expect(component.pendingFileName()).toBe('');
    });

    // =========================================================
    // Profile loading
    // =========================================================

    it('should set loading to true while loading the profile', () => {
        let emitProfile!: (profile: UserProfile) => void;

        userService.getProfile.and.returnValue(
            new Observable<UserProfile>((subscriber) => {
                emitProfile = (value) => subscriber.next(value);
            }),
        );

        component.loadProfile();

        expect(component.loading()).toBeTrue();

        emitProfile(clientProfile);

        expect(component.loading()).toBeFalse();
    });

    it('should clear the previous load error when loading the profile', () => {
        component.loadError.set('Previous error');

        userService.getProfile.and.returnValue(of(clientProfile));

        component.loadProfile();

        expect(component.loadError()).toBe('');
    });

    it('should apply the username from the loaded profile', () => {
        expect(component.profileForm.controls.username.value).toBe(
            clientProfile.username,
        );
    });

    it('should apply the email from the loaded profile', () => {
        expect(component.profileForm.controls.email.value).toBe(
            clientProfile.email,
        );
    });

    it('should set the avatar URL from the profile', () => {
        expect(component.avatarUrl()).toBe(clientProfile.avatar ?? null);
    });

    it('should set avatarUrl to null when the profile has no avatar', () => {
        const profileWithoutAvatar: UserProfile = {
            ...clientProfile,
            avatar: null,
        };

        userService.getProfile.and.returnValue(of(profileWithoutAvatar));

        component.loadProfile();

        expect(component.avatarUrl()).toBeNull();
    });

    it('should set avatarUrl to null when the avatar is empty', () => {
        const profileWithEmptyAvatar: UserProfile = {
            ...clientProfile,
            avatar: '   ',
        };

        userService.getProfile.and.returnValue(of(profileWithEmptyAvatar));

        component.loadProfile();

        expect(component.avatarUrl()).toBeNull();
    });

    it('should navigate to login when loading returns 401', () => {
        userService.getProfile.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 401,
                        statusText: 'Unauthorized',
                        error: {
                            message: 'Unauthorized',
                        },
                    }),
            ),
        );

        userService.getProfile.calls.reset();

        component.loadProfile();

        expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should show the authentication error notification on 401', () => {
        userService.getProfile.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 401,
                        statusText: 'Unauthorized',
                        error: {
                            message: 'Token expired',
                        },
                    }),
            ),
        );

        userService.getProfile.calls.reset();

        component.loadProfile();

        expect(notificationError.show).toHaveBeenCalledWith(
            'Token expired',
            'red',
        );
    });

    it('should set a generic error for non-401 loading errors', () => {
        userService.getProfile.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 500,
                        statusText: 'Server Error',
                    }),
            ),
        );

        userService.getProfile.calls.reset();

        component.loadProfile();

        expect(component.loadError()).toBe(
            'Unable to load your profile. Please try again.',
        );
    });

    it('should stop loading after a profile loading error', () => {
        userService.getProfile.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 500,
                        statusText: 'Server Error',
                    }),
            ),
        );

        userService.getProfile.calls.reset();

        component.loadProfile();

        expect(component.loading()).toBeFalse();
    });

    // =========================================================
    // isSeller
    // =========================================================

    it('should return false when the user is a CLIENT', () => {
        expect(component.isSeller()).toBeFalse();
    });

    it('should return true when the user is a SELLER', () => {
        userService.getProfile.and.returnValue(of(sellerProfile));

        component.loadProfile();

        expect(component.isSeller()).toBeTrue();
    });

    it('should return false when there is no profile', () => {
        component.profile.set(null);

        expect(component.isSeller()).toBeFalse();
    });

    // =========================================================
    // Form validators
    // =========================================================

    it('should require the username', () => {
        const control = component.profileForm.controls.username;

        control.setValue('');

        expect(control.hasError('required')).toBeTrue();
    });

    it('should require username to have at least 3 characters', () => {
        const control = component.profileForm.controls.username;

        control.setValue('ab');

        expect(control.hasError('minlength')).toBeTrue();
    });

    it('should allow a username with 3 characters', () => {
        const control = component.profileForm.controls.username;

        control.setValue('abc');

        expect(control.valid).toBeTrue();
    });

    it('should reject usernames longer than 20 characters', () => {
        const control = component.profileForm.controls.username;

        control.setValue('a'.repeat(21));

        expect(control.hasError('maxlength')).toBeTrue();
    });

    it('should reject usernames containing invalid characters', () => {
        const control = component.profileForm.controls.username;

        control.setValue('test-user');

        expect(control.hasError('pattern')).toBeTrue();
    });

    it('should accept usernames containing letters, numbers and underscores', () => {
        const control = component.profileForm.controls.username;

        control.setValue('user_123');

        expect(control.valid).toBeTrue();
    });

    it('should require the email', () => {
        const control = component.profileForm.controls.email;

        control.setValue('');

        expect(control.hasError('required')).toBeTrue();
    });

    it('should reject an invalid email', () => {
        const control = component.profileForm.controls.email;

        control.setValue('invalid-email');

        expect(control.hasError('email')).toBeTrue();
    });

    it('should accept a valid email', () => {
        const control = component.profileForm.controls.email;

        control.setValue('user@example.com');

        expect(control.valid).toBeTrue();
    });

    // =========================================================
    // onSubmit - invalid form
    // =========================================================

    it('should not update the profile when there is no current profile', () => {
        component.profile.set(null);

        component.onSubmit();

        expect(userService.updateProfile).not.toHaveBeenCalled();
    });

    it('should not update the profile when the form is invalid', () => {
        component.profileForm.setValue({
            username: '',
            email: '',
        });

        component.onSubmit();

        expect(userService.updateProfile).not.toHaveBeenCalled();
    });

    it('should mark the form controls as touched when submit is invalid', () => {
        component.profileForm.setValue({
            username: '',
            email: '',
        });

        component.onSubmit();

        expect(
            component.profileForm.controls.username.touched,
        ).toBeTrue();

        expect(
            component.profileForm.controls.email.touched,
        ).toBeTrue();
    });

    // =========================================================
    // onSubmit - success
    // =========================================================

    it('should update the profile with the form values', () => {
        const updatedProfile: UserProfile = {
            ...clientProfile,
            username: 'newusername',
            email: 'new@example.com',
        };

        component.profileForm.setValue({
            username: 'newusername',
            email: 'new@example.com',
        });

        userService.updateProfile.and.returnValue(
            of(updatedProfile),
        );

        component.onSubmit();

        expect(userService.updateProfile).toHaveBeenCalledWith({
            username: 'newusername',
            email: 'new@example.com',
            role: 'CLIENT',
        });
    });

    it('should preserve the existing role when updating the profile', () => {
        const sellerProfile: UserProfile = {
            username: 'old_seller',
            email: 'old-seller@example.com',
            role: 'SELLER',
            avatar: null,
        };

        component.profile.set(sellerProfile);

        component.profileForm.setValue({
            username: 'new_seller',
            email: 'new-seller@example.com',
        });

        expect(component.profileForm.valid).toBeTrue();

        userService.updateProfile.and.returnValue(of(sellerProfile));

        component.onSubmit();

        expect(userService.updateProfile).toHaveBeenCalledWith({
            username: 'new_seller',
            email: 'new-seller@example.com',
            role: 'SELLER',
        });
    });



    it('should set saving to true while updating', () => {
        let emitProfile!: (profile: UserProfile) => void;

        userService.updateProfile.and.returnValue(
            new Observable<UserProfile>((subscriber) => {
                emitProfile = (value) => subscriber.next(value);
            }),
        );

        component.profileForm.setValue({
            username: 'updateduser',
            email: 'updated@example.com',
        });

        component.onSubmit();

        expect(component.saving()).toBeTrue();

        emitProfile({
            ...clientProfile,
            username: 'updateduser',
            email: 'updated@example.com',
        });

        expect(component.saving()).toBeFalse();
    });

    it('should clear previous save errors when submitting', () => {
        component.saveError.set('Previous save error');
        component.savedMessage.set('Previous success');

        component.profileForm.setValue({
            username: 'updateduser',
            email: 'updated@example.com',
        });

        userService.updateProfile.and.returnValue(
            of({
                ...clientProfile,
                username: 'updateduser',
                email: 'updated@example.com',
            }),
        );

        component.onSubmit();

        expect(component.saveError()).toBe('');
        expect(component.savedMessage()).toBe('Profile updated.');
    });

    it('should apply the updated profile after a successful save', () => {
        const updatedProfile: UserProfile = {
            ...clientProfile,
            username: 'updateduser',
            email: 'updated@example.com',
        };

        component.profileForm.setValue({
            username: 'updateduser',
            email: 'updated@example.com',
        });

        userService.updateProfile.and.returnValue(
            of(updatedProfile),
        );

        component.onSubmit();

        expect(component.profile()).toEqual(updatedProfile);
    });

    it('should set the success message after updating', () => {
        const updatedProfile: UserProfile = {
            ...clientProfile,
            username: 'updateduser',
            email: 'updated@example.com',
        };

        component.profileForm.setValue({
            username: 'updateduser',
            email: 'updated@example.com',
        });

        userService.updateProfile.and.returnValue(
            of(updatedProfile),
        );

        component.onSubmit();

        expect(component.savedMessage()).toBe(
            'Profile updated.',
        );
    });

    it('should stop saving after a successful update', () => {
        component.profileForm.setValue({
            username: 'updateduser',
            email: 'updated@example.com',
        });

        userService.updateProfile.and.returnValue(
            of({
                ...clientProfile,
                username: 'updateduser',
            }),
        );

        component.onSubmit();

        expect(component.saving()).toBeFalse();
    });

    // =========================================================
    // onSubmit - errors
    // =========================================================

    it('should show the conflict message for a 409 error', () => {
        component.profileForm.setValue({
            username: 'existing',
            email: 'existing@example.com',
        });

        userService.updateProfile.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 409,
                        statusText: 'Conflict',
                    }),
            ),
        );

        component.onSubmit();

        expect(component.saveError()).toBe(
            'That username or email is already taken.',
        );
    });

    it('should show the generic save error for other errors', () => {
        component.profileForm.setValue({
            username: 'updateduser',
            email: 'updated@example.com',
        });

        userService.updateProfile.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 500,
                        statusText: 'Server Error',
                    }),
            ),
        );

        component.onSubmit();

        expect(component.saveError()).toBe(
            'Could not save your profile. Please try again.',
        );
    });

    it('should stop saving after an update error', () => {
        component.profileForm.setValue({
            username: 'updateduser',
            email: 'updated@example.com',
        });

        userService.updateProfile.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 500,
                        statusText: 'Server Error',
                    }),
            ),
        );

        component.onSubmit();

        expect(component.saving()).toBeFalse();
    });

    // =========================================================
    // Avatar file selection
    // =========================================================

    it('should do nothing when no file is selected', () => {
        const input = document.createElement('input');
        input.type = 'file';

        Object.defineProperty(input, 'files', {
            value: [],
        });

        component.onFileSelected({
            target: input,
        } as unknown as Event);

        expect(component.pendingFileName()).toBe('');
        expect(component.pendingPreviewUrl()).toBeNull();
    });

    it('should reject a non-image file', () => {
        const file = new File(
            ['text'],
            'document.txt',
            {
                type: 'text/plain',
            },
        );

        const input = document.createElement('input');
        input.type = 'file';

        Object.defineProperty(input, 'files', {
            value: [file],
        });

        component.onFileSelected({
            target: input,
        } as unknown as Event);

        expect(component.pendingFileName()).toBe('');
        expect(component.pendingPreviewUrl()).toBeNull();

        expect(notificationError.show).toHaveBeenCalledWith(
            'Please choose an image file.',
            'red',
        );
    });

    it('should reject an image larger than 1 MB', () => {
        const file = new File(
            ['image'],
            'large.jpg',
            {
                type: 'image/jpeg',
            },
        );

        Object.defineProperty(file, 'size', {
            value: 1024 * 1024 + 1,
        });

        const input = document.createElement('input');
        input.type = 'file';

        Object.defineProperty(input, 'files', {
            value: [file],
        });

        component.onFileSelected({
            target: input,
        } as unknown as Event);

        expect(component.pendingFileName()).toBe('');
        expect(component.pendingPreviewUrl()).toBeNull();

        expect(notificationError.show).toHaveBeenCalledWith(
            'Image is larger than 1 MB. Please choose a smaller one..',
            'red',
        );
    });

    it('should accept an image exactly 1 MB in size', () => {
        const file = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        Object.defineProperty(file, 'size', {
            value: 1024 * 1024,
        });

        const createObjectURLSpy = spyOn(
            URL,
            'createObjectURL',
        ).and.returnValue('blob:avatar');

        const input = document.createElement('input');
        input.type = 'file';

        Object.defineProperty(input, 'files', {
            value: [file],
        });

        component.onFileSelected({
            target: input,
        } as unknown as Event);

        expect(component.pendingFileName()).toBe(
            'avatar.jpg',
        );

        expect(component.pendingPreviewUrl()).toBe(
            'blob:avatar',
        );

        expect(createObjectURLSpy).toHaveBeenCalledWith(file);
    });

    it('should accept a valid image file', () => {
        const file = new File(
            ['image'],
            'avatar.png',
            {
                type: 'image/png',
            },
        );

        const createObjectURLSpy = spyOn(
            URL,
            'createObjectURL',
        ).and.returnValue('blob:avatar');

        const input = document.createElement('input');
        input.type = 'file';

        Object.defineProperty(input, 'files', {
            value: [file],
        });

        component.onFileSelected({
            target: input,
        } as unknown as Event);

        expect(component.pendingFileName()).toBe(
            'avatar.png',
        );

        expect(component.pendingPreviewUrl()).toBe(
            'blob:avatar',
        );

        expect(createObjectURLSpy).toHaveBeenCalledWith(file);
    });

    it('should revoke the previous preview when selecting another file', () => {
        const revokeObjectURLSpy = spyOn(
            URL,
            'revokeObjectURL',
        );

        component.pendingPreviewUrl.set('blob:old');

        const file = new File(
            ['image'],
            'new.jpg',
            {
                type: 'image/jpeg',
            },
        );

        spyOn(URL, 'createObjectURL').and.returnValue(
            'blob:new',
        );

        const input = document.createElement('input');
        input.type = 'file';

        Object.defineProperty(input, 'files', {
            value: [file],
        });

        component.onFileSelected({
            target: input,
        } as unknown as Event);

        expect(
            revokeObjectURLSpy,
        ).toHaveBeenCalledWith('blob:old');

        expect(component.pendingPreviewUrl()).toBe(
            'blob:new',
        );
    });

    // =========================================================
    // Avatar upload
    // =========================================================

    it('should not upload when there is no pending file', () => {
        component.uploadAvatar();

        expect(
            mediaService.uploadAvatar,
        ).not.toHaveBeenCalled();
    });

    it('should not upload while another upload is running', () => {
        const file = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component.uploading.set(true);

        component.uploadAvatar();

        expect(
            mediaService.uploadAvatar,
        ).not.toHaveBeenCalled();
    });

    it('should show an error when the user ID cannot be found', () => {
        const file = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component['pendingFile'] = file;

        tokenService.getUserId.and.returnValue(null);

        component.uploadAvatar();

        expect(
            mediaService.uploadAvatar,
        ).not.toHaveBeenCalled();

        expect(notificationError.show).toHaveBeenCalledWith(
            'Could not identify your account. Please sign in again.',
            'red',
        );
    });

    it('should upload the avatar using the user ID', () => {
        const file = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component['pendingFile'] = file;

        tokenService.getUserId.and.returnValue(
            'user-123',
        );

        mediaService.uploadAvatar.and.returnValue(
            of(avatarResponse),
        );

        component.uploadAvatar();

        expect(
            mediaService.uploadAvatar,
        ).toHaveBeenCalledWith(
            'user-123',
            file,
        );
    });

    it('should set uploading to true while uploading', () => {
        const file = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component['pendingFile'] = file;

        tokenService.getUserId.and.returnValue(
            'user-123',
        );

        let emitResponse!: (
            response: AvatarResponse,
        ) => void;

        mediaService.uploadAvatar.and.returnValue(
            new Observable<AvatarResponse>((subscriber) => {
                emitResponse = (value) => subscriber.next(value);
            }),
        );

        component.uploadAvatar();

        expect(component.uploading()).toBeTrue();

        emitResponse(avatarResponse);

        expect(component.uploading()).toBeFalse();
    });

    it('should update avatarUrl after successful upload', () => {
        const file = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component['pendingFile'] = file;

        tokenService.getUserId.and.returnValue(
            'user-123',
        );

        mediaService.uploadAvatar.and.returnValue(
            of(avatarResponse),
        );

        component.uploadAvatar();

        expect(component.avatarUrl()).toBe(
            avatarResponse.imagePath,
        );
    });

    it('should clear the pending file name after successful upload', () => {
        const file = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component['pendingFile'] = file;
        component.pendingFileName.set('avatar.jpg');

        tokenService.getUserId.and.returnValue(
            'user-123',
        );

        mediaService.uploadAvatar.and.returnValue(
            of(avatarResponse),
        );

        component.uploadAvatar();

        expect(component.pendingFileName()).toBe('');
    });

    it('should clear the pending preview after successful upload', () => {
        const revokeObjectURLSpy = spyOn(
            URL,
            'revokeObjectURL',
        );

        component['pendingFile'] = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component.pendingPreviewUrl.set(
            'blob:avatar',
        );

        tokenService.getUserId.and.returnValue(
            'user-123',
        );

        mediaService.uploadAvatar.and.returnValue(
            of(avatarResponse),
        );

        component.uploadAvatar();

        expect(component.pendingPreviewUrl()).toBeNull();

        expect(
            revokeObjectURLSpy,
        ).toHaveBeenCalledWith('blob:avatar');
    });

    it('should show a success notification after avatar upload', () => {
        const file = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component['pendingFile'] = file;

        tokenService.getUserId.and.returnValue(
            'user-123',
        );

        mediaService.uploadAvatar.and.returnValue(
            of(avatarResponse),
        );

        component.uploadAvatar();

        expect(notificationError.show).toHaveBeenCalledWith(
            'Avatar updated.',
            'green',
        );
    });

    it('should stop uploading after a successful avatar upload', () => {
        const file = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component['pendingFile'] = file;

        tokenService.getUserId.and.returnValue(
            'user-123',
        );

        mediaService.uploadAvatar.and.returnValue(
            of(avatarResponse),
        );

        component.uploadAvatar();

        expect(component.uploading()).toBeFalse();
    });

    // =========================================================
    // Avatar upload errors
    // =========================================================

    it('should show the authorization error when avatar upload returns 403', () => {
        const file = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component['pendingFile'] = file;

        tokenService.getUserId.and.returnValue(
            'user-123',
        );

        mediaService.uploadAvatar.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 403,
                        statusText: 'Forbidden',
                    }),
            ),
        );

        component.uploadAvatar();

        expect(notificationError.show).toHaveBeenCalledWith(
            'You are not allowed to change this avatar.',
            'red',
        );
    });

    it('should show the generic upload error for other errors', () => {
        const file = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component['pendingFile'] = file;

        tokenService.getUserId.and.returnValue(
            'user-123',
        );

        mediaService.uploadAvatar.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 500,
                        statusText: 'Server Error',
                    }),
            ),
        );

        component.uploadAvatar();

        expect(notificationError.show).toHaveBeenCalledWith(
            'Upload failed. Please try again.',
            'red',
        );
    });

    it('should stop uploading after an upload error', () => {
        const file = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component['pendingFile'] = file;

        tokenService.getUserId.and.returnValue(
            'user-123',
        );

        mediaService.uploadAvatar.and.returnValue(
            throwError(
                () =>
                    new HttpErrorResponse({
                        status: 500,
                        statusText: 'Server Error',
                    }),
            ),
        );

        component.uploadAvatar();

        expect(component.uploading()).toBeFalse();
    });

    // =========================================================
    // removeImage
    // =========================================================

    it('should clear the pending preview when removing the image', () => {
        const revokeObjectURLSpy = spyOn(
            URL,
            'revokeObjectURL',
        );

        component.pendingPreviewUrl.set(
            'blob:avatar',
        );

        component.removeImage();

        expect(component.pendingPreviewUrl()).toBeNull();

        expect(
            revokeObjectURLSpy,
        ).toHaveBeenCalledWith('blob:avatar');
    });

    it('should clear the pending file name when removing the image', () => {
        component.pendingFileName.set(
            'avatar.jpg',
        );

        component.removeImage();

        expect(component.pendingFileName()).toBe('');
    });

    it('should clear the pending file when removing the image', () => {
        component['pendingFile'] = new File(
            ['image'],
            'avatar.jpg',
            {
                type: 'image/jpeg',
            },
        );

        component.removeImage();

        expect(component['pendingFile']).toBeNull();
    });

    it('should reset uploading when removing the image', () => {
        component.uploading.set(true);

        component.removeImage();

        expect(component.uploading()).toBeFalse();
    });

    // =========================================================
    // Destroy / preview cleanup
    // =========================================================

    it('should revoke the pending preview when the component is destroyed', () => {
        const revokeObjectURLSpy = spyOn(
            URL,
            'revokeObjectURL',
        );

        component.pendingPreviewUrl.set(
            'blob:avatar',
        );

        fixture.destroy();

        expect(
            revokeObjectURLSpy,
        ).toHaveBeenCalledWith('blob:avatar');
    });
});
