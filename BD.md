Project VetCare {
  database_type: "SQL Server"
}

//////////////////////////////////////////////////////
// TABLAS
//////////////////////////////////////////////////////

Table clientes {
  id int [pk]
  nombre varchar
  dni varchar
  telefono varchar
  email varchar
  direccion varchar
}

Table especies {
  id int [pk]
  nombre varchar
}

Table razas {
  id int [pk]
  nombre varchar
  especie_id int
}

Table mascotas {
  id int [pk]
  nombre varchar
  especie_id int
  raza_id int
  sexo varchar
  fecha_nacimiento date
  peso float
  cliente_id int
}

Table citas {
  id int [pk]
  mascota_id int
  veterinario_id int
  fecha datetime
  estado_id int
  motivo_id int
}

Table estados_cita {
  id int [pk]
  nombre varchar
}

Table motivos_consulta {
  id int [pk]
  nombre varchar
}

Table consultas {
  id int [pk]
  cita_id int
  veterinario_id int
  fecha datetime
  observaciones text
  subjetivo text
  objetivo text
  evaluacion text
  plan text
}

Table tratamientos {
  id int [pk]
  consulta_id int
  descripcion text
  dosis varchar
  frecuencia varchar
  duracion varchar
}

Table tipos_vacuna {
  id int [pk]
  nombre varchar
}

Table vacunas {
  id int [pk]
  mascota_id int
  tipo_vacuna_id int
  fecha_aplicacion date
  proxima_dosis date
}

Table hospitalizacion {
  id int [pk]
  mascota_id int
  fecha_ingreso date
  fecha_salida date
  estado_id int
}

Table estados_hospitalizacion {
  id int [pk]
  nombre varchar
}

Table medicamentos {
  id int [pk]
  nombre varchar
  descripcion varchar
}

Table medicacion_hospitalaria {
  id int [pk]
  hospitalizacion_id int
  medicamento_id int
  dosis varchar
  frecuencia varchar
}

//////////////////////////////////////////////////////
// RELACIONES (FK)
//////////////////////////////////////////////////////

Ref: razas.especie_id > especies.id
Ref: mascotas.especie_id > especies.id
Ref: mascotas.raza_id > razas.id
Ref: mascotas.cliente_id > clientes.id

Ref: citas.mascota_id > mascotas.id
Ref: citas.estado_id > estados_cita.id
Ref: citas.motivo_id > motivos_consulta.id

Ref: consultas.cita_id > citas.id
Ref: tratamientos.consulta_id > consultas.id

Ref: vacunas.mascota_id > mascotas.id
Ref: vacunas.tipo_vacuna_id > tipos_vacuna.id

Ref: hospitalizacion.mascota_id > mascotas.id
Ref: hospitalizacion.estado_id > estados_hospitalizacion.id

Ref: medicacion_hospitalaria.hospitalizacion_id > hospitalizacion.id
Ref: medicacion_hospitalaria.medicamento_id > medicamentos.id