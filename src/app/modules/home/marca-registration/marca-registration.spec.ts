import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcaRegistration } from './marca-registration';

describe('MarcaRegistration', () => {
  let component: MarcaRegistration;
  let fixture: ComponentFixture<MarcaRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarcaRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarcaRegistration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
