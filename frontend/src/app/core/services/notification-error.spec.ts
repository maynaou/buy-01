import { TestBed } from '@angular/core/testing';

import { NotificationError } from './notification-error';

describe('NotificationError', () => {
  let service: NotificationError;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationError],
    });

    service = TestBed.inject(NotificationError);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have null message initially', () => {
    expect(service.getMessage()).toBeNull();
  });

  it('should have green color initially', () => {
    expect(service.getColor()).toBe('green');
  });

  describe('show', () => {
    it('should set the message', () => {
      service.show('Product created.');

      expect(service.getMessage()).toBe('Product created.');
    });

    it('should set the specified color', () => {
      service.show('Something went wrong.', 'red');

      expect(service.getMessage()).toBe('Something went wrong.');
      expect(service.getColor()).toBe('red');
    });

    it('should use green as the default color', () => {
      service.show('Success message');

      expect(service.getColor()).toBe('green');
    });

    it('should allow green to be explicitly specified', () => {
      service.show('Success message', 'green');

      expect(service.getColor()).toBe('green');
    });

    it('should replace the previous message', () => {
      service.show('First message');

      service.show('Second message');

      expect(service.getMessage()).toBe('Second message');
    });

    it('should replace the previous color', () => {
      service.show('Error message', 'red');

      service.show('Success message', 'green');

      expect(service.getColor()).toBe('green');
    });
  });

  describe('getMessage', () => {
    it('should return the current message', () => {
      service.show('Test message');

      expect(service.getMessage()).toBe('Test message');
    });
  });

  describe('getColor', () => {
    it('should return the current color', () => {
      service.show('Error message', 'red');

      expect(service.getColor()).toBe('red');
    });
  });
});
