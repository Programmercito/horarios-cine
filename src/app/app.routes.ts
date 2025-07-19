import { Routes } from '@angular/router';
import { CityListComponent } from './city-list/city-list.component';
import { CinemaListComponent } from './cinema-list/cinema-list.component';
import { ScheduleListComponent } from './schedule-list/schedule-list.component';

export const routes: Routes = [
    { path: '', component: CityListComponent },
    { path: 'cinemas/:city', component: CinemaListComponent },
    { path: 'schedule/:city/:cinemaName', component: ScheduleListComponent }
];