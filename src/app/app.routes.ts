import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { UserRole } from './core/models/user.model';
import { roleGuard } from './core/guards/role-guard';
import { Shell } from './layout/shell/shell';

const forRoles = (...roles: UserRole[]) => ({ roles });



export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./modules/home/auth/login/login').then(m => m.Login) },
  {
    path: 'cambiar-password',
    loadComponent: () =>
      import('./modules/home/auth/change-password/change-password').then(m => m.ChangePassword),
    canActivate: [authGuard],
  },

  {
    path: '',
    component: Shell,
    canActivate: [authGuard],   // autenticación global en el shell
    children: [

      // ── Accesibles para todos los roles autenticados ─────────────────────
      {
        path: 'inventario/dashboard',
        loadComponent: () => import('./modules/home/dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'inventario/bienes',
        loadComponent: () => import('./modules/home/assets-list/assets-list').then(m => m.AssetsList),
      },
      {
        path: 'inventario/bienes/:id',
        loadComponent: () => import('./modules/home/asset-detail/asset-detail').then(m => m.AssetDetail),
      },

      // ── ADMIN + OPERADOR ─────────────────────────────────────────────────
      {
        path: 'inventario/registro',
        loadComponent: () => import('./modules/home/asset-registration/asset-registration').then(m => m.AssetRegistration),
        canActivate: [roleGuard],
        data: forRoles('ADMIN', 'OPERADOR'),
      },
      {
        path: 'inventario/asignaciones',
        loadComponent: () => import('./modules/home/asset-assignment/asset-assignment').then(m => m.AssetAssignmentComponent),
        canActivate: [roleGuard],
        data: forRoles('ADMIN', 'OPERADOR'),
      },
      {
        path: 'incidencias',
        loadComponent: () => import('./modules/home/incident/incident').then(m => m.IncidentComponent),
        canActivate: [roleGuard],
        data: forRoles('ADMIN', 'OPERADOR'),
      },
      {
        path: 'incidencias/:id',
        loadComponent: () => import('./modules/home/incident-detail/incident-detail').then(m => m.IncidentDetailComponent),
        canActivate: [roleGuard],
        data: forRoles('ADMIN', 'OPERADOR'),
      },
      {
        path: 'mantenimiento',
        loadComponent: () => import('./modules/home/maintenance/maintenance').then(m => m.MaintenanceComponent),
        canActivate: [roleGuard],
        data: forRoles('ADMIN', 'OPERADOR'),
      },
      {
        path: 'mantenimiento/:id',
        loadComponent: () => import('./modules/home/asset-maintenance-tab/asset-maintenance-tab').then(m => m.AssetMaintenanceTab),
        canActivate: [roleGuard],
        data: forRoles('ADMIN', 'OPERADOR'),
      },
      {
        path: 'bajas',
        loadComponent: () => import('./modules/home/decomission-list/decomission-list').then(m => m.DecommissionListComponent),
        canActivate: [roleGuard],
        data: forRoles('ADMIN', 'OPERADOR'),
      },
      {
        path: 'bajas/nueva',
        loadComponent: () => import('./modules/home/decomission-create/decomission-create').then(m => m.DecomissionCreateComponent),
        canActivate: [roleGuard],
        data: forRoles('ADMIN', 'OPERADOR'),
      },
      {
        path: 'bajas/:id',
        loadComponent: () => import('./modules/home/decomission-detail/decomission-detail').then(m => m.DecommissionDetailComponent),
        canActivate: [roleGuard],
        data: forRoles('ADMIN', 'OPERADOR'),
      },
      {
        path: 'catalogos',
        canActivate: [roleGuard],
        data: forRoles('ADMIN', 'OPERADOR'),
        children: [
          { path: 'categories',     loadComponent: () => import('./modules/home/category/category').then(m => m.CategoryComponent) },
          { path: 'guardians',  loadComponent: () => import('./modules/home/guardian-registration/guardian-registration').then(m => m.GuardianRegistration) },
          { path: 'locations',    loadComponent: () => import('./modules/home/location-registration/location-registration').then(m => m.LocationRegistration) },
          { path: 'brands',         loadComponent: () => import('./modules/home/marca-registration/marca-registration').then(m => m.MarcaRegistration) },
          { path: 'suppliers',      loadComponent: () => import('./modules/home/supplier/supplier').then(m => m.SupplierComponent) },
          { path: 'invoices',       loadComponent: () => import('./modules/home/invoice-registration/invoice-registration').then(m => m.InvoiceRegistration) },
        ],
      },

      // ── Solo ADMIN ───────────────────────────────────────────────────────
      {
        path: 'admin/usuarios',
        loadComponent: () => import('./modules/home/user-management/user-management')
          .then(m => m.UserManagement),
        canActivate: [roleGuard],
        data: forRoles('ADMIN'),
      },

      // Fallback
      { path: '', redirectTo: 'inventario/dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'inventario/dashboard', pathMatch: 'full' }

    ],
  },
];
