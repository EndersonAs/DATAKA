document.getElementById('uploadForm')?.addEventListener('submit', function(e){
  e.preventDefault();
  const fileInput = document.getElementById('fileInput');
  const resultDiv = document.getElementById('result');
  if(!fileInput.files.length){
    resultDiv.innerHTML = '<div class="alert alert-warning">Por favor selecciona un archivo.</div>';
    return;
  }
  const fileName = fileInput.files[0].name;
  // Simulación de validación IA
  const cumple = Math.random() > 0.5;
  resultDiv.innerHTML = `<div class="alert ${cumple ? 'alert-success' : 'alert-danger'}">
    <strong>${cumple ? 'Cumple' : 'No cumple'}</strong> — Resultado de validación para <em>${fileName}</em>.
  </div>`;
});