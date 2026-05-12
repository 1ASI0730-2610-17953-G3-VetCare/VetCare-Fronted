{
  "designSystem": {
    "meta": {
      "name": "VetCare – Card: Resumen del Mes",
      "frameId": "220:1090",
      "frameName": "Background+Border+Shadow",
      "dimensions": { "width": 320, "height": 180 },
      "description": "Tarjeta de resumen financiero mensual. Muestra métricas con barras de progreso horizontales y un balance final destacado."
    },

    "tokens": {
      "colors": {
        "surface": {
          "card": "#ffffff",
          "trackBar": "#f3f4f6",
          "border": "#f3f4f6"
        },
        "text": {
          "heading": "#1f2937",
          "label": "#6b7280",
          "valuePositive": "#16a34a",
          "valueNegative": "#ef4444",
          "valueHighlight": "#2563eb"
        },
        "progress": {
          "income": "#22c55e",
          "expense": "#f87171"
        },
        "shadow": {
          "color": "#000000",
          "opacity": 0.05
        }
      },

      "typography": {
        "fontFamily": "Inter",
        "styles": {
          "heading": {
            "fontSize": "14px",
            "fontWeight": 600,
            "lineHeight": "20px",
            "color": "#1f2937",
            "usage": "Título principal de la tarjeta — 'Resumen del Mes'"
          },
          "label": {
            "fontSize": "12px",
            "fontWeight": 400,
            "lineHeight": "16px",
            "color": "#6b7280",
            "usage": "Etiquetas de cada métrica — 'Ingresos', 'Egresos'"
          },
          "percentage": {
            "fontSize": "12px",
            "fontWeight": 600,
            "lineHeight": "16px",
            "usage": "Valor porcentual al lado derecho de cada barra",
            "variants": {
              "positive": { "color": "#16a34a" },
              "negative": { "color": "#ef4444" }
            }
          },
          "balanceLabel": {
            "fontSize": "12px",
            "fontWeight": 500,
            "lineHeight": "16px",
            "color": "#6b7280",
            "usage": "Etiqueta 'Balance neto' al pie de la tarjeta"
          },
          "balanceValue": {
            "fontSize": "14px",
            "fontWeight": 700,
            "lineHeight": "20px",
            "color": "#2563eb",
            "usage": "Valor monetario destacado — '$26,420.00'"
          }
        }
      }
    },

    "layout": {
      "direction": "flex-col",
      "padding": "20px",
      "outerGap": "12px",
      "sections": [
        {
          "id": "heading",
          "position": "top",
          "element": "text",
          "content": "Resumen del Mes",
          "style": "heading",
          "flex": "1 0 0"
        },
        {
          "id": "metrics_container",
          "position": "middle",
          "layout": "flex-col",
          "gap": "8px",
          "items": [
            {
              "id": "metric_ingresos",
              "layout": "flex-col",
              "gap": "4px",
              "rows": [
                {
                  "type": "labelRow",
                  "layout": "flex-row",
                  "justifyContent": "space-between",
                  "children": [
                    { "element": "text", "content": "Ingresos", "style": "label" },
                    { "element": "text", "content": "72%", "style": "percentage", "variant": "positive" }
                  ]
                },
                {
                  "type": "progressBar",
                  "track": {
                    "height": "6px",
                    "borderRadius": "9999px",
                    "background": "#f3f4f6",
                    "width": "100%"
                  },
                  "fill": {
                    "width": "72%",
                    "height": "6px",
                    "borderRadius": "9999px",
                    "background": "#22c55e"
                  }
                }
              ]
            },
            {
              "id": "metric_egresos",
              "layout": "flex-col",
              "gap": "4px",
              "rows": [
                {
                  "type": "labelRow",
                  "layout": "flex-row",
                  "justifyContent": "space-between",
                  "children": [
                    { "element": "text", "content": "Egresos", "style": "label" },
                    { "element": "text", "content": "28%", "style": "percentage", "variant": "negative" }
                  ]
                },
                {
                  "type": "progressBar",
                  "track": {
                    "height": "6px",
                    "borderRadius": "9999px",
                    "background": "#f3f4f6",
                    "width": "100%"
                  },
                  "fill": {
                    "width": "28%",
                    "height": "6px",
                    "borderRadius": "9999px",
                    "background": "#f87171"
                  }
                }
              ]
            }
          ]
        },
        {
          "id": "balance_row",
          "position": "bottom",
          "layout": "flex-row",
          "justifyContent": "space-between",
          "alignItems": "center",
          "separator": {
            "type": "border-top",
            "color": "#f3f4f6",
            "thickness": "1px"
          },
          "children": [
            { "element": "text", "content": "Balance neto", "style": "balanceLabel" },
            { "element": "text", "content": "$26,420.00", "style": "balanceValue" }
          ]
        }
      ]
    },

    "effects": {
      "border": {
        "type": "solid",
        "width": "1px",
        "color": "#f3f4f6",
        "radius": "16px"
      },
      "shadow": {
        "type": "drop-shadow",
        "offsetX": "0px",
        "offsetY": "1px",
        "blur": "2px",
        "spread": "0px",
        "color": "rgba(0, 0, 0, 0.05)"
      }
    }
  }
}

