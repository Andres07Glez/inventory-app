import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';


export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./modules/home/auth/login/login').then(m => m.Login),
  },
  {
    path: 'cambiar-password',
    loadComponent: () =>
      import('./modules/home/auth/change-password/change-password').then(m => m.ChangePassword),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then(m => m.Shell),
    children: [
      { path: '', redirectTo: 'inventario/dashboard', pathMatch: 'full' },
      {
        path: 'inventario/dashboard',
        loadComponent: () =>
          import('./modules/home/dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'inventario/bienes',
        loadComponent: () =>
          import('./modules/home/assets-list/assets-list').then(m => m.AssetsList),
      },
      {
        path: 'inventario/bienes/:id',
        loadComponent: () =>
          import('./modules/home/asset-detail/asset-detail').then(m => m.AssetDetail),
      },
      {
        // Sin query param → muestra búsqueda completa (acceso desde sidebar)
        // Con ?assetId=42   → salta la búsqueda, pre-carga el bien (acceso desde asset-detail)
        path: 'inventario/asignaciones',
        loadComponent: () =>
          import('./modules/home/asset-assignment/asset-assignment').then(m => m.AssetAssignmentComponent),
      },
      {
        path: 'inventario/registro',
        loadComponent: () =>
          import('./modules/home/asset-registration/asset-registration').then(m => m.AssetRegistration),
      },
      {
        path:'catalogos/invoices',
        loadComponent:()=>
          import('./modules/home/invoice-registration/invoice-registration').then(m=>m.InvoiceRegistration),
      },
      {
        path:'catalogos/brands',
        loadComponent:()=>
          import('./modules/home/marca-registration/marca-registration').then(m=>m.MarcaRegistration),
      },
      {
        path:'catalogos/categories',
        loadComponent:()=>
          import('./modules/home/category/category').then(m=>m.CategoryComponent),
      },
      {
        path:'catalogos/suppliers',
        loadComponent:()=>
          import('./modules/home/supplier/supplier').then(m=>m.SupplierComponent),
      },
      {
        path: 'admin/usuarios',
        loadComponent: () =>
          import('./modules/home/user-management/user-management')
            .then(m => m.UserManagement),
        canActivate: [authGuard], // doble protección frontend
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
