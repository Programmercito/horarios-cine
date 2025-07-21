# Cinema Bo - Horarios de Cine 🎬

Cinema Bo es una aplicación web moderna desarrollada en Angular que permite consultar horarios de películas en diferentes cines de Bolivia. La aplicación ofrece una interfaz elegante y responsive para navegar por ciudades, cines y horarios de películas.

## Características

- 🏙️ **Navegación por ciudades**: Explora diferentes ciudades de Bolivia
- 🎭 **Lista de cines**: Visualiza todos los cines disponibles en cada ciudad
- 📅 **Horarios actualizados**: Consulta horarios de películas en tiempo real
- 🎥 **Información de películas**: Detalles completos con pósters, sinopsis y trailers
- 📱 **Diseño responsive**: Optimizado para dispositivos móviles y desktop
- 💾 **Cache inteligente**: Sistema de caché que verifica fechas automáticamente
- 🌙 **Interfaz moderna**: Diseño con gradientes y efectos visuales atractivos

## Tecnologías utilizadas

- **Angular 20.0.5** - Framework principal
- **TypeScript** - Lenguaje de programación
- **CSS3** - Estilos con gradientes y animaciones
- **LocalStorage** - Sistema de caché local
- **HTTP Client** - Comunicación con APIs

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Estructura del proyecto

```
src/
├── app/
│   ├── cinema-list/          # Componente de lista de cines
│   ├── city-list/           # Componente de lista de ciudades
│   ├── schedule-list/       # Componente de horarios
│   └── shared/
│       ├── models/          # Interfaces y tipos TypeScript
│       └── citys/           # Servicios compartidos
├── assets/                  # Recursos estáticos
└── styles.css              # Estilos globales
```

## Funcionalidades principales

### Cache inteligente
La aplicación implementa un sistema de caché que:
- Verifica automáticamente si los datos almacenados son del día actual
- Recarga datos desde el servidor solo cuando es necesario
- Optimiza el rendimiento y reduce el uso de datos

### Navegación fluida
- Lista de ciudades con búsqueda y filtrado
- Navegación entre cines de cada ciudad
- Visualización de horarios con información detallada de películas

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2025 Cinema Bo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
