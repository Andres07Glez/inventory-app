import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetRegistration } from './asset-registration';

describe('AssetRegistration', () => {
  let component: AssetRegistration;
  let fixture: ComponentFixture<AssetRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetRegistration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
