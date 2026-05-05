import { Routes } from '@angular/router';

//import { AssetRegistration } from './modules/home/asset-registration/asset-registration';
import { MarcaRegistration } from './modules/home/marca-registration/marca-registration';
import { InvoiceRegistration } from './modules/home/invoice-registration/invoice-registration';

export const routes: Routes = [
  { path: 'marca', component: MarcaRegistration },
  { path: 'factura', component: InvoiceRegistration } 
];