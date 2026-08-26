import { TestBed } from '@angular/core/testing';

import { NotificationError } from './notification-error';

describe('NotificationError', () => {
  let service: NotificationError;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationError);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
