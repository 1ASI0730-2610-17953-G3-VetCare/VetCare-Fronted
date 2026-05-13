const fs = require('fs');
const path = 'd:/WebStorm/vetcare/server/db.json';

try {
  const data = fs.readFileSync(path, 'utf8');
  const db = JSON.parse(data);

  db.historial_clinico = [
    {
      "id": 1,
      "patientId": 1,
      "type": "consulta",
      "date": "10 Ene 2025",
      "doctor": "Dr. Carlos Méndez",
      "details": {
        "subjective": "El propietario reporta que Max ha mostrado disminución del apetito en los últimos 3 días, acompañado de letargo y un episodio de vómito ayer por la noche.",
        "objective": {
          "vitals": { "temperature": "39.2°C", "heartRate": "110 lpm", "weight": "32.5 kg", "bodyCondition": "5/9" },
          "exam": "Examen físico: Mucosas rosadas, TRC <2 seg. Palpación abdominal revela leve sensibilidad en epigastrio. Auscultación cardiopulmonar sin alteraciones. Temperatura ligeramente elevada."
        },
        "evaluation": {
          "presumptiveDiagnosis": "Gastroenteritis aguda",
          "differentialDiagnosis": "Pancreatitis, cuerpo extraño gastrointestinal, intoxicación alimentaria",
          "prognosis": "Favorable con tratamiento adecuado"
        },
        "plan": {
          "pharmacological": ["Metoclopramida 0.5 mg/kg cada 8 horas por 5 días", "Omeprazol 1 mg/kg cada 24 horas por 7 días", "Probióticos cada 12 horas por 10 días"],
          "dietary": ["Ayuno de 12 horas, luego dieta blanda (pollo hervido + arroz)", "Porciones pequeñas y frecuentes durante 3-5 días", "Hidratación constante"],
          "followUp": "Control en 3 días para evaluar evolución. Si persisten los síntomas, realizar estudios complementarios (hemograma, perfil bioquímico, ecografía abdominal)."
        },
        "tags": ["gastroenterology", "HC-2025-001"]
      }
    },
    {
      "id": 2,
      "patientId": 1,
      "type": "vacuna",
      "date": "02 Ene 2025",
      "doctor": "Dr. Carlos Méndez",
      "details": {
        "vaccines": [
          { "name": "Séxtuple Canina", "lot": "Lote: VX-2024-1156" }
        ],
        "notes": "Paciente en buen estado general. Sin reacciones adversas post-vacunación. Se recomienda observación durante 24 horas y evitar ejercicio intenso.",
        "tags": ["prevention"]
      }
    },
    {
      "id": 3,
      "patientId": 1,
      "type": "hospitalizacion",
      "date": "10-12 Dic 2024",
      "doctor": "Dr. Carlos Méndez",
      "details": {
        "reason": "Fractura de fémur izquierdo por accidente vehicular. Se realizó reducción abierta con fijación interna mediante placa y tornillos.",
        "procedure": "Osteosíntesis con placa DCP 3.5mm bajo anestesia general inhalatoria. Tiempo quirúrgico: 90 minutos.",
        "evolution": "Post-operatorio favorable. Alta médica con reposo absoluto por 4 semanas y fisioterapia posterior.",
        "postOpVitals": { "temp": "38.6°C", "hr": "95 lpm", "spo2": "98%", "crt": "<2 seg" },
        "tags": ["traumatology", "surgery"]
      }
    }
  ];

  db.historial_stats = {
    "totalConsultations": 24,
    "vaccinesApplied": 12,
    "hospitalizations": 2,
    "lastVisit": "15 Ene 2025"
  };

  fs.writeFileSync(path, JSON.stringify(db, null, 2));
  console.log('db.json updated successfully');
} catch (err) {
  console.error('Error updating db.json:', err);
}
