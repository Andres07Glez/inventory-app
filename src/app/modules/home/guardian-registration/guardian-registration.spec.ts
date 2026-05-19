import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuardianRegistration } from './guardian-registration';

describe('GuardianRegistration', () => {
  let component: GuardianRegistration;
  let fixture: ComponentFixture<GuardianRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuardianRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuardianRegistration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
