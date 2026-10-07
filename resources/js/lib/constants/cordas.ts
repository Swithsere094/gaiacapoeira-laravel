// IDs deben coincidir exactamente con los nombres de archivo en public/Cuerda x cuerda/
// `group` clasifica la corda para la página /politica/cordas (secciones
// Estagiários / Mirins / Alunos / Avançados / Formados / Mestres, en ese
// orden — títulos en portugués como en el PDF original de graduaciones) — es
// la única fuente de verdad, no duplicar esta clasificación en otro lado.
export const CORDAS = [
  { id: "batizado",           label: "Batizado",           group: "alumno" },
  { id: "Mirim1",             label: "Mirim 1",            group: "mirim" },
  { id: "Mirim2",             label: "Mirim 2",            group: "mirim" },
  { id: "Mirim3",             label: "Mirim 3",            group: "mirim" },
  { id: "Mirim4",             label: "Mirim 4",            group: "mirim" },
  { id: "Mirim5",             label: "Mirim 5",            group: "mirim" },
  { id: "mirim6",             label: "Mirim 6",            group: "mirim" },
  { id: "Mirim7",             label: "Mirim 7",            group: "mirim" },
  { id: "aluno_iniciante_1",  label: "Aluno Iniciante 1",  group: "alumno" },
  { id: "aluno_iniciante_2",  label: "Aluno Iniciante 2",  group: "alumno" },
  { id: "aluno_confirmado_1", label: "Aluno Confirmado 1", group: "alumno" },
  { id: "aluno_confirmado_2", label: "Aluno Confirmado 2", group: "alumno" },
  { id: "graduado",           label: "Graduado",           group: "avanzado" },
  { id: "monitor_1",          label: "Monitor 1",          group: "avanzado" },
  { id: "Monitor_2",          label: "Monitor 2",          group: "avanzado" },
  { id: "instruror_1",        label: "Instrutor 1",        group: "avanzado" },
  { id: "instrutor_2",        label: "Instrutor 2",        group: "avanzado" },
  { id: "professor_1",        label: "Professor 1",        group: "formado" },
  { id: "professor_2",        label: "Professor 2",        group: "formado" },
  { id: "contramestre_1",     label: "Contramestre 1",     group: "formado" },
  { id: "contramestre_2",     label: "Contramestre 2",     group: "formado" },
  { id: "mestre",             label: "Mestre",             group: "maestros" },
  { id: "grao_mestre",        label: "Grão-Mestre",        group: "maestros" },
  { id: "estagiario",         label: "Estagiário",         group: "estagiario" },
] as const

export type CordaId = typeof CORDAS[number]["id"]
export type CordaGroup = typeof CORDAS[number]["group"]

export function getCordaSrc(id: string | null | undefined): string | null {
  if (!id) return null
  return `/Cuerda x cuerda/${id}.png`
}
