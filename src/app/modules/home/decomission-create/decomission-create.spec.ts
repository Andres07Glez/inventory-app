import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecomissionCreate } from './decomission-create';

describe('DecomissionCreate', () => {
  let component: DecomissionCreate;
  let fixture: ComponentFixture<DecomissionCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecomissionCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecomissionCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
