import { useState } from "react";
import { validateInvoice } from "./validation/validationEngine";
import "./App.css";

function App() {
  const [validation, setValidation] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        const results = validateInvoice(json);
        setValidation(results);
      } catch (error) {
        alert("El archivo no es un JSON válido");
      }
    };
    reader.readAsText(file);
  };

  // Cálculo de métricas
  const total = validation ? validation.length : 0;
  const ok = validation ? validation.filter((r) => r.status === "OK").length : 0;
  const partial = validation
    ? validation.filter((r) => r.status === "PARTIAL").length
    : 0;
  const error = validation ? validation.filter((r) => r.status === "ERROR").length : 0;

  let overallStatus = null;
  if (validation) {
    if (error > 0) overallStatus = "No cumple";
    else if (partial > 0) overallStatus = "Cumple parcialmente";
    else overallStatus = "Cumple";
  }

  return (
    <div className="app-root">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-mark">K</span>
          <span className="logo-text">Kila Validator</span>
        </div>

        <div className="sidebar-section-title">Operaciones</div>
        <div className="sidebar-item sidebar-item-active">Validación de facturas</div>
        <div className="sidebar-item">Historial (futuro)</div>

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
        {/* TOP BAR */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="company-pill">Demo Corporation ▾</div>
            <h1 className="page-title">Validación de Facturas</h1>
            <p className="page-subtitle">
              Sube una factura en JSON y valida si cumple con los requisitos mínimos
              exigidos por la DIAN para importación.
            </p>
          </div>
          <div className="topbar-right">
            <label className="upload-button">
              <span>📂 Importar factura</span>
              <input type="file" accept=".json" onChange={handleFileChange} />
            </label>
          </div>
        </header>

        {/* FILE INFO */}
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
                Basado en los 11 requisitos mínimos de la DIAN.
              </div>
            </div>

            <div className="card">
              <div className="card-label">Total requisitos</div>
              <div className="card-value">{total}</div>
              <div className="card-hint">Requisitos evaluados en la factura.</div>
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
              <div className="card-hint">Impedirían la nacionalización.</div>
            </div>
          </section>
        )}

        {/* TABLE */}
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
      </div>
    </div>
  );
}

export default App;
