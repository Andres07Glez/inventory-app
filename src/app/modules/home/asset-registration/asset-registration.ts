import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetService } from '../../../core/service/asset.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { StepperModule } from 'primeng/stepper';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChipModule } from 'primeng/chip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IftaLabelModule } from 'primeng/iftalabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InplaceModule } from 'primeng/inplace';

// ─── Interfaces ────────────────────────────────────────────
interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number | null;
}

interface Location {
  id: number;
  name: string;
  building?: string;
  campus?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  supplier?: string;
  invoice_date: string;
}

interface ConditionOption {
  label: string;
  value: 'GOOD' | 'REGULAR' | 'BAD';
  icon: string;
  severity: string;
}

interface LifecycleOption {
  label: string;
  value: string;
  description: string;
}

// ─── Component ────────────────────────────────────────────
@Component({
  selector: 'app-asset-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    CardModule,
    DividerModule,
    StepperModule,
    FileUploadModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ProgressBarModule,
    ChipModule,
    FloatLabelModule,
    IftaLabelModule,
    IconFieldModule,
    InputIconModule,
    ToggleButtonModule,
    SelectButtonModule,
    InplaceModule,
  ],
  providers: [MessageService],
  templateUrl: './asset-registration.html',
  styleUrl: './asset-registration.css',
})
export class AssetRegistration implements OnInit {
  // ── Stepper state
  activeStep = signal(0);
  totalSteps = 2;

  progressValue = computed(() => ((this.activeStep() + 1) / this.totalSteps) * 100);

  // ── Form
  form!: FormGroup;

  // ── Upload state
  uploadedImages: File[] = [];
  maxImages = 3;

  // ── Generated inventory number (preview)
  previewInventoryNumber = signal('INV-2026-XXXXX');

  // ── Catalog Data (mock — en producción vendrían de un servicio)
  categories: Category[] = [
    { id: 1, name: 'Bienes Muebles', description: 'Mobiliario en general', parent_id: null },
    { id: 2, name: 'Equipo de Cómputo', description: 'Computadoras y componentes', parent_id: null },
    { id: 3, name: 'Licencias de Software', description: 'Licencias físicas y electrónicas', parent_id: null },
    { id: 4, name: 'Climatización', description: 'Aires acondicionados y equipo de clima', parent_id: null },
    { id: 5, name: 'Equipo de Laboratorio', description: 'Instrumental y equipo especializado', parent_id: null },
    { id: 6, name: 'CPUs y Servidores', description: 'Unidades centrales y servidores', parent_id: 2 },
    { id: 7, name: 'Periféricos', description: 'Mouse, teclado, monitor, impresoras, etc.', parent_id: 2 },
    { id: 8, name: 'Laptops', description: 'Equipos portátiles', parent_id: 2 },
  ];

  locations: Location[] = [
    { id: 1, name: 'Laboratorio de Software', building: 'Edificio de Computacion', campus: 'Loma Bonita' },
    { id: 2, name: 'Laboratorio Quimico - Biologico', building: 'Laboratorio Quimico', campus: 'Loma Bonita' },
    { id: 3, name: 'Auditorio', building: '', campus: 'Loma Bonita' },
    { id: 1, name: 'Laboratorio de Cómputo A', building: 'Edificio TI', campus: 'Campus Central' },
    { id: 2, name: 'Sala de Servidores', building: 'Edificio TI', campus: 'Campus Central' },
    { id: 3, name: 'Aula Magna', building: 'Edificio Académico', campus: 'Campus Central' },
    { id: 4, name: 'Biblioteca', building: 'Edificio Cultural', campus: 'Campus Central' },
    { id: 5, name: 'Bodega Principal', building: 'Almacén', campus: 'Campus Central' },
  ];

  invoices: Invoice[] = [
    { id: 1, invoice_number: 'FAC-2026-001', supplier: 'Dell México S.A.', invoice_date: '2026-01-15' },
    { id: 2, invoice_number: 'FAC-2026-002', supplier: 'HP Inc.', invoice_date: '2026-02-10' },
    { id: 3, invoice_number: 'FAC-2026-003', supplier: 'Office Depot', invoice_date: '2026-03-05' },
  ];

  conditionOptions: ConditionOption[] = [
    { label: 'Bueno', value: 'GOOD', icon: 'pi-check-circle', severity: 'success' },
    { label: 'Regular', value: 'REGULAR', icon: 'pi-exclamation-circle', severity: 'warn' },
    { label: 'Malo', value: 'BAD', icon: 'pi-times-circle', severity: 'danger' },
  ];

  lifecycleOptions: LifecycleOption[] = [
    { label: 'Registrado', value: 'REGISTERED', description: 'Ingresado al sistema, sin asignar' },
    { label: 'Disponible', value: 'AVAILABLE', description: 'Listo para asignación' },
    { label: 'Asignado', value: 'ASSIGNED', description: 'Con resguardante activo' },
    { label: 'En Mantenimiento', value: 'IN_MAINTENANCE', description: 'En reparación o servicio' },
    { label: 'En Garantía', value: 'IN_WARRANTY', description: 'Cubierto por garantía de proveedor' },
  ];

  selectButtonCondition = [
    { label: 'Bueno', value: 'GOOD' },
    { label: 'Regular', value: 'REGULAR' },
    { label: 'Malo', value: 'BAD' },
  ];

  selectButtonLifecycle = [
    { label: 'Registrado', value: 'REGISTERED' },
    { label: 'Disponible', value: 'AVAILABLE' },
  ];

  //constructor(private fb: FormBuilder, private messageService: MessageService) {}
  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private assetService: AssetService   // ← inyecta el servicio
  ) { }

  ngOnInit() {
    this.buildForm();
    this.loadCatalogs();   // ← carga catálogos reales al iniciar
    this.loadNextFolio();   // ← agrega esto
  }

  loadNextFolio() {
    this.assetService.getNextFolio().subscribe({
      next: (folio) => this.previewInventoryNumber.set(folio),
      error: () => this.previewInventoryNumber.set('INV-2026-?????')
    });
  }

  loadCatalogs() {
    this.assetService.getCategories().subscribe({
      next: (data) => {
        // Adapta la respuesta del backend al formato que espera el template
        this.categories = data.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          parent_id: c.parent?.id ?? null
        }));
      },
      error: () => this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'No se pudieron cargar las categorías.'
      })
    });

    this.assetService.getLocations().subscribe({
      next: (data) => { this.locations = data; },
      error: () => { }
    });

    this.assetService.getInvoices().subscribe({
      next: (data) => {
        // Adapta camelCase del backend al snake_case que usa el template
        this.invoices = data.map(i => ({
          id: i.id,
          invoice_number: i.invoiceNumber,
          supplier: i.supplier,
          invoice_date: i.invoiceDate
        }));
      },
      error: () => { }
    });
  }

  // ── Build Form
  buildForm() {
    this.form = this.fb.group({
      // Step 1 — Identificación
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      serial_number: [''],
      barcode: [''],
      category_id: [null, Validators.required],

      // Step 1 — Ubicación y Fechas
      location_id: [null],
      invoice_id: [null, Validators.required],
      // invoice_date se toma directamente de la factura seleccionada, no se captura aquí
      entry_date: [{ value: new Date(), disabled: true }, Validators.required],

      // Step 3 — Estado
      condition_status: ['GOOD', Validators.required],
      lifecycle_status: ['REGISTERED', Validators.required],
      notes: [''],
    });
  }

  // ── Getters (convenience)
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  // ── Step navigation
  goToStep(step: number) {
    if (step < this.activeStep()) {
      this.activeStep.set(step);
      return;
    }
    if (this.canAdvance()) {
      this.activeStep.set(step);
    }
  }

  nextStep() {
    if (this.activeStep() < this.totalSteps - 1) {
      if (this.canAdvance()) {
        this.activeStep.update((s) => s + 1);
      } else {
        // Marca los campos obligatorios del step 0 como tocados para mostrar errores
        ['description', 'category_id', 'brand', 'model', 'invoice_id'].forEach(field => {
          this.form.get(field)?.markAsTouched();
        });
        this.messageService.add({
          severity: 'warn',
          summary: 'Campos incompletos',
          detail: 'Completa todos los campos requeridos para continuar.',
          life: 4000
        });
      }
    }
  }

  prevStep() {
    if (this.activeStep() > 0) {
      this.activeStep.update((s) => s - 1);
    }
  }

  canAdvance(): boolean {
    const step = this.activeStep();
    if (step === 0) {
      return (
        !!this.form.get('description')?.value &&
        !this.isFieldInvalid('description') &&
        !!this.form.get('category_id')?.value &&
        !!this.form.get('brand')?.value &&
        !!this.form.get('model')?.value &&
        !!this.form.get('invoice_id')?.value
      );
    }
    return true;
  }

  // ── Image Upload
  onImageSelect(event: any) {
    for (const file of event.files) {
      if (this.uploadedImages.length < this.maxImages) {
        this.uploadedImages.push(file);
      }
    }
  }

  removeImage(index: number) {
    this.uploadedImages.splice(index, 1);
  }

  // ── Condition helpers
  getConditionSeverity(value: string): 'success' | 'warn' | 'danger' | 'info' {
    if (value === 'GOOD') return 'success';
    if (value === 'REGULAR') return 'warn';
    return 'danger';
  }

  getConditionLabel(value: string): string {
    return this.conditionOptions.find((o) => o.value === value)?.label ?? value;
  }

  getLifecycleLabel(value: string): string {
    return this.lifecycleOptions.find((o) => o.value === value)?.label ?? value;
  }

  getCategoryName(id: number | null): string {
    if (!id) return '—';
    return this.categories.find((c) => c.id === id)?.name ?? '—';
  }

  getLocationName(id: number | null): string {
    if (!id) return 'Sin asignar';
    return this.locations.find((l) => l.id === id)?.name ?? '—';
  }

  getInvoiceLabel(id: number | null): string {
    if (!id) return 'Sin factura';
    const inv = this.invoices.find((i) => i.id === id);
    return inv ? `${inv.invoice_number} — ${inv.supplier}` : '—';
  }

  // ── Get selected invoice object
  getSelectedInvoice(): Invoice | undefined {
    const id = this.form.get('invoice_id')?.value;
    if (!id) return undefined;
    return this.invoices.find((i) => i.id === id);
  }

  // ── Submit
  // Reemplaza submitForm() completo:

  submitForm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Formulario incompleto',
        detail: 'Verifica los campos requeridos antes de guardar.'
      });
      return;
    }

    const raw = this.form.getRawValue();
    const selectedInvoice = this.getSelectedInvoice();

    const payload = {
      description: raw.description?.trim(),
      brand: raw.brand || null,
      model: raw.model || null,
      serialNumber: raw.serial_number || null,
      barcode: raw.barcode || null,
      notes: raw.notes || null,
      categoryId: raw.category_id,
      locationId: raw.location_id ?? null,
      invoiceId: raw.invoice_id ?? null,
      entryDate: (raw.entry_date as Date).toISOString().split('T')[0],
      conditionStatus: raw.condition_status
    };

    this.assetService.registerAsset(payload).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Bien registrado!',
          detail: `Folio asignado: ${res.inventoryNumber}`,
          life: 5000
        });
        this.loadNextFolio(); // ← refresca el preview para el siguiente bien
        setTimeout(() => {
          this.form.reset();
          this.form.patchValue({
            entry_date: new Date(),
            condition_status: 'GOOD',
            lifecycle_status: 'REGISTERED'
          });
          this.activeStep.set(0);
          this.uploadedImages = [];
        }, 1500);
      },
      error: (err) => {
        const msg = err.error?.message ?? 'Ocurrió un error al registrar el bien.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error al guardar',
          detail: msg
        });
      }
    });
  }

  // ── Category grouped label helper
  getCategoryOptionLabel(cat: Category): string {
    return cat.parent_id ? `  ↳ ${cat.name}` : cat.name;
  }
}