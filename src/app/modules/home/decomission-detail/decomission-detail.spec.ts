import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecomissionDetail } from './decomission-detail';

describe('DecomissionDetail', () => {
  let component: DecomissionDetail;
  let fixture: ComponentFixture<DecomissionDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecomissionDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecomissionDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
