import os
from typing import Dict, Any, List

from dotenv import load_dotenv
import requests

# Cargar variables del .env
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    # Nota: aquí devolvemos un string explícito, no lanzamos excepción
    print("⚠️ GEMINI_API_KEY no está definida en el .env")
    API_KEY = None

ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"gemini-2.5-flash:generateContent?key={API_KEY}" if API_KEY else None
)


def build_prompt(file_name: str, validation_result: Dict[str, Any]) -> str:
    overall = validation_result["overallStatus"]
    total = validation_result["total"]
    ok = validation_result["ok"]
    partial = validation_result["partial"]
    error = validation_result["error"]
    rules: List[Dict[str, Any]] = validation_result["rules"]

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
    return prompt.strip()


def ask_agent(file_name: str, validation_result: Dict[str, Any]) -> str:
    """
    Nunca lanza excepciones hacia afuera.
    Siempre devuelve algún texto, aunque sea un mensaje de error explicativo.
    """
    # Si no hay API KEY configurada
    if not API_KEY or not ENDPOINT:
        return (
            "⚠️ No se encontró la API key de Gemini en el backend. "
            "Configura GEMINI_API_KEY en el archivo .env para habilitar el agente."
        )

    prompt = build_prompt(file_name, validation_result)

    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    try:
        resp = requests.post(ENDPOINT, json=body, timeout=30)
        # Para debug:
        print("Respuesta HTTP de Gemini:", resp.status_code)
        if not resp.ok:
            print("Cuerpo de error:", resp.text)
            return (
                "⚠️ Hubo un problema al llamar al modelo de Gemini. "
                f"Código HTTP: {resp.status_code}. "
                "Revisa si la API key es válida y si el modelo gemini-2.5-flash está habilitado."
            )

        data = resp.json()

        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )

        if not text:
            return (
                "⚠️ El modelo respondió pero no devolvió texto. "
                "Revisa el prompt o los parámetros enviados."
            )

        return text

    except Exception as e:
        print("Error genérico en ask_agent:", repr(e))
        return (
            "⚠️ Ocurrió un error inesperado al llamar al agente de Gemini. "
            "Revisa la consola del backend para más detalles."
        )
