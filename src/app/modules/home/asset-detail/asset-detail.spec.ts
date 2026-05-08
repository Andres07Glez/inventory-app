import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetDetail } from './asset-detail';

describe('AssetDetail', () => {
  let component: AssetDetail;
  let fixture: ComponentFixture<AssetDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
