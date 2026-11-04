# SideCity 0.9 · Bronce y cámara

## Cadena jugable

El horno requiere el primer refugio terminado, una cosecha, fogón y seis estudios completados. Construirlo reserva 12 madera y 16 piedra una sola vez; sus 42 unidades de trabajo se comparten entre adultos. Es una huella de 2 × 2 con accesos libres.

Desde Almacén → Fabricar o la interacción del horno, un adulto camina a su lado y funde una colada: 3 mineral de cobre + 1 mineral de estaño + 1 carbón → 2 bronce, 14 segundos de trabajo base. Una orden produce una colada; se puede repetir aunque queden lingotes en almacén. Coste y resultado se aplican juntos al terminar, con 18 XP de Metalurgia. Cancelar no consume nada; varios trabajadores no duplican materiales.

La primera colada abre la Edad del Bronce y el taller. El taller cuesta 24 madera, 10 piedra y 2 bronce; 48 trabajo. Permite fabricar un hacha (2 bronce + 2 madera, 11 s) y un pico (3 bronce + 2 madera, 13 s). Son herramientas comunitarias, una de cada tipo: hacha +40% tala, pico +35% minería. El taller terminado acelera fabricación/fundición un 15%. Las bonificaciones de hachas de piedra y bronce no se suman. Estos edificios no añaden camas. Hierro y plata siguen bloqueados para una era posterior.

## Eras y guardado

La mini barra abre un timeline vertical: Orígenes, Vida sedentaria, Bronce y cinco etapas futuras señaladas «En desarrollo». La primera cosecha abre Vida sedentaria; la primera colada abre Bronce. Sus cuatro objetivos son dominar la aleación, taller y las dos herramientas. El tiempo no compra progreso ni desbloquea contenido futuro al completar el 100%. Los objetivos actuales se despliegan en un detalle compacto.

Esquema 7, migración de 1–6 sin reiniciar recursos, agricultura, vínculos u órdenes. Añade bronce, dos herramientas y Metalurgia (novena habilidad). Se validan huellas, costes, progreso y herramientas únicas.

## Rendimiento

Se reprodujeron dos cuellos de botella en el renderizador anterior: repintar el terreno vectorial por cada ángulo de rotación y expulsar sprites de árboles de la LRU cuando seis variantes a densidad 6 excedían el presupuesto. El segundo provocaba regeneración dentro del mismo fotograma.

El terreno usa bloques cuadrados vistos desde arriba y una transformación ortográfica al dibujarlos. Su densidad se redondea hacia arriba según zoom físico, independiente del ángulo: la rotación no invalida esos bloques. Son de 8 × 8 parcelas, o 4 × 4 con densidad mayor que 2 para reducir memoria fuera de pantalla. La LRU conserva un conjunto visible completo antes de expulsar bloques. Hay una sola densidad de terreno y una sola generación de sprites (ángulo/densidad). El presupuesto de árboles cabe exactamente seis variantes nativas; los objetos tienen un catálogo acotado. Se conserva la nitidez sin agrandar texturas por encima de su resolución.

Medición inicial en Chrome temporal aislado, viewport 1440 × 900, tiempos CPU de dibujo, no FPS garantizados en el dispositivo del usuario: a zoom 1,8/DPR 3 la vista 7 pasó de mediana 22 ms a 3,3 ms, con seis creaciones iniciales de árboles en lugar de 93 durante diez dibujos. La comparación de rotación continua a zoom 0,46/DPR 1 pasó de mediana 36,9 ms a 9,2 ms y terreno de 27,1 ms a 0,2 ms. Estas cifras describen la primera medición del cambio; los archivos de verificación externos al proyecto guardan las siguientes. La presión de memoria/GPU del navegador influye en picos y comparaciones, especialmente con DPR alto.

79 pruebas de reglas y regresión; verificación en navegador de fundición desde UI, ocho vistas, importación y layouts 390 × 844, 360 × 640, 844 × 390 y 768 × 1024 a DPR 3. Falta medir en hardware móvil físico y Safari.
