import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { catchError, of } from 'rxjs';
//import { AssetService } from '../'; // ajusta la ruta según tu estructura
import { AssetService } from '../../../core/service/asset.service';

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

interface Brand {
  id: number;
  name: string;
  isActive: boolean;
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
  readonly DEFAULT_LOCATION_ID = 3; // ID del Almacén General en la BD

  progressValue = computed(() => ((this.activeStep() + 1) / this.totalSteps) * 100);

  // ── Form
  form!: FormGroup;

  // ── Upload state
  uploadedImages: File[] = [];
  maxImages = 5;

  // ── Número de inventario — consumido desde AssetService
  nextInventoryNumber = signal<string>('…');
  inventoryNumberLoading = signal(true);

  useCustomInventoryNumber = signal(false);
  customInventoryNumber = signal('');

  get displayInventoryNumber(): string {
    if (this.useCustomInventoryNumber() && this.customInventoryNumber().trim()) {
      return this.customInventoryNumber().trim();  // número que escribió el usuario
    }
    return this.nextInventoryNumber();  // número automático del backend
  }

  toggleInventoryMode() {
    this.useCustomInventoryNumber.update(v => !v);
    if (!this.useCustomInventoryNumber()) {
      this.customInventoryNumber.set('');
    }
  }

  private loadNextFolio(): void {
    this.inventoryNumberLoading.set(true);
    this.assetService.getNextFolio()
      .pipe(catchError(() => of(null)))
      .subscribe(folio => {
        this.inventoryNumberLoading.set(false);
        this.nextInventoryNumber.set(folio ?? 'Sin conexión');
      });
  }

  private loadCatalogs(): void {
    // Categorías
    this.assetService.getCategories().pipe(catchError(() => of([]))).subscribe(data => {
      this.categories = data.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        parent_id: c.parent?.id ?? null
      }));
    });

    // Facturas
    this.assetService.getInvoices().pipe(catchError(() => of([]))).subscribe(data => {
      this.invoices = data.map(i => ({
        id: i.id,
        invoice_number: i.invoiceNumber,
        supplier: i.supplier,
        invoice_date: i.invoiceDate
      }));
    });

    // Marcas
    this.assetService.getBrands().pipe(catchError(() => of([]))).subscribe(data => {
      this.brands = data;
    });
  }

  // ── Ubicación fija: Almacén General — Campus Central
  // No es editable por el usuario; se envía siempre este valor al backend
  readonly DEFAULT_LOCATION_LABEL = 'Almacén General';
  readonly DEFAULT_LOCATION_CAMPUS = 'Campus Central';

  brands: Brand[] = [];

  // ── Catalog Data (mock — en producción vendrían de un servicio)
  categories: Category[] = [
    /*{ id: 1, name: 'Bienes Muebles', description: 'Mobiliario en general', parent_id: null },
    { id: 2, name: 'Equipo de Cómputo', description: 'Computadoras y componentes', parent_id: null },
    { id: 3, name: 'Licencias de Software', description: 'Licencias físicas y electrónicas', parent_id: null },
    { id: 4, name: 'Climatización', description: 'Aires acondicionados y equipo de clima', parent_id: null },
    { id: 5, name: 'Equipo de Laboratorio', description: 'Instrumental y equipo especializado', parent_id: null },
    { id: 6, name: 'CPUs y Servidores', description: 'Unidades centrales y servidores', parent_id: 2 },
    { id: 7, name: 'Periféricos', description: 'Mouse, teclado, monitor, impresoras, etc.', parent_id: 2 },
    { id: 8, name: 'Laptops', description: 'Equipos portátiles', parent_id: 2 },*/
  ];

  locations: Location[] = [
    /*{ id: 1, name: 'Laboratorio de Cómputo A', building: 'Edificio TI', campus: 'Campus Central' },
    { id: 2, name: 'Sala de Servidores', building: 'Edificio TI', campus: 'Campus Central' },
    { id: 3, name: 'Aula Magna', building: 'Edificio Académico', campus: 'Campus Central' },
    { id: 4, name: 'Biblioteca', building: 'Edificio Cultural', campus: 'Campus Central' },
    { id: 5, name: 'Bodega Principal', building: 'Almacén', campus: 'Campus Central' },*/
  ];

  invoices: Invoice[] = [
    /*{ id: 1, invoice_number: 'FAC-2026-001', supplier: 'Dell México S.A.', invoice_date: '2026-01-15' },
    { id: 2, invoice_number: 'FAC-2026-002', supplier: 'HP Inc.', invoice_date: '2026-02-10' },
    { id: 3, invoice_number: 'FAC-2026-003', supplier: 'Office Depot', invoice_date: '2026-03-05' },*/
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

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private assetService: AssetService,
  ) { }

  ngOnInit() {
    this.buildForm();
    this.loadNextFolio();
    this.loadCatalogs();
  }

  // ── Build Form
  buildForm() {
    this.form = this.fb.group({
      // Step 1 — Identificación
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      brand: [null, Validators.required],
      model: [''],
      serial_number: [''],
      category_id: [null, Validators.required],

      // Step 1 — Ubicación y Fechas
      // location_id no es campo del form: siempre se envía el valor por defecto (DEFAULT_LOCATION_LABEL)
      invoice_id: [null],
      entry_date: [new Date(), Validators.required],

      // Defaults automáticos
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
    if (this.canAdvance() && this.activeStep() < this.totalSteps - 1) {
      this.activeStep.update((s) => s + 1);
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
        !this.isFieldInvalid('description') &&
        !!this.form.get('description')?.value &&
        !this.isFieldInvalid('category_id') &&
        !!this.form.get('category_id')?.value &&
        !!this.form.get('brand')?.value
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

  getBrandName(id: number | null): string {
    if (!id) return '—';
    return this.brands.find(b => b.id === id)?.name ?? '—';
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
  submitForm() {
    console.log('useCustom:', this.useCustomInventoryNumber());
    console.log('customNumber:', this.customInventoryNumber());
    console.log('displayInventoryNumber:', this.displayInventoryNumber);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Formulario incompleto',
        detail: 'Verifica los campos requeridos antes de guardar.',
      });
      return;
    }

    const raw = this.form.getRawValue();
    const selectedBrand = this.brands.find(b => b.id === raw.brand);

    const inventoryNumber = this.useCustomInventoryNumber() && this.customInventoryNumber().trim()
      ? this.customInventoryNumber().trim()
      : this.nextInventoryNumber();

    console.log('invoice_id del form:', raw.invoice_id);
    console.log('invoiceId en payload:', raw.invoice_id ?? undefined);
    console.log('invoice seleccionada:', this.getSelectedInvoice());

    const payload = {
      //inventoryNumber: this.displayInventoryNumber,
      inventoryNumber: inventoryNumber,
      description: raw.description?.trim().toUpperCase(),
      brand: selectedBrand?.name ?? undefined,
      model: raw.model || undefined,
      serialNumber: raw.serial_number || undefined,
      barcode: undefined,
      notes: raw.notes || undefined,
      categoryId: raw.category_id,
      locationId: this.DEFAULT_LOCATION_ID,
      invoiceId: raw.invoice_id ?? undefined,
      entryDate: (raw.entry_date as Date).toISOString().split('T')[0],
      conditionStatus: raw.condition_status
    };

    this.assetService.registerAsset(payload).subscribe({
      /*next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Bien registrado!',
          detail: `Folio asignado: ${res.inventoryNumber}`,
          life: 5000
        });
        this.loadNextFolio();
        setTimeout(() => {
          this.form.reset();
          this.form.patchValue({
            entry_date: new Date(),
            condition_status: 'GOOD',
            lifecycle_status: 'REGISTERED'
          });
          this.useCustomInventoryNumber.set(false);
          this.customInventoryNumber.set('');
          this.activeStep.set(0);
          this.uploadedImages = [];
        }, 1500);
      },*/
      /*next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Bien registrado!',
          detail: `Folio asignado: ${res.inventoryNumber}`,
          life: 5000
        });

        // Calcula el siguiente folio desde el inventoryNumber real que retornó el backend
        const parts = res.inventoryNumber.split('-');
        if (parts.length === 3) {
          const year = parts[1];
          const nextSeq = String(parseInt(parts[2], 10) + 1).padStart(5, '0');
          this.nextInventoryNumber.set(`INV-${year}-${nextSeq}`);
        } else {
          this.loadNextFolio(); // fallback si el formato es inesperado
        }

        setTimeout(() => {
          this.form.reset();
          this.form.patchValue({
            entry_date: new Date(),
            condition_status: 'GOOD',
            lifecycle_status: 'REGISTERED'
          });
          this.useCustomInventoryNumber.set(false);
          this.customInventoryNumber.set('');
          this.activeStep.set(0);
          this.uploadedImages = [];
        }, 1500);
      },*/
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Bien registrado!',
          detail: `Folio asignado: ${res.inventoryNumber}`,
          life: 5000
        });

        setTimeout(() => {
          this.form.reset();
          this.form.patchValue({
            entry_date: new Date(),
            condition_status: 'GOOD',
            lifecycle_status: 'REGISTERED'
          });
          this.useCustomInventoryNumber.set(false);
          this.customInventoryNumber.set('');
          this.activeStep.set(0);
          this.uploadedImages = [];

          // Se llama aquí adentro para darle tiempo al backend
          // de confirmar la transacción antes de consultar el siguiente folio
          this.loadNextFolio();
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