import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetImageUpload } from './asset-image-upload';

describe('AssetImageUpload', () => {
  let component: AssetImageUpload;
  let fixture: ComponentFixture<AssetImageUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetImageUpload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetImageUpload);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
