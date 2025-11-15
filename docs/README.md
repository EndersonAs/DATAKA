# **🚀 Descripción del Proyecto**

DATAKA es un prototipo que valida automáticamente facturas digitales en formato JSON y genera un análisis inteligente utilizando IA.
Incluye:

Frontend en React + Vite
Backend en FastAPI (Python)
Agente IA (Gemini) para explicar los resultados

Permite cargar un archivo de factura y obtener su validación estructural, reglas cumplidas o fallidas, e interpretación generada por IA.



# **📦 Instalación y ejecución**
**1️⃣ Clonar el repositorio**

```
git clone https://github.com/EndersonAs/DATAKA
cd DATAKA
```

**2️⃣ Configurar el backend**

Crear y activar entorno virtual

```
cd backend
python -m venv venv
venv\Scripts\activate  # En Windows
```
Instalar dependencias

```
pip install -r requirements.txt
```

Ejecutar servidor FastAPI
```
uvicorn main:app --reload
```
El backend quedará disponible en:
```
http://127.0.0.1:8000
```

**3️⃣ Ejecutar el frontend**
```
cd ..
npm install
npm run dev
```
El frontend correrá en:
```
http://localhost:5173/
```
# **🧪 Funcionamiento básico**

1. Iniciar backend (uvicorn main:app --reload)

2. Iniciar frontend (npm run dev)

3. Abrir navegador en:
👉 http://localhost:5173/

4. Cargar un archivo JSON de factura

5. Revisar:

    * Validación de campos

    * Estado general

    * Reglas OK / parciales / error

    * Explicación generada por IA
