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
      // Check localStorage first
      let storedData: string | null = null;
      storedData = localStorage.getItem('cine_' + fileIndex);
      if (storedData) {
        do {
          try {
            const data = JSON.parse(atob(storedData));
            this.processCinemaData(data, fileIndex, city);
            fileIndex++;
            storedData = localStorage.getItem('cine_' + fileIndex);

          } catch (error) {
            console.error('Error parsing stored data:', error);
          }
        } while (storedData);
      } else {
        this.fetchRemoteCinemas(city);
      }
    };

    fetchFile();
  }
  private fetchRemoteCinemas(city: string) {
    let fileIndex = 1;
    const fetchremote = () => {
      this.http.get<any>(`/${fileIndex}.json`).pipe(
        catchError(error => {
          if (error.status === 404) {
            return EMPTY; // Stop fetching on 404
          }
          console.error(`Error fetching /${fileIndex}.json:`, error);
          return of(null);
        })
      ).subscribe(data => {
        if (data) {
          this.processCinemaData(data, fileIndex, city);
          localStorage.setItem('cine_' + fileIndex, btoa(JSON.stringify(data)));
          fileIndex++;
          fetchremote();
        }
      });
    }
    fetchremote();
    this.loadPeliculasData();     
  }
  private processCinemaData(data: any, fileIndex: number, city: string) {
    if (data && data.ciudades) {
      let cinemaname = data.cine || 'Unknown Cinema';
      console.log("cinemaname ", cinemaname);
      data.ciudades.map((cityData: any) => {
        if (cityData.ciudad.toLowerCase().startsWith(city.toLowerCase())) {
          let cinema: Cinema = {
            id: fileIndex,
            name: cinemaname,
            image: fileIndex + '.png'
          };
          const existingCinema = this.cinemas.find(c => c.name === cinema.name);
          if (!existingCinema) {
            this.cinemas.push(cinema);
          }
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/']);
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
}
