export interface PeliculaExtras {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface Pelicula {
  id: string;
  titulo: string;
  video: string;
  extras: PeliculaExtras | null;
  fecha: string;
}
