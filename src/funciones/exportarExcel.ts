import * as XLSX from 'xlsx'

/**
 * Exporta un arreglo de objetos a un archivo .xlsx y dispara la descarga
 * en el navegador. Reutilizable desde cualquier vista admin (Libro de
 * Ventas, Gastos, Insumos, etc.) para no duplicar la lógica de SheetJS.
 *
 * @param filas      Arreglo de objetos planos: cada key se vuelve columna.
 * @param nombreHoja Nombre de la hoja dentro del archivo.
 * @param nombreArchivo Nombre del archivo descargado (sin extensión).
 */
export function exportarAExcel<T extends Record<string, unknown>>(
  filas: T[],
  nombreHoja: string,
  nombreArchivo: string,
) {
  if (!filas || filas.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  const hoja = XLSX.utils.json_to_sheet(filas)

  // Autoajuste simple de ancho de columnas según el contenido
  const anchos = Object.keys(filas[0]).map((key) => {
    const largoMaximo = filas.reduce(
      (max, fila) => Math.max(max, String(fila[key] ?? '').length),
      key.length,
    )
    return { wch: Math.min(largoMaximo + 2, 40) }
  })
  hoja['!cols'] = anchos

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja)

  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`)
}
