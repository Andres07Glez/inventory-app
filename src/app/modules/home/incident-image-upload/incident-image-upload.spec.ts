import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentImageUpload } from './incident-image-upload';

describe('IncidentImageUpload', () => {
  let component: IncidentImageUpload;
  let fixture: ComponentFixture<IncidentImageUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentImageUpload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncidentImageUpload);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
