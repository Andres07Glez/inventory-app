import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuardianAssetsList } from './guardian-assets-list';

describe('GuardianAssetsList', () => {
  let component: GuardianAssetsList;
  let fixture: ComponentFixture<GuardianAssetsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuardianAssetsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuardianAssetsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
