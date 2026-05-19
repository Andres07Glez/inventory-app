import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { UserRole } from '../../../core/models/auth.model';
import { CreateUserRequest, UserSummary } from '../../../core/models/user.model';
import { UserManagementService } from '../../../core/services/user-management/user-management.service';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { AvatarModule } from 'primeng/avatar';
import { FormsModule } from '@angular/forms';




type TagSeverity = 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast';

interface RoleOption { label: string; value: UserRole; }

const ROLE_OPTIONS: RoleOption[] = [
  { label: 'Administrador', value: 'ADMIN' },
  { label: 'Operador',      value: 'OPERADOR' },
  { label: 'Auditor',       value: 'AUDITOR' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:    'Administrador',
  OPERADOR: 'Operador',
  AUDITOR:  'Auditor',
};

const ROLE_SEVERITY: Record<UserRole, TagSeverity> = {
  ADMIN:    'success',
  OPERADOR: 'info',
  AUDITOR:  'secondary',
};

const EMPTY_FORM: CreateUserRequest = {
  username: '',
  fullName: '',
  email: '',
  employeeNumber: '',
  role: 'OPERADOR',
};
@Component({
  selector: 'app-user-management',
  standalone:true,
  imports: [DatePipe,
    TableModule, ButtonModule, TagModule, DialogModule,
    InputTextModule, SelectModule, TooltipModule,
    ConfirmPopupModule, AvatarModule,FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement implements OnInit{

  private readonly service     = inject(UserManagementService);
  private readonly messages    = inject(MessageService);
  private readonly confirmSvc  = inject(ConfirmationService);

  // ── Datos de la tabla ─────────────────────────────────────────────────────
  readonly users        = signal<UserSummary[]>([]);
  readonly totalRecords = signal(0);
  readonly loading      = signal(false);
  readonly pageSize     = signal(15);

  // ── Estado de los diálogos ────────────────────────────────────────────────
  readonly showCreateDialog = signal(false);
  readonly showRoleDialog   = signal(false);
  readonly saving           = signal(false);
  readonly selectedUser     = signal<UserSummary | null>(null);

  // ── Formularios (signal-driven, sin FormsModule) ──────────────────────────
  readonly createForm = signal<CreateUserRequest>({ ...EMPTY_FORM });
  readonly newRole    = signal<UserRole>('OPERADOR');

  // ── Validación del formulario de creación ─────────────────────────────────
  readonly createFormValid = computed(() => {
    const f = this.createForm();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const empRegex   = /^EMP-\d{3,6}$/;
    return (
      f.username.trim().length >= 3   &&
      f.fullName.trim().length  >  0  &&
      emailRegex.test(f.email)        &&
      empRegex.test(f.employeeNumber) &&
      !!f.role
    );
  });

  // ── Exposición de constantes al template ──────────────────────────────────
  readonly roleOptions   = ROLE_OPTIONS;
  getRoleLabel(role: string): string {
    return ROLE_LABELS[role as UserRole] ?? role;
  }

  getRoleSeverity(role: string): TagSeverity {
    return ROLE_SEVERITY[role as UserRole] ?? 'secondary';
  }

  ngOnInit(): void {
    this.loadUsers(0);
  }

  // ── Carga lazy desde p-table ──────────────────────────────────────────────
  onLazyLoad(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize()));
    this.loadUsers(page, event.rows ?? this.pageSize());
  }

  private loadUsers(page = 0, size = this.pageSize()): void {
    this.loading.set(true);
    this.service.findAll({ page, size }).subscribe({
      next: (res) => {
        this.users.set(res.content);
        this.totalRecords.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la lista de usuarios.',
        });
      },
    });
  }

  // ── Crear usuario ─────────────────────────────────────────────────────────
  openCreateDialog(): void {
    this.createForm.set({ ...EMPTY_FORM });
    this.showCreateDialog.set(true);
  }

  updateField<K extends keyof CreateUserRequest>(key: K, value: CreateUserRequest[K]): void {
    this.createForm.update(f => ({ ...f, [key]: value }));
  }

  create(): void {
    if (!this.createFormValid()) return;
    this.saving.set(true);

    this.service.create(this.createForm()).subscribe({
      next: (user) => {
        this.saving.set(false);
        this.showCreateDialog.set(false);
        this.messages.add({
          severity: 'success',
          summary: 'Usuario creado',
          detail: `${user.fullName} creado. Contraseña inicial: número de empleado.`,
          life: 6000,
        });
        this.loadUsers();
      },
      error: (err) => {
        this.saving.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Error al crear',
          detail: err.error?.message ?? 'Verifica que los datos no estén duplicados.',
        });
      },
    });
  }

  // ── Cambiar rol ───────────────────────────────────────────────────────────
  openRoleDialog(user: UserSummary): void {
    this.selectedUser.set(user);
    this.newRole.set(user.role);
    this.showRoleDialog.set(true);
  }

  saveRole(): void {
    const user = this.selectedUser();
    if (!user) return;
    this.saving.set(true);

    this.service.updateRole(user.id, { role: this.newRole() }).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.showRoleDialog.set(false);
        // Actualización local sin recargar toda la tabla
        this.users.update(list =>
          list.map(u => u.id === updated.id ? { ...u, role: updated.role } : u)
        );
        this.messages.add({
          severity: 'success',
          summary: 'Rol actualizado',
          detail: `${user.fullName} ahora es ${ROLE_LABELS[updated.role]}.`,
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'No se pudo cambiar el rol.',
        });
      },
    });
  }

  // ── Activar / Desactivar ──────────────────────────────────────────────────
  confirmToggleStatus(user: UserSummary, event: Event): void {
    const action = user.isActive ? 'desactivar' : 'activar';
    this.confirmSvc.confirm({
      target: event.target as EventTarget,
      message: `¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${user.fullName}?`,
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {
        severity: user.isActive ? 'danger' : 'success',
        size: 'small',
      },
      accept: () => this.toggleStatus(user),
    });
  }

  private toggleStatus(user: UserSummary): void {
    this.service.toggleStatus(user.id).subscribe({
      next: (updated) => {
        this.users.update(list =>
          list.map(u => u.id === updated.id ? { ...u, isActive: updated.isActive } : u)
        );
        this.messages.add({
          severity: 'info',
          summary: 'Estado actualizado',
          detail: `${user.fullName} ${updated.isActive ? 'activado' : 'desactivado'}.`,
        });
      },
      error: (err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'No se pudo cambiar el estado.',
        });
      },
    });
  }

  // ── Helpers para el template ──────────────────────────────────────────────
  getInitial(fullName: string): string {
    return fullName.charAt(0).toUpperCase();
  }
}
