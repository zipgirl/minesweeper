# BuscaMinas — zipgirl

Una versión independiente y renovada del clásico buscaminas, reconstruida a partir del proyecto académico de 2023.

## Demo

https://zipgirl.github.io/minesweeper/

## Características

- Tres niveles: tranquila (15 × 15, 22 minas), intermedia (20 × 20, 50 minas) e intensa (25 × 25, 94 minas).
- Primera jugada segura, con protección de las casillas vecinas.
- Descubrimiento de áreas vacías mediante flood fill iterativo.
- Banderas con clic derecho o modo bandera, compatible con pantallas táctiles.
- Contador de minas, cronómetro, reinicio y estados de victoria y derrota.
- Diseño adaptable, controles accesibles y celebración animada al ganar.
- Sin dependencias de JavaScript ni proceso de compilación.

## Estructura

- `index.html`: estructura semántica y controles.
- `styles.css`: identidad visual y diseño responsive.
- `game.js`: lógica y estado del juego.
- `favicon.svg`: ícono del proyecto.

## Desarrollo local

Abrí `index.html` en un navegador o ejecutá un servidor estático desde esta carpeta:

```bash
python -m http.server 8000
```

Después visitá http://localhost:8000.

## Origen

Refactorización independiente del proyecto [BuscaMinas 2023](https://github.com/UCC-LabCompu2-Historico/proyecto2023-perez-velasquez), realizado originalmente por Agustina Perez y Mateo Velásquez Borda para Laboratorio de Computación II (2023).

La nueva versión conserva la idea central y las dificultades del juego, con una implementación moderna, simplificada y optimizada.

## Tecnologías

HTML semántico, CSS moderno y JavaScript vanilla. Publicación estática mediante GitHub Pages.
