import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000"; // FastAPI

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

  // -------- FUNCIONES AUXILIARES --------

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (!res.ok) throw new Error("No se pudo obtener el historial");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("No se pudo cargar el historial desde el servidor.");
    }
  };

  useEffect(() => {
    // cargar historial al abrir la app
    fetchHistory();
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
        setErrorMsg(
          "No se pudo procesar la factura. Verifica que el JSON sea válido y que el backend esté corriendo."
        );
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };
  const askAgent = async () => {
    if (!lastInvoiceJson || !fileName) {
      setErrorMsg(
        "Primero sube una factura para que el agente pueda analizarla."
      );
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
      setErrorMsg("No se pudo obtener la explicación del agente.");
    } finally {
      setAgentLoading(false);
    }
  };

  // -------- VISTA DE HISTORIAL --------

  const renderHistory = () => (
    <section className="history-section">
      <h1>Historial de Validaciones</h1>
      <p className="page-subtitle">
        Registros de las facturas analizadas (guardadas en SQLite).
      </p>

      <div className="table-wrapper">
        <table className="result-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Archivo</th>
              <th>Fecha</th>
              <th>Estado global</th>
              <th>Resumen</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: 20 }}>
                  Todavía no has validado ninguna factura.
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
                    {h.status}
                  </span>
                </td>
                <td>
                  {h.ok_count} OK · {h.partial_count} PARCIAL · {h.error_count}{" "}
                  ERROR
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
          <span className="logo-text">Kila Validator</span>
        </div>

        <div className="sidebar-section-title">Operaciones</div>

        <div
          className={
            "sidebar-item " +
            (activeView === "validate" ? "sidebar-item-active" : "")
          }
          onClick={() => setActiveView("validate")}
          style={{ cursor: "pointer" }}
        >
          Validación de facturas
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
          Historial
        </div>

        <div className="sidebar-section-title">Sistema</div>
        <div className="sidebar-item">Configuración (futuro)</div>

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
                <div className="company-pill">Demo Corporation ▾</div>
                <h1 className="page-title">Validación de Facturas</h1>
                <p className="page-subtitle">
                  Sube una factura en JSON y valida si cumple con los requisitos
                  mínimos exigidos por la DIAN para importación.
                </p>
              </div>
              <div className="topbar-right">
                <label className="upload-button">
                  <span>
                    {loading ? "Procesando..." : "📂 Importar factura"}
                  </span>
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
                    {agentLoading
                      ? "Llamando al agente..."
                      : "🤖 Preguntar al agente"}
                  </button>
                )}
              </div>
            </header>

            {/* MENSAJE DE ERROR */}
            {errorMsg && (
              <div className="file-pill" style={{ background: "#7f1d1d" }}>
                {errorMsg}
                <div className="topbar-right">
                  <label className="upload-button">
                    <span>
                      {loading ? "Procesando..." : "📂 Importar factura"}
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* ARCHIVO SELECCIONADO */}
            {fileName && (
              <div className="file-pill">
                Archivo cargado: <strong>{fileName}</strong>
              </div>
            )}

            {/* CARDS */}
            {validation && (
              <section className="cards-grid">
                <div className="card">
                  <div className="card-label">Estado global</div>
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
                    {overallStatus}
                  </div>
                  <div className="card-hint">
                    Basado en los requisitos mínimos de la DIAN.
                  </div>
                </div>

                <div className="card">
                  <div className="card-label">Total requisitos</div>
                  <div className="card-value">{total}</div>
                  <div className="card-hint">
                    Requisitos evaluados en la factura.
                  </div>
                </div>

                <div className="card">
                  <div className="card-label">Cumplen</div>
                  <div className="card-value card-value-ok">{ok}</div>
                  <div className="card-hint">Requisitos completos.</div>
                </div>

                <div className="card">
                  <div className="card-label">Con observaciones</div>
                  <div className="card-value card-value-warning">{partial}</div>
                  <div className="card-hint">Datos parciales o dudosos.</div>
                </div>

                <div className="card">
                  <div className="card-label">Críticos</div>
                  <div className="card-value card-value-error">{error}</div>
                  <div className="card-hint">
                    Campos que impedirían la nacionalización.
                  </div>
                </div>
              </section>
            )}

            {/* TABLA DETALLE */}
            <section className="table-section">
              <div className="table-header-row">
                <h2 className="table-title">Resultado por requisito</h2>
                {!validation && (
                  <span className="table-hint">
                    Sube una factura JSON para ver los resultados.
                  </span>
                )}
              </div>

              {validation && (
                <div className="table-wrapper">
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Requisito</th>
                        <th>Estado</th>
                        <th>Detalle</th>
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
            {agentAnswer && (
              <section className="table-section" style={{ marginTop: 12 }}>
                <h2 className="table-title">Explicación del agente</h2>
                <p className="page-subtitle">
                  Interpretación en lenguaje natural de los hallazgos de la
                  validación.
                </p>
                <div
                  style={{ whiteSpace: "pre-wrap", fontSize: 14, marginTop: 8 }}
                >
                  {agentAnswer}
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
