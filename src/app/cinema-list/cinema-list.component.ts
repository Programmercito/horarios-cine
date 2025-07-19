import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, forkJoin, map, of } from 'rxjs';
import { Cinema } from '../shared/models';

@Component({
  selector: 'app-cinema-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cinema-list.component.html',
  styleUrl: './cinema-list.component.css'
})
export class CinemaListComponent implements OnInit {
  cinemas: Cinema[] = [];
  
  selectedCity: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.selectedCity = params.get('city');
      if (this.selectedCity) {
        this.fetchCinemas(this.selectedCity);
      }
    });
  }

  private fetchCinemas(city: string) {
    let fileIndex = 1;

    const fetchFile = () => {
      this.http.get<any>(`/${fileIndex}.json`).pipe(
        catchError(error => {
          if (error.status === 404) {
            return EMPTY; // Stop fetching on 404
          }
          console.error(`Error fetching /${fileIndex}.json:`, error);
          return of(null); // Continue with null on other errors
        })
      ).subscribe(data => {
        if (data) {
          if (data.ciudades) {
            let cinemaname=data.cine || 'Unknown Cinema';
            console.log("cinemaname ", cinemaname);
            data.ciudades.map((cityData: any) => {
              if (cityData.ciudad.toLowerCase().startsWith(city.toLowerCase())) {
                let cinema: Cinema = {
                  id: fileIndex,
                  name: cinemaname,
                  image: fileIndex + '.png'
                };
                // Verificar si ya existe un cinema con el mismo name para evitar duplicados
                const existingCinema = this.cinemas.find(c => c.name === cinema.name);
                if (!existingCinema) {
                  this.cinemas.push(cinema);
                }
              }
            });
          }
          fileIndex++;
          fetchFile(); // Recursively call for the next file
        }
      });
    };

    fetchFile(); // Iniciar la ejecución
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
