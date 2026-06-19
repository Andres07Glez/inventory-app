import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationRegistration } from './location-registration';

describe('LocationRegistration', () => {
  let component: LocationRegistration;
  let fixture: ComponentFixture<LocationRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationRegistration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
