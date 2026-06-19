import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetMaintenanceTab } from './asset-maintenance-tab';

describe('AssetMaintenanceTab', () => {
  let component: AssetMaintenanceTab;
  let fixture: ComponentFixture<AssetMaintenanceTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetMaintenanceTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetMaintenanceTab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
