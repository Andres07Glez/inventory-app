import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecomissionList } from './decomission-list';

describe('DecomissionList', () => {
  let component: DecomissionList;
  let fixture: ComponentFixture<DecomissionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecomissionList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecomissionList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
