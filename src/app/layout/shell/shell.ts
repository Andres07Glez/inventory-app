import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { RouterModule, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Popover, PopoverModule } from 'primeng/popover';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth/auth.service';
import { AssetService } from '../../core/services/asset/asset.service';
import { ToastModule } from 'primeng/toast';
import { UserRole } from '../../core/models/auth.model';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, debounceTime, distinctUntilChanged, tap, filter, switchMap, catchError, of } from 'rxjs';
import { AssetSearchItemDTO } from '../../core/models/asset.model';


interface NavItem  { label: string; icon: string; route: string; roles?: UserRole[]; }
interface NavGroup { section: string; items: NavItem[]; roles?: UserRole[]; }

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
      { label: 'Dar de baja',   icon: 'pi pi-trash',                route: '/bajas' },
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
const LIFECYCLE_LABELS: Record<string, string> = {
  AVAILABLE:    'Disponible',
  ASSIGNED:     'Asignado',
  MAINTENANCE:  'Mantenimiento',
  DECOMMISSIONED: 'Baja',
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
  private readonly destroyRef     = inject(DestroyRef);
  private readonly elementRef     = inject(ElementRef);

  // ── Layout ────────────────────────────────────────────────────────────────
  readonly sidebarCollapsed = signal(false);

  // ── Búsqueda ──────────────────────────────────────────────────────────────
  readonly searchQuery    = signal('');
  readonly isSearching    = signal(false);
  readonly searchResults  = signal<AssetSearchItemDTO[]>([]);
  readonly showDropdown   = signal(false);
  readonly selectedIndex  = signal(-1);

  /** Cierra el dropdown al hacer clic fuera del componente shell */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown.set(false);
    }
  }

  constructor() {
    this.initSearchPipeline();
  }

  /**
   * Pipeline reactivo: signal → debounce → API → resultados.
   * Separado en su propio método para mantener el constructor limpio.
   */
  private initSearchPipeline(): void {
    toObservable(this.searchQuery)
      .pipe(
        map(q => q.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        tap(q => {
          if (q.length < 2) {
            // Limpiar estado sin hacer petición
            this.isSearching.set(false);
            this.searchResults.set([]);
            this.showDropdown.set(false);
          } else {
            this.isSearching.set(true);
            this.showDropdown.set(true);
          }
        }),
        filter(q => q.length >= 2),
        switchMap(q =>
          this.assetService.searchAssets(q, 8).pipe(
            catchError(() => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo conectar al servidor.',
                life: 3000,
              });
              return of(null);
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        this.isSearching.set(false);
        if (result !== null) {
          this.searchResults.set(result.content);
          this.selectedIndex.set(-1);
        }
      });
  }

  // ── Datos del usuario ─────────────────────────────────────────────────────
  readonly fullName       = computed(() => this.authService.currentUser()?.fullName ?? 'Usuario');
  readonly employeeNumber = computed(() => this.authService.currentUser()?.username ?? '');
  readonly role           = computed(() => this.authService.currentUser()?.role     ?? 'OPERADOR');
  readonly userInitial    = computed(() => this.fullName().charAt(0).toUpperCase());
  readonly roleLabel      = computed(() => ROLE_LABELS[this.role()] ?? 'Usuario');

  // ── Navegación filtrada ───────────────────────────────────────────────────
  readonly navGroups = computed(() => {
    const role = this.role();
    return ALL_NAV_GROUPS
      .filter(g => !g.roles || g.roles.includes(role))
      .map(g => ({ ...g, items: g.items.filter(i => !i.roles || i.roles.includes(role)) }))
      .filter(g => g.items.length > 0);
  });

  // ── Acciones del usuario ──────────────────────────────────────────────────
  toggleSidebar():              void { this.sidebarCollapsed.update(v => !v); }
  toggleUserMenu(e: MouseEvent): void { this.userMenuRef.toggle(e); }

  goToChangePassword(): void {
    this.userMenuRef.hide();
    this.router.navigate(['/cambiar-password']);
  }

  logout(): void {
    this.userMenuRef.hide();
    this.authService.logout();
  }

  // ── Búsqueda: interacción ─────────────────────────────────────────────────
  onSearchKeydown(event: KeyboardEvent): void {
    const results = this.searchResults();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update(i => Math.max(i - 1, -1));
        break;
      case 'Enter': {
        const idx    = this.selectedIndex();
        const target = idx >= 0 ? results[idx] : results[0];
        if (target) this.selectResult(target);
        break;
      }
      case 'Escape':
        this.clearSearch();
        break;
    }
  }

  selectResult(asset: AssetSearchItemDTO): void {
    this.clearSearch();
    this.router.navigate(['/inventario/bienes', asset.id]);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showDropdown.set(false);
    this.selectedIndex.set(-1);
  }

  // ── Helpers para la vista ─────────────────────────────────────────────────
  lifecycleLabel(status: string): string {
    return LIFECYCLE_LABELS[status] ?? status;
  }
}
