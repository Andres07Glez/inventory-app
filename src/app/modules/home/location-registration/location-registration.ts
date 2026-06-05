import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  DestroyRef, inject, OnInit, signal
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select'; 
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import {
  LocationService,
  LocationRequest,
  LocationResponse,
  SpringPage
} from '../../../core/services/location/location.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-location-registration',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TableModule, DialogModule, ConfirmDialogModule,
    ButtonModule, InputTextModule, TextareaModule, TagModule, ToastModule,
    TooltipModule, SkeletonModule, IconFieldModule, InputIconModule, SelectModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './location-registration.html',
  styleUrls: ['./location-registration.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationRegistration implements OnInit {

  private readonly locationService     = inject(LocationService);
  private readonly fb                  = inject(FormBuilder);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr                 = inject(ChangeDetectorRef);
  private readonly destroyRef          = inject(DestroyRef);

  readonly pageSize = PAGE_SIZE;

  campuses = signal([
    { name: 'Loma Bonita' },
    { name: 'Tuxtepec' }
  ]);

  // ── Estado de tabla ──────────────────────────────────────────────────────
  locations       = signal<LocationResponse[]>([]);
  locationTotal   = signal(0);
  locationLoading = signal(true);
  locationPage    = 0;
  locationSort    = 'name,asc';
  locationKeyword = '';
  private readonly locationSearch$ = new Subject<string>();

  // ── Estado de diálogo ────────────────────────────────────────────────────
  dialogVisible   = signal(false);
  dialogMode      = signal<'create' | 'edit'>('create');
  dialogLoading   = signal(false);
  editingId       = signal<number | null>(null);

  form: FormGroup = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(150)]],
    building:    ['', Validators.maxLength(100)],
    campus:      ['', Validators.maxLength(100)],
    description: ['', Validators.maxLength(255)],
  });

  // ── Ciclo de vida ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadLocations();
    this.setupSearch();
  }

  private setupSearch(): void {
    this.locationSearch$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(kw => {
        this.locationLoading.set(true);
        this.locationPage = 0;
        return kw.trim()
          ? this.locationService.search(kw.trim(), 0, PAGE_SIZE)
          : this.locationService.getAll(0, PAGE_SIZE, this.locationSort);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: page => this.applyPage(page),
      error: () => { this.locationLoading.set(false); this.cdr.markForCheck(); },
    });
  }

  // ── Carga ────────────────────────────────────────────────────────────────
  loadLocations(): void {
    this.locationLoading.set(true);
    const obs = this.locationKeyword.trim()
      ? this.locationService.search(this.locationKeyword, this.locationPage, PAGE_SIZE)
      : this.locationService.getAll(this.locationPage, PAGE_SIZE, this.locationSort);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => this.applyPage(page),
      error: () => { this.locationLoading.set(false); this.cdr.markForCheck(); },
    });
  }

  private applyPage(page: SpringPage<LocationResponse>): void {
    this.locations.set(page.content);
    this.locationTotal.set(page.totalElements);
    this.locationLoading.set(false);
    this.cdr.markForCheck();
  }

  onSearch(value: string): void {
    this.locationKeyword = value;
    this.locationSearch$.next(value);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.locationPage = Math.floor((event.first ?? 0) / PAGE_SIZE);
    if (event.sortField) {
      this.locationSort = `${event.sortField},${(event.sortOrder ?? 1) === 1 ? 'asc' : 'desc'}`;
    }
    this.loadLocations();
  }

  // ── Diálogo ──────────────────────────────────────────────────────────────
  openCreate(): void {
    this.form.reset();
    this.editingId.set(null);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
  }

  openEdit(loc: LocationResponse): void {
    this.form.patchValue({
      name:        loc.name,
      building:    loc.building ?? '',
      campus:      loc.campus   ?? '',
      description: loc.description ?? '',
    });
    this.editingId.set(loc.id);
    this.dialogMode.set('edit');
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  // ── Guardar ──────────────────────────────────────────────────────────────
  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.value;
    const payload: LocationRequest = {
      name:        raw.name.trim(),
      building:    raw.building?.trim()    || null,
      campus:      raw.campus?.trim()      || null,
      description: raw.description?.trim() || null,
    };

    const isEdit = this.dialogMode() === 'edit';
    this.dialogLoading.set(true);

    const obs = isEdit
      ? this.locationService.update(this.editingId()!, payload)
      : this.locationService.create(payload);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: saved => {
        this.dialogLoading.set(false);
        this.dialogVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: isEdit ? 'Ubicación actualizada' : 'Ubicación registrada',
          detail: `"${saved.name}" guardada correctamente.`,
          life: 4000,
        });
        this.loadLocations();
      },
      error: err => {
        this.dialogLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo guardar la ubicación.',
        });
        this.cdr.markForCheck();
      },
    });
  }

  // ── Desactivar ───────────────────────────────────────────────────────────
  confirmDeactivate(loc: LocationResponse): void {
    this.confirmationService.confirm({
      header: 'Desactivar ubicación',
      message: `¿Deseas desactivar <strong>${loc.name}</strong>?<br>
                <small>Los activos vinculados conservarán su referencia.</small>`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.locationService.deactivate(loc.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'warn',
                summary: 'Desactivada',
                detail: `"${loc.name}" fue desactivada.`,
                life: 4000,
              });
              this.loadLocations();
            },
            error: err => {
              const isBusy = err.status === 409;
              this.messageService.add({
                severity: isBusy ? 'warn' : 'error',
                summary: isBusy ? 'Ubicación en uso' : 'Error',
                detail: err?.error?.message
                  ?? (isBusy
                    ? 'Esta ubicación tiene activos asignados y no puede desactivarse.'
                    : 'No se pudo desactivar la ubicación.'),
                life: isBusy ? 6000 : 4000,
              });
            },
          });
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  hasError(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(error) && c.touched);
  }
}