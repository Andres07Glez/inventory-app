import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, finalize } from 'rxjs';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';

// PrimeNG
import { ButtonModule }       from 'primeng/button';
import { InputTextModule }    from 'primeng/inputtext';
import { DialogModule }       from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule }        from 'primeng/toast';
import { TagModule }          from 'primeng/tag';
import { IconFieldModule }    from 'primeng/iconfield';
import { InputIconModule }    from 'primeng/inputicon';
import { SelectModule }       from 'primeng/select';
import { TooltipModule }      from 'primeng/tooltip';
import { SkeletonModule }     from 'primeng/skeleton';
import { AvatarModule }       from 'primeng/avatar';

import { ConfirmationService, MessageService } from 'primeng/api';
import {
  GuardianService,
  GuardianResponse,
  GuardianRequest,
  LocationOption,
  PageResponse
} from '../../../core/services/guardian/guardian.service';

@Component({
  selector: 'app-guardian-registration',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    TableModule, ButtonModule, InputTextModule, DialogModule,
    ConfirmDialogModule, ToastModule, TagModule, IconFieldModule,
    InputIconModule, SelectModule, TooltipModule, SkeletonModule, AvatarModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './guardian-registration.html',
  styleUrls: ['./guardian-registration.scss']
})
export class GuardianRegistration implements OnInit, OnDestroy {

  private readonly fb                  = inject(FormBuilder);
  private readonly guardianService     = inject(GuardianService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService      = inject(MessageService);
  private readonly destroy$            = new Subject<void>();
  private readonly searchSubject$      = new Subject<string>();

  // ── State ─────────────────────────────────────────────────────────────────
  guardians        = signal<GuardianResponse[]>([]);
  locations        = signal<LocationOption[]>([]);
  loading          = signal(false);
  saving           = signal(false);
  dialogVisible    = signal(false);
  isEditing        = signal(false);
  selectedGuardian = signal<GuardianResponse | null>(null);
  searchTerm       = signal('');

  // ── Paginación y orden ───────────────────────────────────────────────────
  totalRecords = signal(0);
  currentPage  = signal(0);
  pageSize     = signal(10);
  currentSort  = 'fullName,asc';   // valor por defecto coincide con sortField de la tabla

  form!: FormGroup;

  locationOptions = computed(() =>
    this.locations().map(l => ({
      label: `${l.name}${l.building ? ' – ' + l.building : ''}`,
      value: l.id
    }))
  );

  getInitials = (name: string): string =>
    name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
    this.loadLocations();
    this.setupSearch();
    // La carga inicial la dispara (onLazyLoad) al renderizar la tabla
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Init helpers ───────────────────────────────────────────────────────────
  private buildForm(): void {
    this.form = this.fb.group({
      employeeNumber: ['', [Validators.required, Validators.maxLength(30)]],
      fullName:       ['', [Validators.required, Validators.maxLength(150)]],
      email:          ['', [Validators.email,    Validators.maxLength(150)]],
      phone:          ['', [Validators.maxLength(25)]],
      department:     ['', [Validators.maxLength(150)]],
      locationId:     [null],
    });
  }

  private setupSearch(): void {
    this.searchSubject$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.currentPage.set(0);
      term ? this.doSearch(term) : this.loadGuardians();
    });
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  loadGuardians(): void {
    this.loading.set(true);
    this.guardianService
      .getGuardians(this.currentPage(), this.pageSize(), this.currentSort)
      .pipe(finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe({
        next: (page: PageResponse<GuardianResponse>) => {
          this.guardians.set(page.content);
          this.totalRecords.set(page.totalElements);
        },
        error: () => this.showError('No se pudo cargar la lista de resguardantes.')
      });
  }

  private doSearch(q: string): void {
    this.loading.set(true);
    this.guardianService
      .searchGuardians(q, this.currentPage(), this.pageSize())
      .pipe(finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe({
        next: (page: PageResponse<GuardianResponse>) => {
          this.guardians.set(page.content);
          this.totalRecords.set(page.totalElements);
        },
        error: () => this.showError('Error al buscar resguardantes.')
      });
  }

  private loadLocations(): void {
    this.guardianService.getLocations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: locs => this.locations.set(locs) });
  }

  // ── Lazy load (paginación + ordenamiento) ─────────────────────────────────
  onLazyLoad(event: TableLazyLoadEvent): void {
    this.currentPage.set(Math.floor((event.first ?? 0) / this.pageSize()));

    if (event.sortField) {
      const dir = (event.sortOrder ?? 1) === 1 ? 'asc' : 'desc';
      this.currentSort = `${event.sortField},${dir}`;
    }

    const term = this.searchTerm();
    term ? this.doSearch(term) : this.loadGuardians();
  }

  // ── Búsqueda ───────────────────────────────────────────────────────────────
  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.searchSubject$.next(value);
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  openCreate(): void {
    this.isEditing.set(false);
    this.selectedGuardian.set(null);
    this.form.reset({ locationId: null });
    this.dialogVisible.set(true);
  }

  openEdit(guardian: GuardianResponse): void {
    this.isEditing.set(true);
    this.selectedGuardian.set(guardian);
    this.form.patchValue({
      employeeNumber: guardian.employeeNumber,
      fullName:       guardian.fullName,
      email:          guardian.email,
      phone:          guardian.phone,
      department:     guardian.department,
      locationId:     guardian.locationId,
    });
    this.dialogVisible.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: GuardianRequest = this.form.value;
    this.saving.set(true);

    const op$ = this.isEditing()
      ? this.guardianService.updateGuardian(this.selectedGuardian()!.id, payload)
      : this.guardianService.createGuardian(payload);

    op$.pipe(finalize(() => this.saving.set(false)), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: this.isEditing() ? 'Resguardante actualizado.' : 'Resguardante creado.'
          });
          this.dialogVisible.set(false);
          this.loadGuardians();
        },
        error: (err) => {
          const detail = err?.error?.message ?? 'No se pudo guardar el resguardante.';
          this.showError(detail);
        }
      });
  }

  confirmDelete(guardian: GuardianResponse): void {
    this.confirmationService.confirm({
      message: `¿Deseas dar de baja a <strong>${guardian.fullName}</strong>? Esta acción lo marcará como inactivo.`,
      header:  'Confirmar baja',
      icon:    'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, dar de baja',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deactivate(guardian)
    });
  }

  private deactivate(guardian: GuardianResponse): void {
    this.guardianService.deactivateGuardian(guardian.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'warn',
            summary:  'Baja registrada',
            detail:   `${guardian.fullName} fue dado de baja.`
          });
          this.loadGuardians();
        },
        error: () => this.showError('No se pudo dar de baja al resguardante.')
      });
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.hasError(error) && ctrl?.touched);
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}