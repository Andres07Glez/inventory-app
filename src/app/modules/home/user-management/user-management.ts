import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { UserRole } from '../../../core/models/auth.model';
import { CreateUserRequest, UserDetail, UserSummary } from '../../../core/models/user.model';
import { UserManagementService } from '../../../core/services/user-management/user-management.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

type TagSeverity = 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast';

interface RoleOption { label: string; value: UserRole; }

const ROLE_OPTIONS: RoleOption[] = [
  { label: 'Administrador', value: 'ADMIN'     },
  { label: 'Operador',      value: 'OPERADOR'  },
  { label: 'Auditor',       value: 'AUDITOR'   },
  { label: 'Resguardante',  value: 'GUARDIAN'  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:    'Administrador',
  OPERADOR: 'Operador',
  AUDITOR:  'Auditor',
  GUARDIAN: 'Resguardante',
};

const ROLE_SEVERITY: Record<UserRole, TagSeverity> = {
  ADMIN:    'success',
  OPERADOR: 'info',
  AUDITOR:  'secondary',
  GUARDIAN: 'warn',
};

const EMPTY_FORM: CreateUserRequest = {
  username: '', fullName: '', email: '', employeeNumber: '', role: 'OPERADOR',
};

// Derivados de ROLE_OPTIONS para no duplicar la lista
const ROLE_FILTER_OPTIONS = [
  { label: 'Todos los roles', value: null as UserRole | null },
  ...ROLE_OPTIONS.map(o => ({ ...o, value: o.value as UserRole | null })),
];

const STATUS_FILTER_OPTIONS = [
  { label: 'Todos los estados',    value: null  as boolean | null },
  { label: 'Activos',  value: true  as boolean | null },
  { label: 'Inactivos',value: false as boolean | null },
];

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    TableModule, ButtonModule, TagModule, DialogModule,
    InputTextModule, SelectModule, TooltipModule,
    ConfirmPopupModule, AvatarModule,IconFieldModule, InputIconModule,
  ],
  templateUrl: './user-management.html',
  styleUrl:    './user-management.scss',
})
export class UserManagement implements OnInit {

  private readonly service    = inject(UserManagementService);
  private readonly messages   = inject(MessageService);
  private readonly confirmSvc = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchSubject = new Subject<string>();

  // ── Tabla ─────────────────────────────────────────────────────────────────
  readonly users        = signal<UserSummary[]>([]);
  readonly totalRecords = signal(0);
  readonly loading      = signal(false);
  readonly pageSize     = signal(15);
  readonly tableFirst   = signal(0);

  // ── Filtros ───────────────────────────────────────────────────────────────
  readonly searchInput  = signal('');
  readonly searchTerm   = signal('');
  readonly roleFilter   = signal<UserRole | null>(null);
  readonly statusFilter = signal<boolean | null>(null);

  // ── Diálogos ──────────────────────────────────────────────────────────────
  readonly showDetailDialog = signal(false);
  readonly showCreateDialog = signal(false);
  readonly saving           = signal(false);
  readonly selectedUser     = signal<UserSummary | null>(null);

  // ── Formularios ───────────────────────────────────────────────────────────
  readonly createForm = signal<CreateUserRequest>({ ...EMPTY_FORM });
  // ── Edición de rol inline (dentro del detail modal) ──────────────────────
  readonly detailRole  = signal<UserRole>('OPERADOR');
  readonly pendingRole = signal<UserRole | null>(null);

  readonly createFormValid = computed(() => {
    const f = this.createForm();
    return (
      f.username.trim().length >= 3                     &&
      f.fullName.trim().length  >  0                    &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)       &&
      /^EMP-\d{3,6}$/.test(f.employeeNumber)            &&
      !!f.role
    );
  });

  // ── Constantes expuestas al template ──────────────────────────────────────
  readonly roleOptions       = ROLE_OPTIONS;
  readonly roleFilterOptions = ROLE_FILTER_OPTIONS;
  readonly statusFilterOptions = STATUS_FILTER_OPTIONS;

  getRoleLabel   (role: string): string      { return ROLE_LABELS[role as UserRole]   ?? role;        }
  getRoleSeverity(role: string): TagSeverity { return ROLE_SEVERITY[role as UserRole] ?? 'secondary'; }
  getInitial     (name: string): string      { return name.charAt(0).toUpperCase();                   }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.resetAndLoad();
    });

    this.loadUsers(0);
  }

  // ── Lazy load (paginación / sort desde p-table) ───────────────────────────
  onLazyLoad(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize()));
    this.loadUsers(page, event.rows ?? this.pageSize());
  }

  // ── Filtros ───────────────────────────────────────────────────────────────
  onSearchInput(value: string): void {
    this.searchInput.set(value);
    this.searchSubject.next(value);
  }

  onRoleFilterChange(role: UserRole | null): void {
    this.roleFilter.set(role);
    this.resetAndLoad();
  }

  onStatusFilterChange(isActive: boolean | null): void {
    this.statusFilter.set(isActive);
    this.resetAndLoad();
  }

  private resetAndLoad(): void {
    this.tableFirst.set(0);
    this.loadUsers(0);
  }

  private loadUsers(page = 0, size = this.pageSize()): void {
    this.loading.set(true);
    this.service.findAll({
      page,
      size,
      search:   this.searchTerm()   || undefined,
      role:     this.roleFilter(),
      isActive: this.statusFilter(),
    }).subscribe({
      next: res => {
        this.users.set(res.content);
        this.totalRecords.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar la lista de usuarios.' });
      },
    });
  }

  // ── Detalle ───────────────────────────────────────────────────────────────
  openDetailDialog(user: UserSummary): void {
    this.selectedUser.set(user);
    this.detailRole.set(user.role);
    this.pendingRole.set(null);
    this.showDetailDialog.set(true);
  }
  onDetailRoleChange(newRole: UserRole): void {
    const current = this.selectedUser()?.role;
    // Si vuelve al valor original, limpia la confirmación sin guardar
    this.pendingRole.set(newRole !== current ? newRole : null);
  }
  confirmRoleChange(): void {
    const user    = this.selectedUser();
    const newRole = this.pendingRole();
    if (!user || !newRole) return;

    this.saving.set(true);
    this.service.updateRole(user.id, { role: newRole }).subscribe({
      next: updated => {
        this.saving.set(false);
        this.pendingRole.set(null);
        this.detailRole.set(updated.role);
        this.syncUser(updated);
        this.messages.add({ severity: 'success', summary: 'Rol actualizado',
          detail: `${user.fullName} ahora es ${ROLE_LABELS[updated.role]}.` });
      },
      error: err => {
        this.saving.set(false);
        this.pendingRole.set(null);
        this.detailRole.set(user.role);          // Revert visual
        this.messages.add({ severity: 'error', summary: 'Error',
          detail: err.error?.message ?? 'No se pudo cambiar el rol.' });
      },
    });
  }

  cancelRoleChange(): void {
    this.detailRole.set(this.selectedUser()!.role); // Revert select
    this.pendingRole.set(null);
  }

  // Actualiza tanto la lista como el usuario seleccionado (evita datos stale en el modal)
  private syncUser(updated: UserDetail): void {
    this.users.update(list =>
      list.map(u => u.id === updated.id ? { ...u, ...updated } : u)
    );
    if (this.selectedUser()?.id === updated.id) {
      this.selectedUser.set({ ...this.selectedUser()!, ...updated });
    }
  }

  // ── Crear ─────────────────────────────────────────────────────────────────
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
      next: user => {
        this.saving.set(false);
        this.showCreateDialog.set(false);
        this.messages.add({ severity: 'success', summary: 'Usuario creado',
          detail: `${user.fullName} creado. Contraseña inicial: número de empleado.`, life: 6000 });
        this.loadUsers(0);
      },
      error: err => {
        this.saving.set(false);
        this.messages.add({ severity: 'error', summary: 'Error al crear',
          detail: err.error?.message ?? 'Verifica que los datos no estén duplicados.' });
      },
    });
  }

  // ── Cambiar rol ───────────────────────────────────────────────────────────

  // ── Toggle estado ─────────────────────────────────────────────────────────
  confirmToggleStatus(user: UserSummary, event: Event): void {
    const action = user.isActive ? 'desactivar' : 'activar';
    this.confirmSvc.confirm({
      target: event.target as EventTarget,
      message: `¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${user.fullName}?`,
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: user.isActive ? 'danger' : 'success', size: 'small' },
      accept: () => this.toggleStatus(user),
    });
  }

  private toggleStatus(user: UserSummary): void {
    this.service.toggleStatus(user.id).subscribe({
      next: updated => {
        this.syncUser(updated);
        this.messages.add({ severity: 'info', summary: 'Estado actualizado',
          detail: `${user.fullName} ${updated.isActive ? 'activado' : 'desactivado'}.` });
      },
      error: err => this.messages.add({ severity: 'error', summary: 'Error',
        detail: err.error?.message ?? 'No se pudo cambiar el estado.' }),
    });
  }

  // ── Reset contraseña ──────────────────────────────────────────────────────
  confirmResetPassword(user: UserSummary, event: Event): void {
    this.confirmSvc.confirm({
      target: event.target as EventTarget,
      message: `¿Restablecer contraseña de ${user.fullName}? Se usará su número de empleado.`,
      acceptLabel: 'Restablecer',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'warn', size: 'small' },
      accept: () => this.doResetPassword(user),
    });
  }

  private doResetPassword(user: UserSummary): void {
    this.service.resetPassword(user.id).subscribe({
      next: () => this.messages.add({ severity: 'warn', summary: 'Contraseña restablecida',
        detail: `${user.fullName} deberá cambiarla en su próximo acceso.`, life: 6000 }),
      error: err => this.messages.add({ severity: 'error', summary: 'Error',
        detail: err.error?.message ?? 'No se pudo restablecer la contraseña.' }),
    });
  }
}
