import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { RouterModule, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Popover, PopoverModule } from 'primeng/popover';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth/auth.service';
import { AssetService } from '../../core/services/asset/asset.service';
import { ToastModule } from 'primeng/toast';
import { UserRole } from '../../core/models/auth.model';


interface NavItem  { label: string; icon: string; route: string; roles?: UserRole[]; }
interface NavGroup { section: string; items: NavItem[]; roles?: UserRole[]; }
/** Definición completa del menú. roles=undefined → visible para todos. */
const ALL_NAV_GROUPS: NavGroup[] = [
  {
    section: 'Principal',
    items: [
      { label: 'Dashboard', icon: 'pi pi-home', route: '/inventario/dashboard' },
    ],
  },
  {
    section: 'Inventario',
    items: [
      { label: 'Bienes',       icon: 'pi pi-box',       route: '/inventario/bienes' },
      { label: 'Asignaciones', icon: 'pi pi-user-plus', route: '/inventario/asignaciones', roles: ['ADMIN', 'OPERADOR'] },
      { label: 'Registrar',   icon: 'pi pi-plus',      route: '/inventario/registro',     roles: ['ADMIN', 'OPERADOR'] },
    ],
  },
  {
    section: 'Operaciones',
    roles: ['ADMIN', 'OPERADOR'],
    items: [
      { label: 'Incidencias',   icon: 'pi pi-exclamation-triangle', route: '/incidencias' },
      { label: 'Mantenimiento', icon: 'pi pi-wrench',               route: '/mantenimiento' },
    ],
  },
  {
    section: 'Catálogos',
    roles: ['ADMIN', 'OPERADOR'],
    items: [
      { label: 'Categorías',    icon: 'pi pi-tag',        route: '/catalogos/categories' },
      { label: 'Resguardantes', icon: 'pi pi-users',      route: '/catalogos/guardians' },
      { label: 'Ubicaciones',   icon: 'pi pi-map-marker', route: '/catalogos/locations' },
      { label: 'Marcas',        icon: 'pi pi-bookmark',   route: '/catalogos/brands' },
      { label: 'Proveedores',   icon: 'pi pi-truck',      route: '/catalogos/suppliers' },
      { label: 'Facturas',      icon: 'pi pi-receipt',    route: '/catalogos/invoices' },
    ],
  },
  {
    section: 'Administración',
    roles: ['ADMIN'],
    items: [
      { label: 'Usuarios', icon: 'pi pi-user-edit', route: '/admin/usuarios' },
    ],
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:    'Administrador',
  OPERADOR: 'Operador',
  AUDITOR:  'Auditor',
  GUARDIAN: 'Resguardante'
};
@Component({
  selector: 'app-shell',
  standalone:true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, ButtonModule, TooltipModule,PopoverModule,ToastModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  @ViewChild('userMenu') userMenuRef!: Popover;

  private readonly authService    = inject(AuthService);
  private readonly assetService   = inject(AssetService);
  private readonly messageService = inject(MessageService);
  private readonly router         = inject(Router);

  // ── Estado ────────────────────────────────────────────────────────────────

  readonly sidebarCollapsed = signal(false);
  readonly searchQuery      = signal('');
  readonly isSearching      = signal(false);

  // ── Datos del usuario desde el token ─────────────────────────────────────

// ── Datos del usuario (computed → reactivos al signal de AuthService) ─────
  readonly fullName       = computed(() => this.authService.currentUser()?.fullName       ?? 'Usuario');
  readonly employeeNumber = computed(() => this.authService.currentUser()?.username       ?? '');
  readonly role           = computed(() => this.authService.currentUser()?.role           ?? 'OPERADOR');
  readonly userInitial    = computed(() => this.fullName().charAt(0).toUpperCase());
  readonly roleLabel      = computed(() => ROLE_LABELS[this.role()] ?? 'Usuario');

  // ── Navegación filtrada por rol ────────────────────────────────────────────
  readonly navGroups = computed(() => {
    const role = this.role();
    return ALL_NAV_GROUPS
      .filter(g => !g.roles || g.roles.includes(role))
      .map(g => ({
        ...g,
        items: g.items.filter(i => !i.roles || i.roles.includes(role)),
      }))
      .filter(g => g.items.length > 0);
  });

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }
  toggleUserMenu(event: MouseEvent): void {
    this.userMenuRef.toggle(event);
  }

  goToChangePassword(): void {
    this.userMenuRef.hide();
    this.router.navigate(['/cambiar-password']);
  }

  logout(): void {
    this.userMenuRef.hide();
    this.authService.logout();
  }

  // ── Búsqueda ──────────────────────────────────────────────────────────────

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.executeSearch();
    if (event.key === 'Escape') this.clearSearch();
  }

  executeSearch(): void {
    const query = this.searchQuery().trim().toUpperCase();
    if (!query || this.isSearching()) return;

    this.isSearching.set(true);

    this.assetService.findByInventoryNumber(query).subscribe({
      next: (asset) => {
        this.isSearching.set(false);
        this.searchQuery.set('');
        this.router.navigate(['/inventario/bienes', asset.id]);
      },
      error: (err) => {
        this.isSearching.set(false);
        const detail = err.status === 404
          ? `No se encontró el número "${query}".`
          : 'Error al realizar la búsqueda.';
        this.messageService.add({ severity: 'warn', summary: 'Sin resultados', detail, life: 4000 });
      },
    });
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

}
