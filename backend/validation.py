def normalize_invoice(raw):
    fields_map = {}
    for item in raw.get("Fields", []):
        fields_map[item.get("Fields")] = item.get("Value")

    items = raw.get("Table", [])
    return fields_map, items


def validate_invoice(raw_invoice):
    fields_map, items = normalize_invoice(raw_invoice)
    results = []

    invoice_number = fields_map.get("InvoiceNumber")
    results.append({
        "id": 1,
        "name": "Número de factura",
        "status": "OK" if invoice_number else "ERROR",
        "message": f"Número de factura: {invoice_number}" if invoice_number else "Falta InvoiceNumber"
    })

    invoice_date = fields_map.get("InvoiceDate")
    results.append({
        "id": 2,
        "name": "Fecha de emisión",
        "status": "OK" if invoice_date else "ERROR",
        "message": f"Fecha: {invoice_date}" if invoice_date else "Falta InvoiceDate"
    })

    place = fields_map.get("CountryOfOrigin") or fields_map.get("PortOfLoading")
    results.append({
        "id": 3,
        "name": "Lugar de emisión",
        "status": "OK" if place else "ERROR",
        "message": f"Lugar: {place}" if place else "Falta lugar de emisión"
    })

    supplier = fields_map.get("Supplier")
    supplier_address = fields_map.get("SupplierAddress")
    if supplier and supplier_address:
        status = "OK"
    elif supplier or supplier_address:
        status = "PARTIAL"
    else:
        status = "ERROR"

    results.append({
        "id": 4,
        "name": "Datos del vendedor",
        "status": status,
        "message": supplier or supplier_address or "Faltan datos del vendedor"
    })

    total = len(results)
    ok = len([r for r in results if r["status"] == "OK"])
    partial = len([r for r in results if r["status"] == "PARTIAL"])
    error = len([r for r in results if r["status"] == "ERROR"])

    if error > 0:
        overall = "No cumple"
    elif partial > 0:
        overall = "Cumple parcialmente"
    else:
        overall = "Cumple"

    return {
        "overallStatus": overall,
        "total": total,
        "ok": ok,
        "partial": partial,
        "error": error,
        "rules": results
    }
