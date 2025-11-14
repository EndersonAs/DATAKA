import os
from typing import Dict, Any, List

from dotenv import load_dotenv
import google.generativeai as genai

# Cargar variables del .env
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY no está definida en el .env")

genai.configure(api_key=api_key)

# Puedes usar un modelo rápido (ajusta si en la guía dicen otro nombre)
MODEL_NAME = "gemini-1.5-flash"


def build_prompt(file_name: str, validation_result: Dict[str, Any]) -> str:
    """
    Construye el prompt para el agente a partir de las reglas de validación.
    """
    overall = validation_result["overallStatus"]
    total = validation_result["total"]
    ok = validation_result["ok"]
    partial = validation_result["partial"]
    error = validation_result["error"]
    rules: List[Dict[str, Any]] = validation_result["rules"]

    # Armamos un resumen de reglas
    lines = []
    for r in rules:
        lines.append(f"- {r['name']} => {r['status']}: {r['message']}")

    rules_text = "\n".join(lines)

    prompt = f"""
Eres un experto en comercio exterior y validación de facturas de importación para Colombia.
Te paso el resultado de la validación automática de una factura.

Nombre del archivo: {file_name}

Resumen:
- Estado global: {overall}
- Total requisitos: {total}
- OK: {ok}
- PARCIAL: {partial}
- ERROR: {error}

Detalle por requisito:
{rules_text}

Por favor, responde en español claro y en máximo 3 bloques:

1. Resumen general (¿la factura cumple, cumple parcialmente o no cumple?).
2. Lista de los problemas más críticos (los que tienen estado ERROR) explicando por qué son graves.
3. Recomendaciones concretas para corregir la factura o qué información debería pedirle al proveedor.

No repitas el JSON, solo interpreta y explica para un usuario de negocio (operador de embarques).
"""
    return prompt


def ask_agent(file_name: str, validation_result: Dict[str, Any]) -> str:
    """
    Llama al modelo de Google para generar la explicación.
    """
    prompt = build_prompt(file_name, validation_result)
    model = genai.GenerativeModel(MODEL_NAME)
    response = model.generate_content(prompt)
    # response.text trae el texto plano
    return response.text
