"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Building2 } from "lucide-react";
import { parseSigfeFile } from "@/lib/parser";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

type Status = "idle" | "reading" | "parsing" | "done" | "error";

export default function SubirPage() {
  const { setParseResult, addHistory } = useAppState();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [stats, setStats] = useState({ oficinas: 0, programas: 0, items: 0, alertas: 0 });
  const [oficinasNames, setOficinasNames] = useState<string[]>([]);
  const [error, setError] = useState("");

  const processFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setError("");

      try {
        setStatus("reading");
        const buffer = await file.arrayBuffer();

        setStatus("parsing");
        await new Promise((r) => setTimeout(r, 400));
        const result = parseSigfeFile(buffer);

        if (result.oficinas.length === 0) {
          throw new Error("No se encontraron hojas con datos de balance válidos");
        }

        setStats({
          oficinas: result.oficinas.length,
          programas: result.consolidado.programas.length,
          items: result.consolidado.totalItems,
          alertas: result.consolidado.alertas.length,
        });
        setOficinasNames(result.oficinas.map((o) => o.nombre));

        setParseResult(result);
        addHistory({
          mes: result.consolidado.periodo || new Date().toLocaleDateString("es-CL"),
          presupuesto: result.consolidado.totalPresupuesto,
          compromiso: result.consolidado.totalCompromiso,
          pctAvance: result.consolidado.pctAvanceGlobal,
        });

        setStatus("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al procesar archivo");
        setStatus("error");
      }
    },
    [setParseResult, addHistory]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const steps = [
    { key: "reading", label: "Leyendo archivo Excel" },
    { key: "parsing", label: "Parseando hojas y programas" },
  ];

  const statusOrder = ["reading", "parsing", "done"];
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subir Balance</h1>
        <p className="text-gray-500 mt-1">
          Sube el archivo .xls de Balance Presupuestario Consolidado
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
          dragOver
            ? "border-emerald-500 bg-emerald-50"
            : status === "idle"
              ? "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50"
              : "border-gray-200 bg-gray-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileInput}
          className="hidden"
        />
        {status === "idle" ? (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              Arrastra el archivo .xls aquí
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Balance Presup Consol al XX-XX-XXXX.xls
            </p>
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">{fileName}</p>
          </>
        )}
      </div>

      {/* Processing steps */}
      {status !== "idle" && (
        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
          {steps.map((step) => {
            const stepIdx = statusOrder.indexOf(step.key);
            const isDone = currentIdx > stepIdx || status === "done";
            const isActive = currentIdx === stepIdx && status !== "done" && status !== "error";

            return (
              <div key={step.key} className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    isDone ? "text-emerald-700 font-medium" : isActive ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}

          {status === "error" && (
            <div className="flex items-center gap-3 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {status === "done" && (
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.oficinas}</p>
                  <p className="text-xs text-gray-500">Oficinas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.programas}</p>
                  <p className="text-xs text-gray-500">Programas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.items}</p>
                  <p className="text-xs text-gray-500">Ítems</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.alertas}</p>
                  <p className="text-xs text-gray-500">Alertas</p>
                </div>
              </div>

              {/* Oficinas detected */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Oficinas detectadas:</p>
                <div className="flex flex-wrap gap-2">
                  {oficinasNames.map((name) => (
                    <span
                      key={name}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md border text-xs text-gray-700"
                    >
                      <Building2 className="w-3 h-3 text-emerald-500" />
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push("/balance")}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Ver Balance Generado
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
