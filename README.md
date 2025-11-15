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

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
