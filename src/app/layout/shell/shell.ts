import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}
@Component({
  selector: 'app-shell',
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, ButtonModule, TooltipModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  sidebarCollapsed = signal(false);

  readonly navGroups: NavGroup[] = [
    {
      section: 'Principal',
      items: [
        { label: 'Dashboard',    icon: 'pi pi-home',      route: '/inventario/dashboard' },
      ],
    },
    {
      section: 'Inventario',
      items: [
        { label: 'Bienes',       icon: 'pi pi-box',       route: '/inventario/bienes' },
        { label: 'Asignaciones', icon: 'pi pi-user-plus', route: '/inventario/asignaciones' }, // ← NUEVO
        { label: 'Registrar',   icon: 'pi pi-plus',      route: '/inventario/registro' },
      ],
    },
    {
      section: 'Operaciones',
      items: [
        { label: 'Incidencias',   icon: 'pi pi-exclamation-triangle', route: '/incidencias' },
        { label: 'Mantenimiento', icon: 'pi pi-wrench',               route: '/mantenimiento' },
      ],
    },
    {
      section: 'Catálogos',
      items: [
        { label: 'Categorías',    icon: 'pi pi-tag',        route: '/catalogos/categories' },
        { label: 'Resguardantes', icon: 'pi pi-users',      route: '/catalogos/resguardantes' },
        { label: 'Ubicaciones',   icon: 'pi pi-map-marker', route: '/catalogos/ubicaciones' },
        { label: 'Marcas',        icon: 'pi pi-bookmark',   route: '/catalogos/brands' },
        { label: 'Proveedores',   icon: 'pi pi-truck',      route: '/catalogos/suppliers' },
        { label: 'Facturas',      icon: 'pi pi-receipt',    route: '/catalogos/invoices' },
      ],
    },
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

}
