import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of, EMPTY } from 'rxjs';
import { CinemaListComponent } from './cinema-list/cinema-list.component';
import { CityFilterService } from './shared/citys/city-filter.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, CinemaListComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected title = 'horarios-cine';
  cities: string[] = [];
  private fileIndex = 1;
  private allCities = new Set<string>();

  constructor(private http: HttpClient, private cityFilterService: CityFilterService) {}

  ngOnInit() {
    this.fetchJsonFiles();
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
      this.fileIndex++;
      this.fetchJsonFiles(); // Recursively call for the next file
    });
  }

}
