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
    Igual que /validate, pero además llama al agente para generar una explicación.
    NUNCA lanza 500: si algo sale mal con Gemini, devuelve un mensaje de error en agentAnswer.
    """
    validation_result = validate_invoice(payload.invoice)
    explanation = ask_agent(payload.file_name, validation_result)

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
    
@app.get("/history")
def history():
    return get_history()
