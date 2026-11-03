# Almacén, herramientas y extracción · 0.4

El catálogo único de src/items.js separa Materiales, Alimentos, Herramientas y Saber. Cada objeto tiene identidad, cantidad, origen y uso. El almacén no suma unidades incompatibles en un total artificial. Los contadores superiores abren su categoría y el botón Almacén abre todas las existencias.

## Producción

- Hacha de piedra: 2 madera + 1 piedra, 7 segundos base. Una herramienta común con +15% de eficiencia al talar.
- Pico de piedra: 3 madera + 2 piedra, 9 segundos base. Una herramienta común que abre la extracción de piedra, carbón, mineral de cobre y mineral de estaño.
- Se elige el constructor; asignar fabricación sustituye su orden actual, explicado antes del botón. Consume insumos al terminar, tras validar todo; cancelar no gasta recursos. Los tres comparten cada herramienta. Las órdenes simultáneas no producen duplicados ni XP extra.
- Fabricar usa Construcción y da 25 XP al terminar. La obra del refugio mantiene su reserva independiente de 20 madera.

## Extracción y comida

Minería es la séptima habilidad, con niveles 1–20 y experiencia independiente. El trabajo base dura 7 segundos, extrae hasta 2 unidades y da 12 XP por ciclo completado. Solo se buscan vetas abiertas y alcanzables. Se trabaja desde una casilla contigua seca. Varias personas comparten la reserva real: no se duplica producción cuando se agota una veta. La roca desaparece y deja pasar al agotarse; su estado se guarda. Hierro y plata requieren tecnologías posteriores. Carbón y minerales de cobre/estaño se almacenan como materias primas; la fundición aún no existe.

Comer es cuidado sin XP: gasta una comida (+25 energía), o una baya si no hay comidas (+10). No se ha introducido hambre ni muerte por necesidades. Cocinar sigue gastando una baya y una madera por comida.

## UI y partidas

Una sola ficha lateral o inferior se muestra a la vez: almacén o habitante. Existencias separa filtros y detalle del recurso; Fabricar separa recetas, costes y constructor. Las tareas del colono se dividen en Trabajar, Construir, Fabricar y Cuidarse. El mapa sigue ocupando toda la pantalla, sin bandas blancas. Los símbolos de materiales y herramientas son dibujos SVG originales en src/item-icons.js.

Ayuda → Mundo y semilla ofrece descargar una partida JSON o abrir un archivo. Primero se valida y muestra su semilla, tiempo y sectores; solo Continuar esta partida la aplica. El guardado automático de la sesión anterior se suspende antes de navegar para no sobrescribir la importación. Las partidas son locales a cada navegador/origen; no hay sincronización automática entre dispositivos. Esquema 4, migración desde 1–3 sin perder existencias y oficios.

## Verificación

42 pruebas automatizadas. Prueba de navegador en perfil temporal aislado: importación y recarga, filtros y usos, fabricación de pico con coste exacto, rechazo de duplicados, comer y paneles a 390 × 844, 844 × 390 y 768 × 1024; sin errores JavaScript. Inspección del HUD a 1440/768/390 con 0 FAIL y 0 WARN. Safari/iPhone físico pendiente.
