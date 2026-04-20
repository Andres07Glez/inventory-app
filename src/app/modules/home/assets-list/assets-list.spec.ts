import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsList } from './assets-list';

describe('AssetsList', () => {
  let component: AssetsList;
  let fixture: ComponentFixture<AssetsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
