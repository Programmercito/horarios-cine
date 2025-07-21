import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CineData, Ciudad, Pelicula } from '../shared/models';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule-list.component.html',
  styleUrls: ['./schedule-list.component.css']
})
export class ScheduleListComponent implements OnInit {
  city: string = '';
  cinemid: string = '';
  cinemaName: string = '';
  cinemaData: CineData | null = null;
  pelidata: Pelicula[] = [];
  ciudadesFiltradas: Ciudad[] = [];
  constructor(private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.city = params.get('city') || '';
      this.cinemid = params.get('id') || '';
      this.fetchcinema(this.cinemid, this.city);
    });
  }
  fetchcinema(cinemid: string, city: string) {
    // Check localStorage first
    const storedData = localStorage.getItem('cine_' + cinemid);
    if (storedData) {
      try {
        const data = JSON.parse(atob(storedData));
        this.processCinemaData(data);
      } catch (error) {
        console.error('Error parsing stored cinema data:', error);
        this.fetchAllRemoteCinemas(cinemid);
      }
    } else {
      this.fetchAllRemoteCinemas(cinemid);
    }
  }

  private fetchAllRemoteCinemas(targetCinemId: string) {
    let fileIndex = 1;
    const fetchRemote = () => {
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
          // Store in localStorage
          localStorage.setItem('cine_' + fileIndex, btoa(JSON.stringify(data)));
          
          // If this is the cinema we need, process it
          if (fileIndex.toString() === targetCinemId) {
            this.processCinemaData(data);
          }
          
          fileIndex++;
          fetchRemote();
        }
      });
    };
    fetchRemote();
  }

  private processCinemaData(data: any) {
    this.cinemaData = data;
    this.cinemaName = data?.cine || 'Cinema';
    this.fetchMovieData();
  }
  fetchMovieData() {
    // Check localStorage first
    const storedPeliculas = localStorage.getItem('peliculas');
    if (storedPeliculas) {
      try {
        const data = JSON.parse(atob(storedPeliculas));
        this.processPeliculasData(data);
      } catch (error) {
        console.error('Error parsing stored peliculas data:', error);
        this.fetchRemotePeliculas();
      }
    } else {
      this.fetchRemotePeliculas();
    }
  }

  private fetchRemotePeliculas() {
    this.http.get<any>(`/peliculas.json`).pipe(
      catchError(error => {
        console.error(`Error fetching /peliculas.json:`, error);
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        this.processPeliculasData(data);
        localStorage.setItem('peliculas', btoa(JSON.stringify(data)));
      }
    });
  }

  private processPeliculasData(data: any) {
    this.pelidata = data || [];
    this.makeSchedule();
  }
  makeSchedule() {
    if (this.cinemaData && this.pelidata.length > 0) {
      let ciudades = this.cinemaData.ciudades;

      ciudades.forEach(ciudad => {
        if (ciudad.ciudad.toLowerCase().startsWith(this.city.toLowerCase())) {
          // remuevo la ciudad de this.cinemaData.ciudades
          this.ciudadesFiltradas.push(ciudad);
        }
      });
      this.ciudadesFiltradas.forEach(ciudad => {
        ciudad.peliculas.forEach(pelicula=>{
          // busco la pelicula en this.pelidata
          let data = this.pelidata.find(p => p.id === pelicula.id);
          if (data) {
            pelicula.datos = data;
          }else{
            console.warn(`Pelicula con id ${pelicula.id} no encontrada en pelidata`);
          }
        });
      });
      console.log(this.ciudadesFiltradas);

    }
  }

  goBack() {
    this.router.navigate(['/cinemas', this.city]);
  }
}
