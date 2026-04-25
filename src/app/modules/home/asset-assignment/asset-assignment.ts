import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Toast, ToastModule } from "primeng/toast";
import { AssetAssignmentService } from '../../../core/services/asset-assignment/asset-assignment.service';
import { MessageService } from 'primeng/api';
import { AssetPreview, GuardianOption, LocationOption } from '../../../core/models/asset-assignment.model';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

type ConditionStatus = 'GOOD' | 'REGULAR' | 'BAD';
type LifecycleStatus =
  | 'REGISTERED' | 'AVAILABLE' | 'ASSIGNED'
  | 'IN_MAINTENANCE' | 'IN_WARRANTY' | 'DECOMMISSIONED';

const CONDITION_LABEL: Record<ConditionStatus, string> = {
  GOOD: 'Bueno', REGULAR: 'Regular', BAD: 'Malo',
};
const CONDITION_SEVERITY: Record<ConditionStatus, 'success' | 'warn' | 'danger'> = {
  GOOD: 'success', REGULAR: 'warn', BAD: 'danger',
};
const LIFECYCLE_LABEL: Record<LifecycleStatus, string> = {
  REGISTERED: 'Registrado', AVAILABLE: 'Disponible', ASSIGNED: 'Asignado',
  IN_MAINTENANCE: 'Mantenimiento', IN_WARRANTY: 'Garantía', DECOMMISSIONED: 'Baja',
};
const LIFECYCLE_SEVERITY: Record<LifecycleStatus, 'info' | 'success' | 'secondary' | 'warn' | 'contrast' | 'danger'> = {
  REGISTERED: 'info', AVAILABLE: 'success', ASSIGNED: 'secondary',
  IN_MAINTENANCE: 'warn', IN_WARRANTY: 'contrast', DECOMMISSIONED: 'danger',
};

@Component({
  selector: 'app-asset-assignment',
  imports: [CommonModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    ToastModule,
    TooltipModule,
    TagModule,
    SkeletonModule,
    DividerModule,
  ],
  templateUrl: './asset-assignment.html',
  styleUrl: './asset-assignment.scss',
})


export class AssetAssignmentComponent implements OnInit {

  // ── DI ────────────────────────────────────────────────────────────────────
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AssetAssignmentService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Estado ────────────────────────────────────────────────────────────────
  assetPreview = signal<AssetPreview | null>(null);
  lookingUp = signal(false);
  lookupError = signal<string | null>(null);
  submitting = signal(false);
  submitted = signal(false);

  guardians = signal<GuardianOption[]>([]);
  locations = signal<LocationOption[]>([]);
  loadingCatalogs = signal(true);

  // ── Formulario ────────────────────────────────────────────────────────────

  /** Paso 1: búsqueda del bien */
  lookupForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(100)]],
  });

  /** Paso 2: datos de la asignación */
  assignmentForm: FormGroup = this.fb.group({
    guardianId: [null, Validators.required],
    locationId: [null, Validators.required],
    notes: [''],
  });

  // ── Getters de conveniencia ───────────────────────────────────────────────
  get codeControl() { return this.lookupForm.get('code')!; }
  get guardianControl() { return this.assignmentForm.get('guardianId')!; }
  get locationControl() { return this.assignmentForm.get('locationId')!; }

  // ── Ciclo de vida ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadCatalogs();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PASO 1 — Búsqueda del bien
  // ─────────────────────────────────────────────────────────────────────────

  onLookup(): void {
    if (this.lookupForm.invalid) return;

    this.lookingUp.set(true);
    this.lookupError.set(null);
    this.assetPreview.set(null);
    this.assignmentForm.reset();
    this.submitted.set(false);
 
    const code = this.codeControl.value.trim();
 
    this.service.lookupAsset(code).subscribe({
      next: (res) => {
        const asset = res.data;
 
        if (asset.lifecycleStatus === 'DECOMMISSIONED') {
          this.lookupError.set('Este bien está dado de baja y no puede ser asignado.');
          this.lookingUp.set(false);
          this.cdr.markForCheck();
          return;
        }
 
        this.assetPreview.set(asset);
        this.lookingUp.set(false);
        // Pre-seleccionar la ubicación actual del bien
        this.cdr.markForCheck();
      },
      error: () => {
        this.lookupError.set('No se encontró ningún bien con ese código. Verifica e intenta de nuevo.');
        this.lookingUp.set(false);
        this.cdr.markForCheck();
      },
    });
  }
 
  clearLookup(): void {
    this.lookupForm.reset();
    this.assignmentForm.reset();
    this.assetPreview.set(null);
    this.lookupError.set(null);
    this.submitted.set(false);
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // PASO 2 — Envío del formulario
  // ─────────────────────────────────────────────────────────────────────────
 
  onSubmit(): void {
    this.assignmentForm.markAllAsTouched();
    if (this.assignmentForm.invalid || !this.assetPreview()) return;
 
    this.submitting.set(true);
 
    const payload = {
      assetId: this.assetPreview()!.id,
      guardianId: this.assignmentForm.value.guardianId,
      locationId: this.assignmentForm.value.locationId,
      assignedBy: 1, // TODO: reemplazar con el ID del usuario autenticado (JWT)
      notes: this.assignmentForm.value.notes ?? '',
    };
 
    this.service.createAssignment(payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.messageService.add({
          severity: 'success',
          summary: 'Asignación registrada',
          detail: `El bien ${res.assetInventoryNumber} fue asignado a ${res.guardianName}.`,
          life: 5000,
        });
        this.clearLookup();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting.set(false);
        const detail = err?.error?.message ?? 'Ocurrió un error al registrar la asignación.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail,
          life: 6000,
        });
        this.cdr.markForCheck();
      },
    });
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // Helpers de UI
  // ─────────────────────────────────────────────────────────────────────────
 
  getConditionLabel(status: string): string {
    return CONDITION_LABEL[status as ConditionStatus] ?? status;
  }
 
  getConditionSeverity(status: string): 'success' | 'warn' | 'danger' {
    return CONDITION_SEVERITY[status as ConditionStatus] ?? 'warn';
  }
 
  getLifecycleLabel(status: string): string {
    return LIFECYCLE_LABEL[status as LifecycleStatus] ?? status;
  }
 
  getLifecycleSeverity(status: string): 'info' | 'success' | 'secondary' | 'warn' | 'contrast' | 'danger' {
    return LIFECYCLE_SEVERITY[status as LifecycleStatus] ?? 'info';
  }
 
  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }
 
  // ─────────────────────────────────────────────────────────────────────────
  // Catálogos
  // ─────────────────────────────────────────────────────────────────────────
 
private loadCatalogs(): void {
    let pending = 2;
    const done = () => { if (--pending === 0) { this.loadingCatalogs.set(false); this.cdr.markForCheck(); } };
 
    this.service.getGuardians().subscribe({
      // ✅ Extraemos el arreglo de la propiedad "content"
      next: (res: any) => { 
        this.guardians.set(res.content || []); 
        done(); 
      },
      error: () => {
        this.messageService.add({ severity: 'warn', summary: 'Catálogo', detail: 'No se pudieron cargar los resguardantes.' });
        done();
      },
    });
 
    this.service.getLocations().subscribe({
      // ✅ Hacemos lo mismo para las ubicaciones
      next: (res: any) => { 
        this.locations.set(res.content || []); 
        done(); 
      },
      error: () => {
        this.messageService.add({ severity: 'warn', summary: 'Catálogo', detail: 'No se pudieron cargar las ubicaciones.' });
        done();
      },
    });
  }
}
