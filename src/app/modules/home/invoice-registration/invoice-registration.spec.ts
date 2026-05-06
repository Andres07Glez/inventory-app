import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceRegistration } from './invoice-registration';

describe('InvoiceRegistration', () => {
  let component: InvoiceRegistration;
  let fixture: ComponentFixture<InvoiceRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceRegistration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
