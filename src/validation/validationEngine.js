// 1. Función para convertir tu JSON (Fields + Table) en algo manejable
function normalizeInvoice(raw) {
  // raw.Fields es un arreglo de { Fields: "NombreCampo", Value: "Valor" }
  const map = {};
  if (Array.isArray(raw.Fields)) {
    raw.Fields.forEach((f) => {
      if (f.Fields) {
        map[f.Fields] = f.Value;
      }
    });
  }

  // raw.Table es la tabla de ítems
  const items = Array.isArray(raw.Table) ? raw.Table : [];

  return { map, items };
}

// 2. Validador principal
export function validateInvoice(rawInvoice) {
  const { map, items } = normalizeInvoice(rawInvoice);
  const results = [];

  // 1 — Número de factura
  const invoiceNumber = map.InvoiceNumber;
  results.push({
    id: 1,
    name: "Número de factura",
    status: invoiceNumber ? "OK" : "ERROR",
    message: invoiceNumber
      ? `Número de factura: ${invoiceNumber}.`
      : "La factura no tiene número (InvoiceNumber).",
  });

  // 2 — Fecha de emisión
  const invoiceDate = map.InvoiceDate;
  results.push({
    id: 2,
    name: "Fecha de emisión",
    status: invoiceDate ? "OK" : "ERROR",
    message: invoiceDate
      ? `Fecha de emisión: ${invoiceDate}.`
      : "La factura no tiene fecha de emisión (InvoiceDate).",
  });

  // 3 — Lugar de emisión (aproximamos con CountryOfOrigin o PortOfLoading)
  const place =
    map.OriginCountryAddress || map.CountryOfOrigin || map.PortOfLoading;
  results.push({
    id: 3,
    name: "Lugar de emisión",
    status: place ? "OK" : "ERROR",
    message: place
      ? `Lugar de emisión/origen: ${place}.`
      : "No se encuentra un lugar de emisión u origen (CountryOfOrigin / OriginCountryAddress / PortOfLoading).",
  });

  // 4 — Datos del vendedor (Supplier + SupplierAddress)
  const supplier = map.Supplier;
  const supplierAddress = map.SupplierAddress;
  let sellerStatus = "ERROR";
  if (supplier && supplierAddress) sellerStatus = "OK";
  else if (supplier || supplierAddress) sellerStatus = "PARTIAL";

  results.push({
    id: 4,
    name: "Datos del vendedor",
    status: sellerStatus,
    message:
      supplier || supplierAddress
        ? `Vendedor: ${supplier || "sin nombre"} / Dirección: ${
            supplierAddress || "sin dirección"
          }.`
        : "No hay datos del vendedor (Supplier / SupplierAddress).",
  });

  // 5 — Datos del comprador (Customer + CustomerAddress)
  const customer = map.Customer;
  const customerAddress = map.CustomerAddress;
  let buyerStatus = "ERROR";
  if (customer && customerAddress) buyerStatus = "OK";
  else if (customer || customerAddress) buyerStatus = "PARTIAL";

  results.push({
    id: 5,
    name: "Datos del comprador",
    status: buyerStatus,
    message:
      customer || customerAddress
        ? `Comprador: ${customer || "sin nombre"} / Dirección: ${
            customerAddress || "sin dirección"
          }.`
        : "No hay datos del comprador (Customer / CustomerAddress).",
  });

  // 6 — Descripción de mercancías (Description en la tabla)
  const hasDescription = items.length > 0 && items[0].Description;
  results.push({
    id: 6,
    name: "Descripción de mercancías",
    status: hasDescription ? "OK" : "ERROR",
    message: hasDescription
      ? "La tabla incluye descripciones de mercancía (Description)."
      : "No hay descripción de mercancías en la tabla (Description).",
  });

  // 7 — Cantidades (Quantity en la tabla)
  const hasQuantity = items.length > 0 && items[0].Quantity;
  results.push({
    id: 7,
    name: "Cantidades",
    status: hasQuantity ? "OK" : "ERROR",
    message: hasQuantity
      ? "La tabla incluye cantidades (Quantity)."
      : "No hay cantidades en la tabla (Quantity).",
  });

  // 8 — Valores unitarios y totales (UnitPrice / NetValuePerItem / TotalInvoiceValue)
  const hasUnitPrice =
    items.length > 0 && (items[0].UnitPrice || items[0].NetValuePerItem);
  const hasTotalInvoice = map.TotalInvoiceValue;
  let pricesStatus = "ERROR";
  if (hasUnitPrice && hasTotalInvoice) pricesStatus = "OK";
  else if (hasUnitPrice || hasTotalInvoice) pricesStatus = "PARTIAL";

  results.push({
    id: 8,
    name: "Valores unitarios y totales",
    status: pricesStatus,
    message:
      hasUnitPrice || hasTotalInvoice
        ? "La factura tiene algunos valores de precios y totales (UnitPrice / NetValuePerItem / TotalInvoiceValue)."
        : "No se encuentran valores unitarios ni totales claros.",
  });

  // 9 — Moneda (Currency en Fields o en la tabla)
  const currency = map.Currency || (items.length > 0 && items[0].Currency);
  results.push({
    id: 9,
    name: "Moneda",
    status: currency ? "OK" : "ERROR",
    message: currency
      ? `Moneda: ${currency}.`
      : "No se encuentra la moneda (Currency).",
  });

  // 10 — Incoterm
  const incoterm = map.Incoterm;
  results.push({
    id: 10,
    name: "Incoterm",
    status: incoterm ? "OK" : "ERROR",
    message: incoterm
      ? `Incoterm: ${incoterm}.`
      : "Falta el incoterm (Incoterm).",
  });

  // 11 — Forma de pago (PaymentTerms)
  const paymentTerms = map.PaymentTerms;
  results.push({
    id: 11,
    name: "Forma de pago",
    status: paymentTerms ? "OK" : "ERROR",
    message: paymentTerms
      ? `Condiciones de pago: ${paymentTerms}.`
      : "No se encuentra la forma de pago (PaymentTerms).",
  });

  return results;
}
