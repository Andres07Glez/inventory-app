import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceCreate } from './maintenance-create';

describe('MaintenanceCreate', () => {
  let component: MaintenanceCreate;
  let fixture: ComponentFixture<MaintenanceCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
