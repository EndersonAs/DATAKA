import { useEffect, useState } from "react";
import "./App.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE = "http://127.0.0.1:8000"; // FastAPI

// Diccionario de textos ES / EN
const LABELS = {
  es: {
    appName: "Kila Validator",
    operations: "Operaciones",
    system: "Sistema",
    validateMenu: "Validación de facturas",
    historyMenu: "Historial",
    settingsMenu: "Configuración (futuro)",

    companyPill: "Demo Corporation ▾",
    pageTitle: "Validación de Facturas",
    pageSubtitle:
      "Sube una factura en JSON y valida si cumple con los requisitos mínimos exigidos por la DIAN para importación.",

    uploadProcessing: "Procesando...",
    uploadLabel: "📂 Importar factura",

    loadedFilePrefix: "Archivo cargado:",
    errorLoadingHistory: "No se pudo cargar el historial desde el servidor.",
    errorProcessingInvoice:
      "No se pudo procesar la factura. Verifica que el JSON sea válido y que el backend esté corriendo.",
    errorAgent: "No se pudo obtener la explicación del agente.",
    errorAgentNoInvoice:
      "Primero sube una factura para que el agente pueda analizarla.",

    globalStatus: "Estado global",
    totalRules: "Total requisitos",
    okRules: "Cumplen",
    partialRules: "Con observaciones",
    errorRules: "Críticos",

    globalHint: "Basado en los requisitos mínimos de la DIAN.",
    totalHint: "Requisitos evaluados en la factura.",
    okHint: "Requisitos completos.",
    partialHint: "Datos parciales o dudosos.",
    errorHint: "Campos que impedirían la nacionalización.",

    tableTitle: "Resultado por requisito",
    tableHint: "Sube una factura JSON para ver los resultados.",
    tableColId: "#",
    tableColReq: "Requisito",
    tableColStatus: "Estado",
    tableColDetail: "Detalle",

    historyTitle: "Historial de Validaciones",
    historySubtitle:
      "Registros de las facturas analizadas (guardadas en SQLite).",
    historyEmpty: "Todavía no has validado ninguna factura.",
    historyColId: "ID",
    historyColFile: "Archivo",
    historyColDate: "Fecha",
    historyColStatus: "Estado global",
    historyColSummary: "Resumen",

    agentButton: "🤖 Preguntar al agente",
    agentButtonLoading: "Llamando al agente...",
    agentTitle: "Explicación del agente",
    agentSubtitle:
      "Interpretación en lenguaje natural de los hallazgos de la validación.",

    historySummary: (ok, partial, error) =>
      `${ok} OK · ${partial} PARCIAL · ${error} ERROR`,
  },

  en: {
    appName: "Kila Validator",
    operations: "Operations",
    system: "System",
    validateMenu: "Invoice validation",
    historyMenu: "History",
    settingsMenu: "Settings (coming soon)",

    companyPill: "Demo Corporation ▾",
    pageTitle: "Invoice Validation",
    pageSubtitle:
      "Upload an invoice in JSON format and check if it meets the minimum requirements for import procedures.",

    uploadProcessing: "Processing...",
    uploadLabel: "📂 Upload invoice",

    loadedFilePrefix: "Loaded file:",
    errorLoadingHistory: "Could not load history from the server.",
    errorProcessingInvoice:
      "Could not process the invoice. Check that the JSON is valid and the backend is available.",
    errorAgent: "Could not get the agent explanation.",
    errorAgentNoInvoice: "Upload an invoice first so the agent can analyze it.",

    globalStatus: "Overall status",
    totalRules: "Total requirements",
    okRules: "Pass",
    partialRules: "With observations",
    errorRules: "Critical",

    globalHint: "Based on the minimum requirements.",
    totalHint: "Requirements evaluated in this invoice.",
    okHint: "Requirements that fully pass.",
    partialHint: "Partial / unclear data.",
    errorHint: "Fields that block import clearance.",

    tableTitle: "Result per requirement",
    tableHint: "Upload a JSON invoice to see the results.",
    tableColId: "#",
    tableColReq: "Requirement",
    tableColStatus: "Status",
    tableColDetail: "Details",

    historyTitle: "Validation history",
    historySubtitle:
      "Records of all invoices that have been analyzed (stored in SQLite).",
    historyEmpty: "You haven't validated any invoices yet.",
    historyColId: "ID",
    historyColFile: "File",
    historyColDate: "Date",
    historyColStatus: "Overall status",
    historyColSummary: "Summary",

    agentButton: "🤖 Ask the agent",
    agentButtonLoading: "Asking the agent...",
    agentTitle: "Agent explanation",
    agentSubtitle: "Natural language interpretation of the validation results.",

    historySummary: (ok, partial, error) =>
      `${ok} OK · ${partial} PARTIAL · ${error} ERROR`,
  },
};
const STATUS_TRANSLATIONS = {
  es: {
    Cumple: "Cumple",
    "No cumple": "No cumple",
    "Cumple parcialmente": "Cumple parcialmente",
  },
  en: {
    Cumple: "Pass",
    "No cumple": "Fail",
    "Cumple parcialmente": "Partially compliant",
  },
};

function App() {
  const [validation, setValidation] = useState(null); // reglas por requisito
  const [fileName, setFileName] = useState(""); // nombre del archivo subido
  const [activeView, setActiveView] = useState("validate"); // "validate" | "history"

  // métricas que vienen del backend
  const [overallStatus, setOverallStatus] = useState(null);
  const [total, setTotal] = useState(0);
  const [ok, setOk] = useState(0);
  const [partial, setPartial] = useState(0);
  const [error, setError] = useState(0);

  // historial desde FastAPI/SQLite
  const [history, setHistory] = useState([]);

  // estados de carga / error
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastInvoiceJson, setLastInvoiceJson] = useState(null);
  const [agentAnswer, setAgentAnswer] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);

  // idioma
  const [lang, setLang] = useState("es");
  const L = LABELS[lang];
  const displayOverallStatus =
    STATUS_TRANSLATIONS[lang][overallStatus] || overallStatus;

  // -------- FUNCIONES AUXILIARES --------

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (!res.ok) throw new Error("No se pudo obtener el historial");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(L.errorLoadingHistory);
    }
  };

  useEffect(() => {
    // cargar historial al abrir la app
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- MANEJO DE ARCHIVO --------

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg("");
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        setLastInvoiceJson(json);
        setAgentAnswer(""); // limpiar respuesta anterior del agente

        const res = await fetch(`${API_BASE}/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_name: file.name,
            invoice: json,
          }),
        });

        if (!res.ok) {
          throw new Error("Error al llamar al backend");
        }

        const data = await res.json();
        // data: { overallStatus, total, ok, partial, error, rules: [...] }

        setValidation(data.rules);
        setOverallStatus(data.overallStatus);
        setTotal(data.total);
        setOk(data.ok);
        setPartial(data.partial);
        setError(data.error);

        // después de validar, recargar historial desde la BD
        fetchHistory();
        setActiveView("validate");
      } catch (err) {
        console.error(err);
        setErrorMsg(L.errorProcessingInvoice);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const askAgent = async () => {
    if (!lastInvoiceJson || !fileName) {
      setErrorMsg(L.errorAgentNoInvoice);
      return;
    }

    setAgentLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/agent_explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: fileName,
          invoice: lastInvoiceJson,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al llamar al agente");
      }

      const data = await res.json();
      setAgentAnswer(data.agentAnswer || "El agente no devolvió respuesta.");
    } catch (err) {
      console.error("Error llamando al agente:", err);
      setErrorMsg(L.errorAgent);
    } finally {
      setAgentLoading(false);
    }
  };

  // -------- VISTA DE HISTORIAL --------

  const renderHistory = () => (
    <section className="history-section">
      <h1>{L.historyTitle}</h1>
      <p className="page-subtitle">{L.historySubtitle}</p>

      <div className="table-wrapper">
        <table className="result-table">
          <thead>
            <tr>
              <th>{L.historyColId}</th>
              <th>{L.historyColFile}</th>
              <th>{L.historyColDate}</th>
              <th>{L.historyColStatus}</th>
              <th>{L.historyColSummary}</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: 20 }}>
                  {L.historyEmpty}
                </td>
              </tr>
            )}

            {history.map((h) => (
              <tr key={h.id}>
                <td>{h.id}</td>
                <td>{h.file_name}</td>
                <td>{h.uploaded_at}</td>
                <td>
                  <span
                    className={
                      "status-pill " +
                      (h.status === "Cumple"
                        ? "pill-ok"
                        : h.status === "No cumple"
                        ? "pill-error"
                        : "pill-partial")
                    }
                  >
                    {STATUS_TRANSLATIONS[lang][h.status] || h.status}
                  </span>
                </td>
                <td>
                  {L.historySummary(h.ok_count, h.partial_count, h.error_count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  // -------- RENDER PRINCIPAL --------

  return (
    <div className="app-root">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-mark">K</span>
          <span className="logo-text">{L.appName}</span>
        </div>

        <div className="sidebar-section-title">{L.operations}</div>

        <div
          className={
            "sidebar-item " +
            (activeView === "validate" ? "sidebar-item-active" : "")
          }
          onClick={() => setActiveView("validate")}
          style={{ cursor: "pointer" }}
        >
          {L.validateMenu}
        </div>

        <div
          className={
            "sidebar-item " +
            (activeView === "history" ? "sidebar-item-active" : "")
          }
          onClick={() => {
            setActiveView("history");
            fetchHistory();
          }}
          style={{ cursor: "pointer" }}
        >
          {L.historyMenu}
        </div>

        <div className="sidebar-section-title">{L.system}</div>
        <div className="sidebar-item">{L.settingsMenu}</div>

        <div className="sidebar-footer">
          <div className="user-avatar">J</div>
          <div className="user-info">
            <div className="user-name">July Rodríguez</div>
            <div className="user-plan">Hackathon · Demo</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">
        {activeView === "validate" && (
          <>
            {/* TOP BAR */}
            <header className="topbar">
              <div className="topbar-left">
                <div className="company-pill">{L.companyPill}</div>
                <h1 className="page-title">{L.pageTitle}</h1>
                <p className="page-subtitle">{L.pageSubtitle}</p>
              </div>
              <div className="topbar-right">
                <div className="lang-switch">
                  <button
                    className={
                      lang === "es" ? "lang-btn lang-btn-active" : "lang-btn"
                    }
                    onClick={() => setLang("es")}
                  >
                    ES
                  </button>
                  <span className="lang-sep">|</span>
                  <button
                    className={
                      lang === "en" ? "lang-btn lang-btn-active" : "lang-btn"
                    }
                    onClick={() => setLang("en")}
                  >
                    EN
                  </button>
                </div>

                <label className="upload-button">
                  <span>{loading ? L.uploadProcessing : L.uploadLabel}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                  />
                </label>

                {validation && (
                  <button
                    className="agent-button"
                    onClick={askAgent}
                    disabled={agentLoading}
                  >
                    {agentLoading ? L.agentButtonLoading : L.agentButton}
                  </button>
                )}
              </div>
            </header>

            {/* MENSAJE DE ERROR */}
            {errorMsg && (
              <div className="file-pill" style={{ background: "#7f1d1d" }}>
                {errorMsg}
              </div>
            )}

            {/* ARCHIVO SELECCIONADO */}
            {fileName && (
              <div className="file-pill">
                {L.loadedFilePrefix} <strong>{fileName}</strong>
              </div>
            )}

            {/* CARDS */}
            {validation && (
              <section className="cards-grid">
                <div className="card">
                  <div className="card-label">{L.globalStatus}</div>
                  <div
                    className={
                      "card-value " +
                      (overallStatus === "Cumple"
                        ? "status-ok"
                        : overallStatus === "No cumple"
                        ? "status-error"
                        : "status-partial")
                    }
                  >
                    {displayOverallStatus}
                  </div>
                  <div className="card-hint">{L.globalHint}</div>
                </div>

                <div className="card">
                  <div className="card-label">{L.totalRules}</div>
                  <div className="card-value">{total}</div>
                  <div className="card-hint">{L.totalHint}</div>
                </div>

                <div className="card">
                  <div className="card-label">{L.okRules}</div>
                  <div className="card-value card-value-ok">{ok}</div>
                  <div className="card-hint">{L.okHint}</div>
                </div>

                <div className="card">
                  <div className="card-label">{L.partialRules}</div>
                  <div className="card-value card-value-warning">{partial}</div>
                  <div className="card-hint">{L.partialHint}</div>
                </div>

                <div className="card">
                  <div className="card-label">{L.errorRules}</div>
                  <div className="card-value card-value-error">{error}</div>
                  <div className="card-hint">{L.errorHint}</div>
                </div>
              </section>
            )}

            {/* TABLA DETALLE */}
            <section className="table-section">
              <div className="table-header-row">
                <h2 className="table-title">{L.tableTitle}</h2>
                {!validation && (
                  <span className="table-hint">{L.tableHint}</span>
                )}
              </div>

              {validation && (
                <div className="table-wrapper">
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>{L.tableColId}</th>
                        <th>{L.tableColReq}</th>
                        <th>{L.tableColStatus}</th>
                        <th>{L.tableColDetail}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.map((rule) => (
                        <tr key={rule.id}>
                          <td>{rule.id}</td>
                          <td>{rule.name}</td>
                          <td>
                            <span
                              className={
                                "status-pill " +
                                (rule.status === "OK"
                                  ? "pill-ok"
                                  : rule.status === "ERROR"
                                  ? "pill-error"
                                  : "pill-partial")
                              }
                            >
                              {rule.status}
                            </span>
                          </td>
                          <td>{rule.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* AGENTE */}
            {agentAnswer && (
              <section className="table-section" style={{ marginTop: 12 }}>
                <h2 className="table-title">{L.agentTitle}</h2>
                <p className="page-subtitle">{L.agentSubtitle}</p>
                <div
                  style={{ whiteSpace: "pre-wrap", fontSize: 14, marginTop: 8 }}
                >
                  {agentAnswer}
                </div>
              </section>
            )}
            {/* DASHBOARD */}
            {history.length > 0 && (
              <section className="table-section" style={{ marginTop: 32 }}>
                <h2 className="table-title">Dashboard</h2>
                <p className="page-subtitle">
                  Estadísticas basadas en el historial de facturas validadas.
                </p>

                <div style={{ width: "100%", height: 300, marginTop: 20 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={[
                        {
                          name: lang === "es" ? "Cumple" : "Pass",
                          value: history.filter((h) => h.status === "Cumple")
                            .length,
                        },
                        {
                          name: lang === "es" ? "Parcial" : "Partial",
                          value: history.filter(
                            (h) => h.status === "Cumple parcialmente"
                          ).length,
                        },
                        {
                          name: lang === "es" ? "No cumple" : "Fail",
                          value: history.filter((h) => h.status === "No cumple")
                            .length,
                        },
                      ]}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </>
        )}

        {activeView === "history" && renderHistory()}
      </div>
    </div>
  );
}

export default App;
