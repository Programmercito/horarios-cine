import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CityFilterService } from '../shared/citys/city-filter.service';
import { catchError, EMPTY } from 'rxjs';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-city-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './city-list.component.html',
  styleUrl: './city-list.component.css'
})
export class CityListComponent implements OnInit {
  cities: string[] = [];
  private fileIndex = 1;
  private allCities = new Set<string>();

  constructor(private http: HttpClient, private cityFilterService: CityFilterService, private router: Router) { }

  ngOnInit() {
    this.fetchJsonFiles();
    this.loadPeliculasData();
  }

  private fetchJsonFiles() {
    this.http.get<any>(`/${this.fileIndex}.json`).pipe(
      catchError(error => {
        if (error.status === 404) {
          console.warn(`File /${this.fileIndex}.json not found (404). Stopping.`);
          this.cities = this.cityFilterService.filterCities(Array.from(this.allCities)); // Finalize and filter cities list
          return EMPTY; // Complete the observable, stopping further emissions
        }
        console.error(`Error fetching /${this.fileIndex}.json:`, error);
        this.cities = Array.from(this.allCities); // Finalize cities list on other errors too
        return EMPTY; // Stop on other errors as well
      })
    ).subscribe(data => {
      if (data && data.ciudades) {
        data.ciudades.forEach((cityData: any) => {
          this.allCities.add(cityData.ciudad);
        });
      }
      localStorage.setItem('cine_' + this.fileIndex, btoa(JSON.stringify(data)));
      this.fileIndex++;
      this.fetchJsonFiles(); // Recursively call for the next file
    });
  }
  loadPeliculasData() {
    this.http.get<any>('/peliculas.json').pipe(
      catchError(error => {
        console.error('Error fetching peliculas.json:', error);
        return EMPTY;
      })
    ).subscribe(data => {
      if (data) {
        localStorage.setItem('peliculas', btoa(JSON.stringify(data)));
      }
    });
  }
  goToCinemas(city: string) {
    this.router.navigate(['/cinemas', city]);
  }
}
