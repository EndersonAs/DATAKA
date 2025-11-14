from datetime import datetime
from typing import Any, Dict

from fastapi import FastAPI
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware  # 👈 IMPORTANTE

from db import init_db, insert_history, get_history
from validation import validate_invoice
from agent import ask_agent
from fastapi import HTTPException




app = FastAPI(title="Kila Invoice Validator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # 👈 Acepta peticiones desde cualquier origen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.on_event("startup")
def startup():
    init_db()


class InvoicePayload(BaseModel):
    file_name: str
    invoice: Dict[str, Any]


@app.post("/validate")
def validate(payload: InvoicePayload):
    result = validate_invoice(payload.invoice)

    insert_history(
        payload.file_name,
        datetime.now().isoformat(" ", "seconds"),
        result["overallStatus"],
        result["total"],
        result["ok"],
        result["partial"],
        result["error"],
    )

    return result

@app.post("/agent_explain")
def agent_explain(payload: InvoicePayload):
    """
    Recibe el mismo cuerpo que /validate, pero además
    devuelve una explicación generada por el agente.
    """
    try:
        validation_result = validate_invoice(payload.invoice)
        explanation = ask_agent(payload.file_name, validation_result)

        # Opcional: aquí podrías guardar también la explicación en BD si quieres

        return {
            "fileName": payload.file_name,
            "overallStatus": validation_result["overallStatus"],
            "total": validation_result["total"],
            "ok": validation_result["ok"],
            "partial": validation_result["partial"],
            "error": validation_result["error"],
            "rules": validation_result["rules"],
            "agentAnswer": explanation,
        }
    except Exception as e:
        print("Error en agent_explain:", e)
        raise HTTPException(status_code=500, detail="Error al generar explicación del agente")
    
@app.get("/history")
def history():
    return get_history()
