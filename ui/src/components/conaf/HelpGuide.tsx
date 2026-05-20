import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Edit3, Eye, Lock, Upload, FileSpreadsheet, BarChart3,
  History, Settings, MessageSquare, Download, Trash2, ChevronDown,
  ChevronRight, HelpCircle, Zap, CheckCircle, AlertTriangle,
} from 'lucide-react';

interface Section {
  id: string;
  icon: typeof HelpCircle;
  title: string;
  color: string;
  content: { heading?: string; text: string; tip?: boolean }[];
}

const SECTIONS: Section[] = [
  {
    id: 'perfiles',
    icon: Shield,
    title: 'Perfiles de acceso',
    color: '#059669',
    content: [
      { text: 'La plataforma tiene 3 niveles de acceso. Cada uno usa un código PIN de 4 dígitos para entrar.' },
      { heading: 'Administrador', text: 'Tiene acceso completo: puede subir archivos, ver todos los datos, exportar a Excel, eliminar balances, dejar notas y cambiar la configuración de alertas.' },
      { heading: 'Editor', text: 'Puede subir archivos nuevos, ver todos los datos, exportar a Excel y dejar notas. No puede eliminar balances ni cambiar la configuración.' },
      { heading: 'Consulta', text: 'Solo puede ver los datos y las notas. No puede subir archivos, exportar ni eliminar nada. Ideal para revisión o supervisión.' },
      { text: 'Los códigos de acceso los administra el equipo de soporte. Si necesitas uno, solicítalo a tu jefatura.', tip: true },
    ],
  },
  {
    id: 'entrar',
    icon: Lock,
    title: 'Cómo entrar',
    color: '#7c3aed',
    content: [
      { text: 'Al abrir la plataforma verás una pantalla con 4 casillas. Escribe tu código PIN de 4 dígitos.' },
      { text: 'El sistema te deja entrar automáticamente al escribir el último dígito. No necesitas hacer clic en ningún botón.' },
      { text: 'Si te equivocas, las casillas se sacuden y se borran solas. Solo vuelve a escribir el código correcto.' },
      { text: 'Tu sesión se mantiene mientras no cierres la pestaña. Si cierras el navegador, tendrás que volver a ingresar tu código.', tip: true },
    ],
  },
  {
    id: 'subir',
    icon: Upload,
    title: 'Subir un archivo',
    color: '#2563eb',
    content: [
      { text: 'Ve a "Procesador" en el menú de la izquierda.' },
      { text: 'Arrastra el archivo Excel (.xls) desde tu computador hacia el recuadro punteado. También puedes hacer clic en el recuadro para buscarlo en tus carpetas.' },
      { text: 'El sistema detecta automáticamente si es un Balance Consolidado (con hojas Regional, Valdivia, etc.) o un archivo SIGFE directo.' },
      { text: 'Cuando termine de procesar, verás cuántas oficinas, programas e ítems se encontraron. Haz clic en el botón verde para ver el resultado.' },
      { text: 'Los datos se guardan automáticamente en la nube. No necesitas hacer nada más.', tip: true },
    ],
  },
  {
    id: 'resumen',
    icon: BarChart3,
    title: 'Pantalla de Resumen',
    color: '#059669',
    content: [
      { text: 'Es lo primero que ves al entrar (si ya hay datos cargados). Muestra un panorama rápido del estado presupuestario.' },
      { heading: 'Recuadros superiores', text: 'Presupuesto total, cuánto se ha gastado, cuánto queda disponible, y el porcentaje de avance general.' },
      { heading: 'Gráfico de barras', text: 'Compara el presupuesto asignado (gris) contra lo gastado (color) por cada programa.' },
      { heading: 'Tarjetas de programas', text: 'Cada programa tiene su tarjeta con una barra de progreso. Haz clic para ver más detalle.' },
      { heading: 'Alertas', text: 'A la derecha se muestran avisos cuando algún programa se pasa del presupuesto (rojo) o está cerca del límite (amarillo).' },
    ],
  },
  {
    id: 'balance',
    icon: FileSpreadsheet,
    title: 'Tabla de Balance',
    color: '#0891b2',
    content: [
      { text: 'Ve a "Balance" en el menú. Aquí está el detalle completo de cada programa.' },
      { heading: 'Pestañas de oficina', text: 'Arriba verás pestañas: Consolidado (todo junto), Regional, Valdivia, Panguipulli, Ranco. Haz clic en cada una para filtrar.' },
      { heading: 'Filtro por tipo', text: 'Los botones "Todos", "ByS" y "Viáticos" filtran por tipo de gasto.' },
      { heading: 'Colores del porcentaje', text: 'Verde = todo bien. Amarillo = se acerca al límite. Rojo = se pasó o está por pasarse.' },
      { heading: 'Fila negra al final', text: 'Es el TOTAL GENERAL que suma todos los programas visibles.' },
      { text: 'Debajo de la tabla hay un espacio para dejar notas y observaciones sobre el balance.', tip: true },
    ],
  },
  {
    id: 'exportar',
    icon: Download,
    title: 'Exportar a Excel',
    color: '#d97706',
    content: [
      { text: 'En la pantalla de Balance, haz clic en el botón "Exportar" (arriba a la derecha).' },
      { text: 'Se abre una ventana con opciones. Puedes elegir un preset rápido o personalizar los filtros.' },
      { heading: 'Presets', text: '"Completo" genera todo. "Solo alertas" muestra solo lo problemático. "Resumen ejecutivo" es para jefatura. "Por programa" crea una hoja Excel por cada programa.' },
      { heading: 'Formato de montos', text: 'Puedes elegir pesos ($), miles (M$) o millones (MM$) según lo que necesites.' },
      { text: 'El archivo se descarga directo a tu computador como .xlsx (Excel).', tip: true },
    ],
  },
  {
    id: 'historico',
    icon: History,
    title: 'Histórico',
    color: '#7c3aed',
    content: [
      { text: 'Ve a "Histórico" en el menú. Muestra cómo ha evolucionado el gasto mes a mes.' },
      { text: 'El gráfico tiene barras (presupuesto y ejecutado) y una línea azul (% de avance).' },
      { text: 'Mientras más meses subas, más útil se vuelve esta pantalla.' },
      { text: 'Si solo has subido un archivo, verás un solo punto. Sube el balance de otro mes para ver la evolución.', tip: true },
    ],
  },
  {
    id: 'analytics',
    icon: Zap,
    title: 'Analytics',
    color: '#dc2626',
    content: [
      { text: 'Ve a "Analytics" en el menú. Es un análisis más profundo del presupuesto.' },
      { heading: 'Salud Presupuestaria', text: 'Un puntaje de 0 a 100. Evalúa si el gasto va al ritmo correcto, si los programas están equilibrados, y si hay riesgo de quedarse sin plata.' },
      { heading: 'Velocidad de Gasto', text: 'Muestra cuánto se gasta por mes y si el presupuesto alcanza hasta fin de año.' },
      { heading: 'Análisis de Varianza', text: 'Compara lo que se debería haber gastado a esta fecha versus lo que realmente se gastó.' },
      { heading: 'Simulador', text: 'Mueve los controles para simular qué pasaría si un programa gasta más o menos. Útil para tomar decisiones.' },
    ],
  },
  {
    id: 'balances',
    icon: Trash2,
    title: 'Gestionar balances guardados',
    color: '#64748b',
    content: [
      { text: 'En la barra superior hay un botón que muestra el período actual (ej: "noviembre 2025"). Haz clic ahí.' },
      { text: 'Se abre un listado con todos los balances que se han subido.' },
      { text: 'Haz clic en el ojo para ver un balance distinto.' },
      { text: 'Haz clic en el tacho para eliminar uno (solo Administrador puede eliminar).' },
      { text: 'Si eliminas un balance, se borran todos sus datos asociados. Esta acción no se puede deshacer.', tip: true },
    ],
  },
  {
    id: 'notas',
    icon: MessageSquare,
    title: 'Notas y observaciones',
    color: '#059669',
    content: [
      { text: 'Debajo de la tabla de Balance hay un panel de notas.' },
      { text: 'Haz clic en "Agregar" para dejar una nota. Puedes elegir el tipo: Observación, Acción requerida, o Alerta manual.' },
      { text: 'Las notas quedan visibles para todos los que entran al sistema.' },
      { text: 'Cuando un tema se resuelve, haz clic en el check verde para marcarlo como resuelto.' },
      { text: 'Las notas resueltas se colapsan pero no se borran — quedan como registro.', tip: true },
    ],
  },
  {
    id: 'config',
    icon: Settings,
    title: 'Configuración (solo Administrador)',
    color: '#d97706',
    content: [
      { text: 'Ve a "Configuración" en el menú. Solo el perfil Administrador puede hacer cambios aquí.' },
      { text: 'Puedes ajustar los umbrales de alerta: a qué porcentaje se considera sobregirado, crítico, alto o sub-ejecutado.' },
      { text: 'Los valores por defecto son: Sobregirado 100%, Crítico 90%, Alto 80%, Sub-ejecutado 30%.' },
      { text: 'Haz clic en "Guardar umbrales" para que los cambios se apliquen a todos los usuarios.', tip: true },
    ],
  },
];

export function HelpGuide() {
  const [openSection, setOpenSection] = useState<string | null>('perfiles');

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 text-center mb-6">
        <HelpCircle className="w-10 h-10 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-extrabold text-foreground">Guía de uso</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Haz clic en cada sección para ver las instrucciones
        </p>
      </motion.div>

      {/* Accordion sections */}
      {SECTIONS.map((section, idx) => {
        const isOpen = openSection === section.id;
        const Icon = section.icon;

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="card-premium overflow-hidden"
          >
            <button
              onClick={() => setOpenSection(isOpen ? null : section.id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${section.color}12` }}>
                <Icon className="w-5 h-5" style={{ color: section.color }} />
              </div>
              <span className="flex-1 text-[14px] font-bold text-foreground">{section.title}</span>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-3 border-t border-border/50 pt-4">
                    {section.content.map((item, i) => (
                      <div key={i} className={`flex gap-3 ${item.tip ? 'px-3.5 py-2.5 rounded-xl bg-primary/[0.04] border border-primary/10' : ''}`}>
                        <div className="mt-1 shrink-0">
                          {item.tip ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-primary" />
                          ) : item.heading ? (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
                          )}
                        </div>
                        <div>
                          {item.heading && (
                            <p className="text-[12px] font-bold text-foreground mb-0.5">{item.heading}</p>
                          )}
                          <p className={`text-[12px] leading-relaxed ${item.tip ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                            {item.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
