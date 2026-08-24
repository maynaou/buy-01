import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Navbar } from './navbar';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should offer login and register while signed out', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Login');
    expect(text).toContain('Register');
    expect(text).not.toContain('Logout');
  });
});

describe('Navbar (signed in)', () => {
  beforeEach(async () => {
    localStorage.setItem('access_token', 'fake.jwt.token');

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should offer logout, and swap back on logout', async () => {
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Logout');
    expect(element.textContent).not.toContain('Register');

    element.querySelector<HTMLButtonElement>('.navbar__btn')?.click();
    await fixture.whenStable();

    expect(element.textContent).toContain('Login');
    expect(element.textContent).toContain('Register');
    expect(element.textContent).not.toContain('Logout');
  });
});
