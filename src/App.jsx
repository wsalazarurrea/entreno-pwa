import React, { useState, useEffect, useRef, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { storage } from "./storage.js";
import { initPush, subscribePush, scheduleRest, getSubscription, isStandalone } from "./push-client.js";

/* ================= SEED (historial real desde Hevy, ago 2025 – jul 2026) ================= */
const SEED = {"last":{"Abducción de Caderas":{"date":"2026-07-03","sets":[{"w":95.0,"r":12},{"w":100.0,"r":12},{"w":100.0,"r":12}]},"Aducción de Caderas":{"date":"2026-07-03","sets":[{"w":95.0,"r":12},{"w":100.0,"r":12},{"w":100.0,"r":10}]},"Aperturas (Mancuerna)":{"date":"2025-11-15","sets":[{"w":23.0,"r":11},{"w":23.0,"r":10},{"w":23.0,"r":10}]},"Aperturas (Máquina)":{"date":"2026-06-18","sets":[{"w":75.0,"r":12},{"w":75.0,"r":10},{"w":75.0,"r":8},{"w":35.0,"r":9}]},"Aperturas Inclinadas (Mancuerna)":{"date":"2026-02-23","sets":[{"w":18.0,"r":15},{"w":18.0,"r":15},{"w":18.0,"r":15}]},"Aperturas de Pecho Sentado (Cable)":{"date":"2026-06-29","sets":[{"w":25.0,"r":12},{"w":30.0,"r":12},{"w":30.0,"r":10}]},"Cables Cruzados":{"date":"2025-10-06","sets":[{"w":20.0,"r":12},{"w":25.0,"r":10},{"w":20.0,"r":11}]},"Curl Martillo (Cable)":{"date":"2025-11-22","sets":[{"w":35.0,"r":12},{"w":35.0,"r":15},{"w":40.0,"r":15},{"w":45.0,"r":12},{"w":45.0,"r":12}]},"Curl Martillo (Mancuerna)":{"date":"2026-07-01","sets":[{"w":12.5,"r":12},{"w":12.5,"r":10},{"w":12.5,"r":9},{"w":12.5,"r":10}]},"Curl con Barra EZ":{"date":"2026-05-25","sets":[{"w":35.0,"r":12},{"w":35.0,"r":9},{"w":35.0,"r":9},{"w":35.0,"r":8},{"w":2.0,"r":7}]},"Curl de Biceps 21":{"date":"2025-10-25","sets":[{"w":15.0,"r":21},{"w":20.0,"r":21},{"w":15.0,"r":21},{"w":20.0,"r":21}]},"Curl de Bíceps (Barra)":{"date":"2025-11-30","sets":[{"w":27.0,"r":12},{"w":27.0,"r":12},{"w":29.0,"r":12},{"w":29.0,"r":12}]},"Curl de Bíceps (Mancuerna)":{"date":"2025-09-20","sets":[{"w":15.0,"r":10},{"w":15.0,"r":12},{"w":17.5,"r":8}]},"Curl de Bíceps Inclinado (Mancuerna)":{"date":"2026-06-25","sets":[{"w":17.5,"r":5},{"w":15.0,"r":5},{"w":12.5,"r":9},{"w":12.5,"r":7},{"w":8.0,"r":7}]},"Curl de Pierna Sentado":{"date":"2026-06-20","sets":[{"w":80.0,"r":10},{"w":70.0,"r":12},{"w":75.0,"r":11},{"w":75.0,"r":12}]},"Curl de Piernas Acostado (Máquina)":{"date":"2026-06-27","sets":[{"w":46.0,"r":12},{"w":50.0,"r":12},{"w":54.0,"r":10},{"w":59.0,"r":10}]},"Curl por detrás de la espalda (polea)":{"date":"2026-07-01","sets":[{"w":25.0,"r":8},{"w":25.0,"r":8},{"w":25.0,"r":7},{"w":15.0,"r":5}]},"Curl predicador (máquina)":{"date":"2026-06-19","sets":[{"w":50.0,"r":7},{"w":45.0,"r":7},{"w":40.0,"r":7},{"w":40.0,"r":9},{"w":25.0,"r":6}]},"Dominada":{"date":"2026-07-01","sets":[{"w":null,"r":12},{"w":null,"r":10},{"w":null,"r":10},{"w":null,"r":9}]},"Elevacion Laterales (Mancuerna)":{"date":"2026-02-23","sets":[{"w":12.0,"r":12},{"w":12.0,"r":12},{"w":12.0,"r":12}]},"Elevación Frontal con Disco":{"date":"2026-02-02","sets":[{"w":7.5,"r":12},{"w":12.0,"r":10}]},"Elevación Lateral a un Brazo (Cable)":{"date":"2026-06-29","sets":[{"w":15.0,"r":12},{"w":20.0,"r":8},{"w":20.0,"r":7}]},"Elevación de Gemelos Sentado":{"date":"2026-02-13","sets":[{"w":50.0,"r":12},{"w":50.0,"r":12},{"w":50.0,"r":12}]},"Elevación de Gemelos a Una Pierna (Barra)":{"date":"2026-06-20","sets":[{"w":30.0,"r":12},{"w":30.0,"r":12},{"w":30.0,"r":12}]},"Elevación de Gemelos de Pie (Mancuerna)":{"date":"2026-02-08","sets":[{"w":34.0,"r":15},{"w":34.0,"r":15},{"w":34.0,"r":15}]},"Empuje de Caderas (Barra)":{"date":"2026-07-03","sets":[{"w":130.0,"r":12},{"w":130.0,"r":11},{"w":130.0,"r":11}]},"Extension de Pantorrilla (Máquina)":{"date":"2026-07-03","sets":[{"w":100.0,"r":12}]},"Extensión de Pierna":{"date":"2026-06-27","sets":[{"w":96.0,"r":11},{"w":100.0,"r":9},{"w":100.0,"r":7}]},"Extensión de Tríceps a un Brazo (Cable)":{"date":"2026-06-24","sets":[{"w":20.0,"r":12},{"w":20.0,"r":10},{"w":25.0,"r":7}]},"Extensión de Tríceps de un Brazo (Mancuerna)":{"date":"2026-02-23","sets":[{"w":12.0,"r":12},{"w":12.0,"r":11},{"w":12.0,"r":9}]},"Extensión de tríceps en polea":{"date":"2026-06-18","sets":[{"w":45.0,"r":15},{"w":55.0,"r":12},{"w":60.0,"r":12},{"w":65.0,"r":11}]},"Extensión de tríceps por encima de la cabeza (cable)":{"date":"2026-06-29","sets":[{"w":40.0,"r":15},{"w":50.0,"r":12},{"w":55.0,"r":11}]},"Fondo de Tríceps":{"date":"2026-02-10","sets":[{"w":null,"r":9},{"w":null,"r":12},{"w":null,"r":9},{"w":null,"r":7}]},"Fondos":{"date":"2025-11-25","sets":[{"w":null,"r":15},{"w":null,"r":12},{"w":null,"r":9}]},"Jalón al Pecho (Máquina)":{"date":"2026-06-11","sets":[{"w":75.0,"r":10},{"w":80.0,"r":8},{"w":85.0,"r":8},{"w":85.0,"r":9}]},"Jalón al Pecho - Agarre Cerrado (Cable)":{"date":"2026-05-31","sets":[{"w":75.0,"r":10},{"w":75.0,"r":10},{"w":80.0,"r":9}]},"Jalón al Pecho a Un Brazo":{"date":"2026-07-01","sets":[{"w":55.0,"r":11},{"w":55.0,"r":10},{"w":55.0,"r":9}]},"Jalón de Remo a Un Brazo":{"date":"2025-10-03","sets":[{"w":50.0,"r":12},{"w":50.0,"r":11},{"w":50.0,"r":11},{"w":50.0,"r":12}]},"Jalón de tríceps con cuerda":{"date":"2026-06-29","sets":[{"w":45.0,"r":12},{"w":50.0,"r":9},{"w":50.0,"r":10}]},"Patada de Burro (Máquina)":{"date":"2025-10-09","sets":[{"w":70.0,"r":15},{"w":85.0,"r":15},{"w":100.0,"r":13}]},"Peso Muerto Rumano (Barra)":{"date":"2026-02-08","sets":[{"w":70.0,"r":11},{"w":70.0,"r":11},{"w":70.0,"r":11}]},"Press Francés (Barra)":{"date":"2026-06-24","sets":[{"w":25.0,"r":12},{"w":30.0,"r":9},{"w":30.0,"r":9}]},"Press de Banca (Barra)":{"date":"2026-06-10","sets":[{"w":80.0,"r":8},{"w":80.0,"r":7},{"w":80.0,"r":6}]},"Press de Banca (Mancuerna)":{"date":"2025-11-01","sets":[{"w":25.0,"r":12},{"w":25.0,"r":12},{"w":25.0,"r":12},{"w":25.0,"r":12}]},"Press de Banca Inclinado (Barra)":{"date":"2026-02-14","sets":[{"w":60.0,"r":12},{"w":70.0,"r":10},{"w":70.0,"r":9},{"w":75.0,"r":6}]},"Press de Banca Inclinado (Mancuerna)":{"date":"2026-06-29","sets":[{"w":22.5,"r":10},{"w":27.0,"r":12},{"w":27.0,"r":12},{"w":32.0,"r":12}]},"Press de Banca Inclinado (Máquina Smith)":{"date":"2026-03-31","sets":[{"w":60.0,"r":11},{"w":70.0,"r":5},{"w":60.0,"r":7},{"w":60.0,"r":8}]},"Press de Hombros  (Mancuerna)":{"date":"2026-02-18","sets":[{"w":22.5,"r":12},{"w":25.0,"r":10},{"w":25.0,"r":10}]},"Press de Hombros (Barra)":{"date":"2026-02-23","sets":[{"w":45.0,"r":12},{"w":47.0,"r":12},{"w":50.0,"r":9}]},"Press de Hombros Sentado (Máquina)":{"date":"2026-06-29","sets":[{"w":45.0,"r":12},{"w":55.0,"r":11},{"w":60.0,"r":8},{"w":60.0,"r":8}]},"Press de Piernas":{"date":"2026-06-27","sets":[{"w":120.0,"r":12},{"w":160.0,"r":12},{"w":200.0,"r":10}]},"Remo Bajo Iso-Lateral":{"date":"2025-09-24","sets":[{"w":75.0,"r":12},{"w":75.0,"r":11},{"w":80.0,"r":10}]},"Remo Inclinado (Barra)":{"date":"2026-02-25","sets":[{"w":70.0,"r":12},{"w":70.0,"r":12},{"w":70.0,"r":12}]},"Remo Iso-Lateral":{"date":"2026-05-03","sets":[{"w":80.0,"r":12},{"w":85.0,"r":12},{"w":90.0,"r":10}]},"Remo Sentado con Agarre en V (Cable)":{"date":"2026-03-02","sets":[{"w":80.0,"r":9},{"w":80.0,"r":9},{"w":85.0,"r":8}]},"Remo Sentado con Cable":{"date":"2026-03-20","sets":[{"w":70.0,"r":12},{"w":80.0,"r":9},{"w":85.0,"r":7}]},"Remo con Mancuerna":{"date":"2025-09-16","sets":[{"w":32.0,"r":12},{"w":32.0,"r":10},{"w":32.0,"r":10}]},"Remo en Punta":{"date":"2026-06-25","sets":[{"w":55.0,"r":12},{"w":60.0,"r":9},{"w":60.0,"r":9}]},"Sentadilla (Barra)":{"date":"2026-02-21","sets":[{"w":60.0,"r":12},{"w":80.0,"r":10},{"w":90.0,"r":8},{"w":100.0,"r":4}]},"Sentadilla (Máquina Smith)":{"date":"2026-07-03","sets":[{"w":40.0,"r":12},{"w":60.0,"r":8},{"w":60.0,"r":8},{"w":60.0,"r":8}]},"Sentadilla Búlgara":{"date":"2026-05-05","sets":[{"w":40.0,"r":10},{"w":40.0,"r":10},{"w":50.0,"r":7}]},"Sentadilla Hack (Máquina)":{"date":"2026-06-27","sets":[{"w":80.0,"r":8},{"w":80.0,"r":8},{"w":80.0,"r":7}]},"Step con Mancuerna":{"date":"2026-02-08","sets":[{"w":17.0,"r":16},{"w":34.0,"r":12},{"w":34.0,"r":12}]},"Tirón a la Cara":{"date":"2025-11-22","sets":[{"w":75.0,"r":12},{"w":80.0,"r":10},{"w":80.0,"r":11}]},"Tríceps con Polea":{"date":"2025-11-29","sets":[{"w":50.0,"r":12},{"w":55.0,"r":12},{"w":60.0,"r":11}]},"Vuelos Posteriores (Cable)":{"date":"2026-07-01","sets":[{"w":10.0,"r":15},{"w":15.0,"r":11},{"w":15.0,"r":10}]},"Vuelos Posteriores (Mancuerna)":{"date":"2025-11-30","sets":[{"w":12.0,"r":12},{"w":12.0,"r":12},{"w":12.0,"r":12},{"w":12.0,"r":12}]},"Vuelos Posteriores (Máquina)":{"date":"2026-05-25","sets":[{"w":55.0,"r":12},{"w":60.0,"r":11},{"w":60.0,"r":9}]},"Zancada (Mancuerna)":{"date":"2025-11-14","sets":[{"w":23.0,"r":12},{"w":27.0,"r":12},{"w":32.0,"r":12}]}},"hist":{"Press de Banca Inclinado (Mancuerna)":[{"d":"2025-10-20","e1rm":37.8,"tw":27.0,"vol":1296},{"d":"2025-10-28","e1rm":43.7,"tw":32.0,"vol":1320},{"d":"2025-11-07","e1rm":43.7,"tw":32.0,"vol":1288},{"d":"2025-11-11","e1rm":43.7,"tw":32.0,"vol":1320},{"d":"2025-11-20","e1rm":44.8,"tw":32.0,"vol":1090},{"d":"2025-11-25","e1rm":44.8,"tw":32.0,"vol":1373},{"d":"2025-11-29","e1rm":44.8,"tw":32.0,"vol":1352},{"d":"2026-02-10","e1rm":42.7,"tw":32.0,"vol":1288},{"d":"2026-03-19","e1rm":41.6,"tw":32.0,"vol":1156},{"d":"2026-05-07","e1rm":45.6,"tw":37.0,"vol":1189},{"d":"2026-06-18","e1rm":44.8,"tw":32.0,"vol":1444},{"d":"2026-06-24","e1rm":44.8,"tw":32.0,"vol":1399},{"d":"2026-06-29","e1rm":44.8,"tw":32.0,"vol":1257}],"Aperturas (Máquina)":[{"d":"2025-09-02","e1rm":105.0,"tw":75.0,"vol":3075},{"d":"2025-09-06","e1rm":105.0,"tw":75.0,"vol":2700},{"d":"2025-09-11","e1rm":97.5,"tw":75.0,"vol":2325},{"d":"2025-09-15","e1rm":98.0,"tw":75.0,"vol":2670},{"d":"2025-09-23","e1rm":112.0,"tw":85.0,"vol":3380},{"d":"2025-09-27","e1rm":106.7,"tw":85.0,"vol":3095},{"d":"2025-10-02","e1rm":100.0,"tw":75.0,"vol":1950},{"d":"2025-10-10","e1rm":100.0,"tw":75.0,"vol":2175},{"d":"2025-10-15","e1rm":105.0,"tw":80.0,"vol":2370},{"d":"2025-10-20","e1rm":106.7,"tw":80.0,"vol":2375},{"d":"2025-10-24","e1rm":102.5,"tw":80.0,"vol":2105},{"d":"2025-10-28","e1rm":105.0,"tw":80.0,"vol":2290},{"d":"2025-11-07","e1rm":105.0,"tw":80.0,"vol":2290},{"d":"2025-11-11","e1rm":106.7,"tw":80.0,"vol":2525},{"d":"2025-11-20","e1rm":100.0,"tw":75.0,"vol":2100},{"d":"2025-11-25","e1rm":105.0,"tw":80.0,"vol":2290},{"d":"2025-11-29","e1rm":106.7,"tw":80.0,"vol":2525},{"d":"2026-02-10","e1rm":95.0,"tw":75.0,"vol":2100},{"d":"2026-02-28","e1rm":100.0,"tw":75.0,"vol":2270},{"d":"2026-03-06","e1rm":100.0,"tw":75.0,"vol":2420},{"d":"2026-03-19","e1rm":97.5,"tw":75.0,"vol":2120},{"d":"2026-03-26","e1rm":105.0,"tw":75.0,"vol":2345},{"d":"2026-03-31","e1rm":102.5,"tw":80.0,"vol":2320},{"d":"2026-05-07","e1rm":102.5,"tw":75.0,"vol":2340},{"d":"2026-05-21","e1rm":97.5,"tw":75.0,"vol":1845},{"d":"2026-05-30","e1rm":95.7,"tw":70.0,"vol":2375},{"d":"2026-06-04","e1rm":100.0,"tw":75.0,"vol":2115},{"d":"2026-06-10","e1rm":102.5,"tw":75.0,"vol":2490},{"d":"2026-06-18","e1rm":105.0,"tw":75.0,"vol":2565}],"Remo en Punta":[{"d":"2025-09-20","e1rm":76.0,"tw":60.0,"vol":2280},{"d":"2025-09-24","e1rm":56.0,"tw":40.0,"vol":1360},{"d":"2025-09-29","e1rm":66.7,"tw":50.0,"vol":2000},{"d":"2025-11-17","e1rm":73.3,"tw":55.0,"vol":2140},{"d":"2026-02-16","e1rm":78.0,"tw":60.0,"vol":1740},{"d":"2026-02-20","e1rm":80.2,"tw":65.0,"vol":2195},{"d":"2026-03-02","e1rm":78.0,"tw":60.0,"vol":1750},{"d":"2026-03-07","e1rm":82.3,"tw":65.0,"vol":1780},{"d":"2026-03-13","e1rm":76.0,"tw":60.0,"vol":1560},{"d":"2026-05-09","e1rm":74.0,"tw":60.0,"vol":1355},{"d":"2026-05-16","e1rm":80.2,"tw":65.0,"vol":1655},{"d":"2026-05-25","e1rm":78.0,"tw":60.0,"vol":1680},{"d":"2026-05-31","e1rm":84.5,"tw":65.0,"vol":1845},{"d":"2026-06-06","e1rm":80.0,"tw":60.0,"vol":1500},{"d":"2026-06-11","e1rm":71.5,"tw":55.0,"vol":1375},{"d":"2026-06-19","e1rm":78.0,"tw":60.0,"vol":1625},{"d":"2026-06-25","e1rm":78.0,"tw":60.0,"vol":1740}],"Tirón a la Cara":[{"d":"2025-09-03","e1rm":105.0,"tw":75.0,"vol":3000},{"d":"2025-09-07","e1rm":44.8,"tw":32.0,"vol":1536},{"d":"2025-09-12","e1rm":109.3,"tw":85.0,"vol":3360},{"d":"2025-09-16","e1rm":109.3,"tw":80.0,"vol":2680},{"d":"2025-09-20","e1rm":112.0,"tw":80.0,"vol":3540},{"d":"2025-09-29","e1rm":106.7,"tw":80.0,"vol":2500},{"d":"2025-10-03","e1rm":105.0,"tw":75.0,"vol":2400},{"d":"2025-10-11","e1rm":106.7,"tw":80.0,"vol":2300},{"d":"2025-10-16","e1rm":112.0,"tw":80.0,"vol":2670},{"d":"2025-10-21","e1rm":112.0,"tw":80.0,"vol":2660},{"d":"2025-10-25","e1rm":109.3,"tw":80.0,"vol":2580},{"d":"2025-11-04","e1rm":112.0,"tw":80.0,"vol":2740},{"d":"2025-11-13","e1rm":109.3,"tw":80.0,"vol":2580},{"d":"2025-11-17","e1rm":109.3,"tw":80.0,"vol":2580},{"d":"2025-11-22","e1rm":109.3,"tw":80.0,"vol":2580}],"Elevación Lateral a un Brazo (Cable)":[{"d":"2025-09-02","e1rm":25.3,"tw":20.0,"vol":460},{"d":"2025-09-06","e1rm":21.0,"tw":15.0,"vol":480},{"d":"2025-09-11","e1rm":21.0,"tw":15.0,"vol":540},{"d":"2025-09-15","e1rm":21.0,"tw":15.0,"vol":540},{"d":"2025-09-19","e1rm":28.0,"tw":20.0,"vol":620},{"d":"2025-09-23","e1rm":21.0,"tw":15.0,"vol":480},{"d":"2025-09-27","e1rm":21.0,"tw":15.0,"vol":510},{"d":"2025-10-02","e1rm":21.0,"tw":15.0,"vol":480},{"d":"2025-10-06","e1rm":20.0,"tw":15.0,"vol":370},{"d":"2025-10-10","e1rm":21.0,"tw":15.0,"vol":460},{"d":"2025-10-15","e1rm":21.0,"tw":15.0,"vol":510},{"d":"2025-10-20","e1rm":26.7,"tw":20.0,"vol":560},{"d":"2025-10-24","e1rm":24.0,"tw":20.0,"vol":480},{"d":"2025-10-28","e1rm":25.3,"tw":20.0,"vol":520},{"d":"2025-11-01","e1rm":25.3,"tw":20.0,"vol":520},{"d":"2025-11-11","e1rm":26.0,"tw":20.0,"vol":540},{"d":"2025-11-20","e1rm":26.0,"tw":20.0,"vol":540},{"d":"2025-11-29","e1rm":27.3,"tw":20.0,"vol":600},{"d":"2026-02-10","e1rm":24.7,"tw":20.0,"vol":500},{"d":"2026-02-14","e1rm":24.7,"tw":20.0,"vol":620},{"d":"2026-02-18","e1rm":24.7,"tw":20.0,"vol":500},{"d":"2026-02-28","e1rm":26.0,"tw":20.0,"vol":520},{"d":"2026-03-06","e1rm":25.3,"tw":20.0,"vol":340},{"d":"2026-03-11","e1rm":26.0,"tw":20.0,"vol":540},{"d":"2026-03-19","e1rm":26.0,"tw":20.0,"vol":540},{"d":"2026-03-28","e1rm":24.7,"tw":20.0,"vol":460},{"d":"2026-03-31","e1rm":26.0,"tw":20.0,"vol":540},{"d":"2026-05-07","e1rm":26.7,"tw":20.0,"vol":540},{"d":"2026-05-14","e1rm":20.0,"tw":15.0,"vol":435},{"d":"2026-05-21","e1rm":21.0,"tw":15.0,"vol":540},{"d":"2026-05-30","e1rm":21.0,"tw":15.0,"vol":375},{"d":"2026-06-04","e1rm":24.0,"tw":20.0,"vol":480},{"d":"2026-06-10","e1rm":25.3,"tw":20.0,"vol":500},{"d":"2026-06-18","e1rm":25.3,"tw":20.0,"vol":480},{"d":"2026-06-24","e1rm":21.0,"tw":15.0,"vol":480},{"d":"2026-06-29","e1rm":25.3,"tw":20.0,"vol":480}],"Sentadilla Hack (Máquina)":[{"d":"2025-09-18","e1rm":123.3,"tw":100.0,"vol":3110},{"d":"2025-10-23","e1rm":143.0,"tw":110.0,"vol":2730},{"d":"2025-11-10","e1rm":112.0,"tw":90.0,"vol":3050},{"d":"2025-11-18","e1rm":98.0,"tw":70.0,"vol":2380},{"d":"2025-11-28","e1rm":120.0,"tw":100.0,"vol":3120},{"d":"2026-03-09","e1rm":106.7,"tw":80.0,"vol":2440},{"d":"2026-03-24","e1rm":120.0,"tw":100.0,"vol":3240},{"d":"2026-05-12","e1rm":126.7,"tw":100.0,"vol":2600},{"d":"2026-05-27","e1rm":123.3,"tw":100.0,"vol":2470},{"d":"2026-06-02","e1rm":135.7,"tw":110.0,"vol":2510},{"d":"2026-06-09","e1rm":126.7,"tw":110.0,"vol":2200},{"d":"2026-06-20","e1rm":132.0,"tw":110.0,"vol":2880},{"d":"2026-06-27","e1rm":101.3,"tw":80.0,"vol":1840}],"Press de Piernas":[{"d":"2025-09-01","e1rm":213.3,"tw":160.0,"vol":4600},{"d":"2025-09-10","e1rm":168.0,"tw":120.0,"vol":4200},{"d":"2025-09-26","e1rm":182.0,"tw":130.0,"vol":4200},{"d":"2025-10-14","e1rm":200.0,"tw":150.0,"vol":7230},{"d":"2025-10-23","e1rm":224.0,"tw":160.0,"vol":4680},{"d":"2025-10-31","e1rm":280.0,"tw":210.0,"vol":8250},{"d":"2025-11-10","e1rm":200.0,"tw":150.0,"vol":4380},{"d":"2025-11-18","e1rm":238.0,"tw":170.0,"vol":5280},{"d":"2025-11-28","e1rm":210.0,"tw":150.0,"vol":4920},{"d":"2026-02-13","e1rm":238.0,"tw":170.0,"vol":5400},{"d":"2026-02-21","e1rm":246.0,"tw":180.0,"vol":5580},{"d":"2026-02-27","e1rm":238.0,"tw":170.0,"vol":5400},{"d":"2026-03-09","e1rm":252.0,"tw":180.0,"vol":6120},{"d":"2026-03-24","e1rm":224.0,"tw":160.0,"vol":5280},{"d":"2026-05-12","e1rm":240.0,"tw":180.0,"vol":5520},{"d":"2026-05-27","e1rm":240.7,"tw":190.0,"vol":5020},{"d":"2026-06-09","e1rm":226.7,"tw":170.0,"vol":5200},{"d":"2026-06-20","e1rm":253.3,"tw":190.0,"vol":5400},{"d":"2026-06-27","e1rm":266.7,"tw":200.0,"vol":5360}],"Extensión de Pierna":[{"d":"2025-09-01","e1rm":126.7,"tw":95.0,"vol":2840},{"d":"2025-09-10","e1rm":113.3,"tw":85.0,"vol":2650},{"d":"2025-09-18","e1rm":100.0,"tw":75.0,"vol":2415},{"d":"2025-09-26","e1rm":136.7,"tw":100.0,"vol":3320},{"d":"2025-10-14","e1rm":136.7,"tw":100.0,"vol":3320},{"d":"2025-10-23","e1rm":140.0,"tw":100.0,"vol":4100},{"d":"2025-10-31","e1rm":154.0,"tw":110.0,"vol":4740},{"d":"2025-11-10","e1rm":140.0,"tw":100.0,"vol":3420},{"d":"2025-11-18","e1rm":140.0,"tw":100.0,"vol":3420},{"d":"2025-11-28","e1rm":140.0,"tw":100.0,"vol":3420},{"d":"2026-02-13","e1rm":150.3,"tw":110.0,"vol":3490},{"d":"2026-02-21","e1rm":168.0,"tw":120.0,"vol":3960},{"d":"2026-02-27","e1rm":140.0,"tw":100.0,"vol":3600},{"d":"2026-03-09","e1rm":140.0,"tw":100.0,"vol":3600},{"d":"2026-03-24","e1rm":140.0,"tw":100.0,"vol":3600},{"d":"2026-05-12","e1rm":136.7,"tw":100.0,"vol":3180},{"d":"2026-05-27","e1rm":129.8,"tw":100.0,"vol":2645},{"d":"2026-06-09","e1rm":133.3,"tw":100.0,"vol":3140},{"d":"2026-06-20","e1rm":136.7,"tw":100.0,"vol":3180},{"d":"2026-06-27","e1rm":131.2,"tw":100.0,"vol":2656}],"Curl de Pierna Sentado":[{"d":"2025-09-18","e1rm":75.6,"tw":54.0,"vol":2391},{"d":"2025-10-23","e1rm":98.0,"tw":70.0,"vol":2985},{"d":"2025-10-31","e1rm":112.0,"tw":80.0,"vol":3420},{"d":"2025-11-28","e1rm":126.0,"tw":90.0,"vol":3900},{"d":"2026-02-13","e1rm":106.7,"tw":80.0,"vol":3320},{"d":"2026-02-21","e1rm":123.0,"tw":90.0,"vol":2970},{"d":"2026-06-20","e1rm":106.7,"tw":80.0,"vol":3365}],"Extension de Pantorrilla (Máquina)":[{"d":"2025-09-01","e1rm":112.0,"tw":80.0,"vol":2880},{"d":"2025-09-05","e1rm":112.0,"tw":80.0,"vol":2880},{"d":"2025-09-10","e1rm":150.0,"tw":90.0,"vol":4680},{"d":"2025-09-13","e1rm":112.0,"tw":80.0,"vol":2880},{"d":"2025-09-22","e1rm":126.0,"tw":90.0,"vol":3240},{"d":"2025-09-26","e1rm":150.0,"tw":90.0,"vol":4680},{"d":"2025-10-09","e1rm":126.0,"tw":90.0,"vol":3240},{"d":"2025-10-14","e1rm":150.0,"tw":90.0,"vol":4680},{"d":"2025-10-19","e1rm":126.0,"tw":90.0,"vol":3240},{"d":"2025-10-23","e1rm":150.0,"tw":90.0,"vol":5760},{"d":"2025-10-27","e1rm":126.0,"tw":90.0,"vol":3240},{"d":"2025-10-31","e1rm":150.0,"tw":90.0,"vol":4680},{"d":"2025-11-10","e1rm":150.0,"tw":90.0,"vol":4680},{"d":"2025-11-14","e1rm":140.0,"tw":100.0,"vol":3480},{"d":"2025-11-18","e1rm":150.0,"tw":90.0,"vol":4680},{"d":"2025-11-28","e1rm":126.0,"tw":90.0,"vol":3240},{"d":"2026-03-09","e1rm":142.5,"tw":100.0,"vol":3705},{"d":"2026-03-17","e1rm":135.0,"tw":90.0,"vol":4050},{"d":"2026-05-17","e1rm":135.0,"tw":90.0,"vol":3780},{"d":"2026-06-02","e1rm":135.0,"tw":90.0,"vol":3780},{"d":"2026-06-09","e1rm":140.0,"tw":100.0,"vol":3300},{"d":"2026-07-03","e1rm":140.0,"tw":100.0,"vol":1200}],"Press de Banca (Mancuerna)":[{"d":"2025-09-02","e1rm":37.8,"tw":27.0,"vol":1716},{"d":"2025-09-06","e1rm":37.8,"tw":27.0,"vol":1296},{"d":"2025-09-11","e1rm":42.7,"tw":32.0,"vol":1292},{"d":"2025-09-15","e1rm":42.7,"tw":32.0,"vol":1288},{"d":"2025-09-19","e1rm":38.5,"tw":27.5,"vol":1290},{"d":"2025-09-23","e1rm":44.8,"tw":32.0,"vol":1503},{"d":"2025-10-02","e1rm":37.8,"tw":27.0,"vol":1296},{"d":"2025-10-06","e1rm":43.7,"tw":32.0,"vol":1320},{"d":"2025-10-10","e1rm":44.8,"tw":32.0,"vol":1384},{"d":"2025-10-24","e1rm":44.8,"tw":32.0,"vol":1476},{"d":"2025-11-01","e1rm":35.0,"tw":25.0,"vol":1200}],"Jalón al Pecho a Un Brazo":[{"d":"2025-09-29","e1rm":80.0,"tw":60.0,"vol":2405},{"d":"2025-10-07","e1rm":75.2,"tw":55.0,"vol":1705},{"d":"2025-10-11","e1rm":80.0,"tw":60.0,"vol":2305},{"d":"2025-10-21","e1rm":100.0,"tw":75.0,"vol":2330},{"d":"2025-10-25","e1rm":80.0,"tw":60.0,"vol":1590},{"d":"2025-10-29","e1rm":77.0,"tw":55.0,"vol":1980},{"d":"2025-11-04","e1rm":77.0,"tw":55.0,"vol":1815},{"d":"2025-11-13","e1rm":77.0,"tw":55.0,"vol":1760},{"d":"2025-11-17","e1rm":66.7,"tw":50.0,"vol":1500},{"d":"2025-11-22","e1rm":66.7,"tw":50.0,"vol":1500},{"d":"2026-02-16","e1rm":86.3,"tw":70.0,"vol":1675},{"d":"2026-05-09","e1rm":74.0,"tw":60.0,"vol":1410},{"d":"2026-05-16","e1rm":84.5,"tw":65.0,"vol":1965},{"d":"2026-06-25","e1rm":84.5,"tw":65.0,"vol":1785},{"d":"2026-07-01","e1rm":75.2,"tw":55.0,"vol":1650}],"Press de Hombros Sentado (Máquina)":[{"d":"2025-10-02","e1rm":97.5,"tw":75.0,"vol":2765},{"d":"2025-10-10","e1rm":68.3,"tw":50.0,"vol":1905},{"d":"2025-10-28","e1rm":68.3,"tw":50.0,"vol":2100},{"d":"2025-11-20","e1rm":70.0,"tw":50.0,"vol":2100},{"d":"2025-11-25","e1rm":80.0,"tw":60.0,"vol":2450},{"d":"2025-11-29","e1rm":70.0,"tw":50.0,"vol":2250},{"d":"2026-02-14","e1rm":123.0,"tw":90.0,"vol":3510},{"d":"2026-02-28","e1rm":82.3,"tw":65.0,"vol":1635},{"d":"2026-03-06","e1rm":88.8,"tw":70.0,"vol":1835},{"d":"2026-03-11","e1rm":97.5,"tw":75.0,"vol":2225},{"d":"2026-03-19","e1rm":65.0,"tw":50.0,"vol":1350},{"d":"2026-03-26","e1rm":76.0,"tw":60.0,"vol":1630},{"d":"2026-03-31","e1rm":68.3,"tw":55.0,"vol":1435},{"d":"2026-05-07","e1rm":93.3,"tw":70.0,"vol":1820},{"d":"2026-05-14","e1rm":93.3,"tw":70.0,"vol":1890},{"d":"2026-05-21","e1rm":95.7,"tw":70.0,"vol":1960},{"d":"2026-05-30","e1rm":93.3,"tw":70.0,"vol":1750},{"d":"2026-06-04","e1rm":95.7,"tw":75.0,"vol":1925},{"d":"2026-06-10","e1rm":100.0,"tw":76.0,"vol":2198},{"d":"2026-06-18","e1rm":98.0,"tw":75.0,"vol":2040},{"d":"2026-06-24","e1rm":97.5,"tw":75.0,"vol":1970},{"d":"2026-06-29","e1rm":76.0,"tw":60.0,"vol":2105}],"Curl con Barra EZ":[{"d":"2025-09-03","e1rm":42.0,"tw":30.0,"vol":990},{"d":"2025-09-07","e1rm":42.0,"tw":30.0,"vol":960},{"d":"2025-09-12","e1rm":42.0,"tw":30.0,"vol":960},{"d":"2025-09-16","e1rm":42.0,"tw":30.0,"vol":1020},{"d":"2025-09-20","e1rm":42.0,"tw":30.0,"vol":1080},{"d":"2025-09-24","e1rm":45.5,"tw":35.0,"vol":1035},{"d":"2025-10-25","e1rm":42.0,"tw":30.0,"vol":1080},{"d":"2025-11-17","e1rm":49.0,"tw":35.0,"vol":1725},{"d":"2025-11-26","e1rm":42.0,"tw":30.0,"vol":1240},{"d":"2026-02-06","e1rm":46.5,"tw":34.0,"vol":1392},{"d":"2026-02-25","e1rm":45.5,"tw":35.0,"vol":1260},{"d":"2026-03-02","e1rm":47.8,"tw":35.0,"vol":1400},{"d":"2026-05-25","e1rm":49.0,"tw":35.0,"vol":1344}],"Empuje de Caderas (Barra)":[{"d":"2025-09-01","e1rm":150.3,"tw":110.0,"vol":4270},{"d":"2025-09-05","e1rm":140.0,"tw":100.0,"vol":4680},{"d":"2025-09-13","e1rm":107.8,"tw":77.0,"vol":3858},{"d":"2025-09-22","e1rm":154.0,"tw":110.0,"vol":4920},{"d":"2025-09-30","e1rm":168.0,"tw":120.0,"vol":5520},{"d":"2025-10-09","e1rm":168.0,"tw":120.0,"vol":5520},{"d":"2025-10-19","e1rm":196.0,"tw":140.0,"vol":5760},{"d":"2025-10-27","e1rm":154.0,"tw":110.0,"vol":5280},{"d":"2025-11-05","e1rm":168.0,"tw":120.0,"vol":5400},{"d":"2025-11-14","e1rm":173.3,"tw":130.0,"vol":4980},{"d":"2025-11-24","e1rm":173.3,"tw":130.0,"vol":5220},{"d":"2026-02-17","e1rm":200.0,"tw":150.0,"vol":4980},{"d":"2026-03-05","e1rm":173.3,"tw":130.0,"vol":4860},{"d":"2026-03-17","e1rm":182.0,"tw":130.0,"vol":5620},{"d":"2026-03-28","e1rm":209.7,"tw":170.0,"vol":4010},{"d":"2026-05-05","e1rm":213.3,"tw":160.0,"vol":5920},{"d":"2026-05-17","e1rm":213.3,"tw":160.0,"vol":5820},{"d":"2026-06-02","e1rm":205.0,"tw":150.0,"vol":4500},{"d":"2026-06-16","e1rm":182.0,"tw":130.0,"vol":4420},{"d":"2026-07-03","e1rm":182.0,"tw":130.0,"vol":4420}],"Peso Muerto Rumano (Barra)":[{"d":"2026-02-08","e1rm":95.7,"tw":70.0,"vol":2310}],"Aducción de Caderas":[{"d":"2025-09-05","e1rm":126.0,"tw":90.0,"vol":3345},{"d":"2025-09-13","e1rm":150.0,"tw":90.0,"vol":4875},{"d":"2025-09-22","e1rm":133.0,"tw":95.0,"vol":3180},{"d":"2025-09-30","e1rm":140.0,"tw":100.0,"vol":3560},{"d":"2025-10-09","e1rm":140.0,"tw":100.0,"vol":3380},{"d":"2025-10-19","e1rm":140.0,"tw":100.0,"vol":3380},{"d":"2025-10-27","e1rm":140.0,"tw":100.0,"vol":3325},{"d":"2025-11-05","e1rm":130.7,"tw":100.0,"vol":2860},{"d":"2025-11-14","e1rm":133.3,"tw":100.0,"vol":3030},{"d":"2025-11-24","e1rm":133.3,"tw":100.0,"vol":3220},{"d":"2026-02-17","e1rm":120.0,"tw":90.0,"vol":2700},{"d":"2026-03-05","e1rm":140.0,"tw":100.0,"vol":3280},{"d":"2026-03-17","e1rm":133.3,"tw":100.0,"vol":3125},{"d":"2026-03-28","e1rm":133.3,"tw":100.0,"vol":3030},{"d":"2026-05-05","e1rm":133.3,"tw":100.0,"vol":3280},{"d":"2026-05-17","e1rm":140.0,"tw":100.0,"vol":3340},{"d":"2026-06-02","e1rm":136.7,"tw":100.0,"vol":3240},{"d":"2026-06-16","e1rm":140.0,"tw":100.0,"vol":3340},{"d":"2026-07-03","e1rm":140.0,"tw":100.0,"vol":3340}],"Abducción de Caderas":[{"d":"2025-09-05","e1rm":126.0,"tw":90.0,"vol":2970},{"d":"2025-09-13","e1rm":126.0,"tw":90.0,"vol":2970},{"d":"2025-09-22","e1rm":126.0,"tw":90.0,"vol":3000},{"d":"2025-09-30","e1rm":150.0,"tw":100.0,"vol":4425},{"d":"2025-10-19","e1rm":150.0,"tw":100.0,"vol":4425},{"d":"2025-10-27","e1rm":150.0,"tw":100.0,"vol":4425},{"d":"2025-11-05","e1rm":142.5,"tw":100.0,"vol":3705},{"d":"2025-11-24","e1rm":140.0,"tw":100.0,"vol":3420},{"d":"2026-02-17","e1rm":140.0,"tw":100.0,"vol":3280},{"d":"2026-03-05","e1rm":140.0,"tw":100.0,"vol":3280},{"d":"2026-03-17","e1rm":133.3,"tw":100.0,"vol":3030},{"d":"2026-03-28","e1rm":140.0,"tw":100.0,"vol":3550},{"d":"2026-05-05","e1rm":140.0,"tw":100.0,"vol":3340},{"d":"2026-05-17","e1rm":140.0,"tw":100.0,"vol":3540},{"d":"2026-06-02","e1rm":140.0,"tw":100.0,"vol":3540},{"d":"2026-06-16","e1rm":140.0,"tw":100.0,"vol":3440},{"d":"2026-07-03","e1rm":140.0,"tw":100.0,"vol":3540}],"Aperturas de Pecho Sentado (Cable)":[{"d":"2025-11-01","e1rm":98.4,"tw":72.0,"vol":2280},{"d":"2026-02-14","e1rm":44.4,"tw":36.0,"vol":1135},{"d":"2026-02-18","e1rm":48.0,"tw":36.0,"vol":1272},{"d":"2026-03-11","e1rm":44.3,"tw":35.0,"vol":1025},{"d":"2026-05-14","e1rm":42.0,"tw":30.0,"vol":945},{"d":"2026-06-24","e1rm":40.0,"tw":30.0,"vol":900},{"d":"2026-06-29","e1rm":42.0,"tw":30.0,"vol":960}],"Dominada":[{"d":"2025-09-12","e1rm":0,"tw":null,"vol":0},{"d":"2025-09-20","e1rm":0,"tw":null,"vol":0},{"d":"2025-10-07","e1rm":0,"tw":null,"vol":0},{"d":"2025-10-25","e1rm":0,"tw":null,"vol":0},{"d":"2025-11-04","e1rm":0,"tw":null,"vol":0},{"d":"2025-11-09","e1rm":0,"tw":null,"vol":0},{"d":"2025-11-26","e1rm":0,"tw":null,"vol":0},{"d":"2025-11-30","e1rm":0,"tw":null,"vol":0},{"d":"2026-02-06","e1rm":0,"tw":null,"vol":0},{"d":"2026-02-25","e1rm":0,"tw":null,"vol":0},{"d":"2026-06-06","e1rm":0,"tw":null,"vol":0},{"d":"2026-06-19","e1rm":0,"tw":null,"vol":0},{"d":"2026-06-25","e1rm":0,"tw":null,"vol":0},{"d":"2026-07-01","e1rm":0,"tw":null,"vol":0}]}};

/* ================= PALETA / TIPOS ================= */
const c = {
  bg: "#12151A", panel: "#191D24", panel2: "#1F242C", line: "#2A303A",
  ink: "#ECEAE4", mut: "#889099", faint: "#5B636E",
  amber: "#E8A33D", teal: "#49B79E", coral: "#E27D6B", violet: "#8E86D8",
};
const UI = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,'SF Mono','JetBrains Mono',Menlo,Consolas,monospace";

/* ================= RUTINAS (pesos de arranque desde tus datos) ================= */
const ROUTINES = {
  SA: { key:"SA", tag:"SUP A", title:"Pecho pesado", accent:c.amber, ex:[
    {name:"Press de Banca Inclinado (Mancuerna)", sets:4, lo:6, hi:9, start:34, unit:"kg/mano", note:"Eccéntrico 3s, pausa abajo. Tu estrella."},
    {name:"Fondos", sets:3, lo:8, hi:12, start:0, unit:"bw", note:"Torso inclinado. Si pasas 12, añade lastre."},
    {name:"Aperturas (Máquina)", sets:3, lo:10, hi:15, start:72, unit:"kg", note:"Pec deck. Cerca del fallo."},
    {name:"Remo en Punta", sets:3, lo:10, hi:12, start:57, unit:"kg", note:"Apoyo de pecho. Mantenimiento."},
    {name:"Tirón a la Cara", sets:3, lo:15, hi:15, start:67, unit:"kg", note:"Salud de hombro. Innegociable."},
    {name:"Elevación Lateral a un Brazo (Cable)", sets:3, lo:12, hi:15, start:15, unit:"kg", note:"Sin balanceo."},
  ]},
  IA: { key:"IA", tag:"INF A", title:"Cuádriceps", accent:c.teal, ex:[
    {name:"Sentadilla Hack (Máquina)", sets:4, lo:8, hi:10, start:100, unit:"kg", note:"Ya hiciste 100×9 y 110×6."},
    {name:"Press de Piernas", sets:3, lo:10, hi:12, start:190, unit:"kg", note:"Vienes de 200×10."},
    {name:"Extensión de Pierna", sets:3, lo:12, hi:15, start:90, unit:"kg", note:"Para llegar de verdad a 15."},
    {name:"Curl de Pierna Sentado", sets:3, lo:10, hi:12, start:78, unit:"kg", note:"Lo has hecho hasta 90 kg."},
    {name:"Extension de Pantorrilla (Máquina)", sets:4, lo:10, hi:12, start:100, unit:"kg", note:"Pausa 1s abajo."},
  ]},
  SB: { key:"SB", tag:"SUP B", title:"Pecho volumen", accent:c.amber, ex:[
    {name:"Press de Banca (Mancuerna)", sets:4, lo:8, hi:12, start:32, unit:"kg/mano", note:"Baja hondo, siente el estiramiento."},
    {name:"Aperturas de Abajo hacia Arriba (Cable)", sets:4, lo:12, hi:15, start:11, unit:"kg/lado", note:"NUEVO. Pecho superior."},
    {name:"Aperturas de Arriba hacia Abajo (Cable)", sets:3, lo:12, hi:15, start:14, unit:"kg/lado", note:"Estiramiento pecho bajo."},
    {name:"Jalón al Pecho a Un Brazo", sets:3, lo:10, hi:12, start:55, unit:"kg", note:"Inicia con el dorsal."},
    {name:"Press de Hombros Sentado (Máquina)", sets:2, lo:10, hi:12, start:60, unit:"kg", note:"Mantenimiento."},
    {name:"Curl con Barra EZ", sets:3, lo:10, hi:12, start:35, unit:"kg", note:""},
  ]},
  IB: { key:"IB", tag:"INF B", title:"Glúteo / Femoral", accent:c.teal, ex:[
    {name:"Empuje de Caderas (Barra)", sets:4, lo:8, hi:12, start:135, unit:"kg", note:"Estancado en 130. Rompe."},
    {name:"Peso Muerto Rumano (Barra)", sets:3, lo:10, hi:12, start:65, unit:"kg", note:"Bisagra de cadera. Ya hiciste 70×11."},
    {name:"Curl de Pierna Sentado", sets:4, lo:10, hi:12, start:78, unit:"kg", note:""},
    {name:"Aducción de Caderas", sets:2, lo:12, hi:15, start:95, unit:"kg", note:""},
    {name:"Abducción de Caderas", sets:2, lo:12, hi:15, start:95, unit:"kg", note:""},
    {name:"Elevación de Gemelos Sentado", sets:4, lo:12, hi:15, start:45, unit:"kg", note:"Sóleo. Empieza conservador."},
  ]},
};
const DAY_ORDER = ["SA","IA","SB","IB"];

/* ================= STORAGE ================= */
async function loadState(){ try{ const r=await storage.get("pt_state_v1"); return r?JSON.parse(r.value):null; }catch(e){ return null; } }
async function saveState(s){ try{ await storage.set("pt_state_v1", JSON.stringify(s)); }catch(e){ console.error(e); } }

function seedState(){
  const last={}; Object.entries(SEED.last||{}).forEach(([k,v])=>{ last[k]={date:v.date, sets:v.sets}; });
  const history={}; Object.entries(SEED.hist||{}).forEach(([k,v])=>{ history[k]=v.slice(); });
  return { lastperf:last, history, sessions:[] };
}

/* ================= LÓGICA DE PROGRESIÓN ================= */
function incFor(ex){
  if(ex.unit==="bw") return 0;
  if(/Mancuerna/.test(ex.name)) return 2;
  if(/Cable|Aperturas|Elevación Lateral|Vuelos|Tirón/.test(ex.name)) return 2.5;
  return 5;
}
function suggestion(ex, lastperf){
  const lp = lastperf[ex.name];
  const inc = incFor(ex);
  if(ex.unit==="bw"){
    if(lp && lp.sets && lp.sets.every(s=>(s.r||0)>=ex.hi)) return {w:0, kind:"up", msg:`superaste ${ex.hi} reps a peso corporal → añade lastre`};
    return {w:0, kind:"hold", msg:`peso corporal · busca +1 rep (meta ${ex.hi})`};
  }
  if(!lp || !lp.sets || !lp.sets.filter(s=>s.w!=null).length) return {w:ex.start, kind:"start", msg:`arranque sugerido ${ex.start} kg`};
  const working = lp.sets.filter(s=>s.w!=null);
  const w = Math.max(...working.map(s=>s.w||0));
  const atTop = working.filter(s=>(s.w||0)===w);
  const allHi = atTop.length>0 && atTop.every(s=>(s.r||0)>=ex.hi);
  if(allHi) return {w:+(w+inc).toFixed(1), kind:"up", msg:`cerraste ${ex.hi} reps en todas → sube a ${+(w+inc).toFixed(1)} kg`};
  return {w:w, kind:"hold", msg:`mantén ${w} kg y suma reps (meta ${ex.hi})`};
}
function e1rm(w,r){ return (w>0&&r>0)? w*(1+r/30):0; }

/* ================= ÁTOMOS UI ================= */
function Stepper({value, onChange, step, min=0, mono=true, suffix=""}){
  const btn={width:34,height:38,border:"none",background:c.panel2,color:c.ink,fontSize:18,cursor:"pointer",borderRadius:8,lineHeight:1};
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <button style={btn} onClick={()=>onChange(Math.max(min,+(value-step).toFixed(2)))} aria-label="menos">–</button>
      <div style={{minWidth:56,textAlign:"center",fontFamily:mono?MONO:UI,fontSize:17,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{value}{suffix}</div>
      <button style={btn} onClick={()=>onChange(+(value+step).toFixed(2))} aria-label="más">+</button>
    </div>
  );
}
function Tag({children,color}){ return <span style={{fontFamily:MONO,fontSize:11,letterSpacing:1,color,border:`1px solid ${color}55`,padding:"2px 7px",borderRadius:5}}>{children}</span>; }

/* ================= SESIÓN ACTIVA ================= */
function ActiveSession({routine, state, onFinish, onCancel}){
  const [log,setLog] = useState(()=> routine.ex.map(ex=>{
    const s = suggestion(ex,state.lastperf);
    return { name:ex.name, sug:s, sets: Array.from({length:ex.sets},()=>({w:s.w, r:ex.hi, done:false})) };
  }));
  const [start] = useState(Date.now());
  const [now,setNow] = useState(Date.now());
  const [restEnd,setRestEnd] = useState(null);
  const [soundOn,setSoundOn] = useState(true);
  const audioRef = useRef(null), signaledRef = useRef(false), wakeRef = useRef(null);
  const REST_SECONDS = 120;
  const elapsed = Math.floor((now-start)/1000);
  const restLeft = restEnd ? Math.max(0, Math.ceil((restEnd-now)/1000)) : null;

  function ensureAudio(){ try{ if(!audioRef.current){ const AC=window.AudioContext||window.webkitAudioContext; audioRef.current=new AC(); } if(audioRef.current.state==="suspended") audioRef.current.resume(); }catch(e){} }
  function beep(){ if(soundOn){ try{ const ctx=audioRef.current; if(ctx){ const t0=ctx.currentTime; [0,0.28,0.56].forEach((off,i)=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.type="sine"; o.frequency.value=660+i*220; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.0001,t0+off); g.gain.exponentialRampToValueAtTime(0.5,t0+off+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t0+off+0.22); o.start(t0+off); o.stop(t0+off+0.24); }); } }catch(e){} } try{ if(navigator.vibrate) navigator.vibrate([200,100,200]); }catch(e){} }
  async function acquireWake(){ try{ if("wakeLock" in navigator){ wakeRef.current=await navigator.wakeLock.request("screen"); } }catch(e){} }
  const startRest=()=>{ ensureAudio(); signaledRef.current=false; setRestEnd(Date.now()+REST_SECONDS*1000); scheduleRest(REST_SECONDS); };

  useEffect(()=>{ const t=setInterval(()=>setNow(Date.now()),400); return ()=>clearInterval(t); },[]);
  useEffect(()=>{ acquireWake(); const onVis=()=>{ if(document.visibilityState==="visible"){ acquireWake(); setNow(Date.now()); try{ if(audioRef.current&&audioRef.current.state==="suspended") audioRef.current.resume(); }catch(e){} } }; document.addEventListener("visibilitychange",onVis); return ()=>{ document.removeEventListener("visibilitychange",onVis); try{ if(wakeRef.current){ wakeRef.current.release(); wakeRef.current=null; } }catch(e){} }; },[]);
  useEffect(()=>{ if(restEnd && restLeft===0 && !signaledRef.current){ signaledRef.current=true; beep(); } },[restEnd,restLeft]);

  const upd=(ei,si,field,val)=>setLog(L=>L.map((e,i)=> i!==ei? e : {...e, sets:e.sets.map((s,j)=> j!==si? s : {...s,[field]:val})}));
  const toggle=(ei,si)=>{ setLog(L=>L.map((e,i)=> i!==ei? e : {...e, sets:e.sets.map((s,j)=> j!==si? s : {...s,done:!s.done})})); const wasDone=log[ei].sets[si].done; ensureAudio(); if(!wasDone) startRest(); };
  const addSet=(ei)=>setLog(L=>L.map((e,i)=> i!==ei? e : {...e, sets:[...e.sets, {...e.sets[e.sets.length-1], done:false}]}));

  const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const doneCount = log.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
  const totalCount = log.reduce((a,e)=>a+e.sets.length,0);

  return (
    <div style={{paddingBottom:120}}>
      <div style={{position:"sticky",top:0,zIndex:5,background:c.bg,borderBottom:`1px solid ${c.line}`,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><Tag color={routine.accent}>{routine.tag}</Tag><span style={{fontWeight:600}}>{routine.title}</span></div>
          <div style={{color:c.mut,fontSize:12,marginTop:4,fontFamily:MONO}}>{fmt(elapsed)} · {doneCount}/{totalCount} series</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>{ensureAudio();setSoundOn(s=>!s);}} title="Sonido" style={{background:"transparent",border:`1px solid ${c.line}`,color:soundOn?c.amber:c.faint,borderRadius:9,padding:"8px 10px",cursor:"pointer",fontSize:15}}>{soundOn?"🔔":"🔕"}</button>
          {restLeft!=null && (restLeft>0
            ? <button onClick={()=>setRestEnd(s=>Math.max(Date.now(),(s||Date.now()))+30000)} style={{background:c.amber,color:"#181818",border:"none",borderRadius:9,padding:"8px 12px",fontWeight:700,fontFamily:MONO,cursor:"pointer"}} title="Toca para +30s">⏱ {fmt(restLeft)}</button>
            : <button onClick={()=>{beep();setRestEnd(null);}} style={{background:c.teal,color:"#0c1512",border:"none",borderRadius:9,padding:"8px 12px",fontWeight:700,fontFamily:MONO,cursor:"pointer"}}>¡Listo! ✓</button>)}
          <button onClick={onCancel} style={{background:"transparent",color:c.mut,border:`1px solid ${c.line}`,borderRadius:9,padding:"8px 10px",cursor:"pointer"}}>Salir</button>
        </div>
      </div>

      <div style={{padding:16, display:"flex", flexDirection:"column", gap:14}}>
        {log.map((e,ei)=>{
          const ex = routine.ex[ei];
          const prev = state.lastperf[e.name];
          const sugColor = e.sug.kind==="up"?c.teal : e.sug.kind==="hold"?c.amber : c.mut;
          return (
            <div key={ei} style={{background:c.panel,border:`1px solid ${c.line}`,borderRadius:14,overflow:"hidden"}}>
              <div style={{padding:"12px 14px",borderBottom:`1px solid ${c.line}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
                  <span style={{fontWeight:600,fontSize:15}}>{e.name}</span>
                  <span style={{fontFamily:MONO,fontSize:12,color:c.mut,whiteSpace:"nowrap"}}>{ex.sets}×{ex.lo}-{ex.hi}</span>
                </div>
                <div style={{marginTop:8,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:sugColor,background:`${sugColor}18`,border:`1px solid ${sugColor}44`,borderRadius:7,padding:"3px 8px"}}>▸ {e.sug.msg}</span>
                  {prev && <span style={{fontSize:12,color:c.faint,fontFamily:MONO}}>ant: {prev.sets.filter(s=>s.w!=null).map(s=>`${s.w}×${s.r}`).join(" ")||"—"}</span>}
                </div>
                {ex.note && <div style={{marginTop:6,fontSize:12,color:c.faint,fontStyle:"italic"}}>{ex.note}</div>}
              </div>
              <div style={{padding:"6px 8px"}}>
                <div style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 44px",gap:6,padding:"4px 6px",color:c.faint,fontSize:11,fontFamily:MONO,letterSpacing:.5}}>
                  <span>#</span><span style={{textAlign:"center"}}>{ex.unit==="bw"?"lastre":"peso kg"}</span><span style={{textAlign:"center"}}>reps</span><span></span>
                </div>
                {e.sets.map((s,si)=>{
                  const hitTop=(s.r||0)>=ex.hi, below=(s.r||0)<ex.lo;
                  const repColor = s.done ? (hitTop?c.teal:below?c.coral:c.ink) : c.ink;
                  return (
                    <div key={si} style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 44px",gap:6,alignItems:"center",padding:"5px 6px",borderRadius:9,background:s.done?`${routine.accent}12`:"transparent"}}>
                      <span style={{fontFamily:MONO,color:c.faint,fontSize:13}}>{si+1}</span>
                      <div style={{display:"flex",justifyContent:"center"}}><Stepper value={s.w} step={ex.unit==="bw"?1:incFor(ex)||2.5} onChange={v=>upd(ei,si,"w",v)} /></div>
                      <div style={{display:"flex",justifyContent:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <button onClick={()=>upd(ei,si,"r",Math.max(0,(s.r||0)-1))} style={{width:34,height:38,border:"none",background:c.panel2,color:c.ink,fontSize:18,borderRadius:8,cursor:"pointer"}}>–</button>
                          <div style={{minWidth:32,textAlign:"center",fontFamily:MONO,fontWeight:600,fontSize:17,color:repColor,fontVariantNumeric:"tabular-nums"}}>{s.r}</div>
                          <button onClick={()=>upd(ei,si,"r",(s.r||0)+1)} style={{width:34,height:38,border:"none",background:c.panel2,color:c.ink,fontSize:18,borderRadius:8,cursor:"pointer"}}>+</button>
                        </div>
                      </div>
                      <button onClick={()=>toggle(ei,si)} aria-label="completar" style={{width:38,height:38,borderRadius:10,border:`1.5px solid ${s.done?routine.accent:c.line}`,background:s.done?routine.accent:"transparent",color:s.done?"#181818":c.faint,fontSize:18,cursor:"pointer",justifySelf:"center"}}>✓</button>
                    </div>
                  );
                })}
                <button onClick={()=>addSet(ei)} style={{width:"100%",marginTop:4,padding:"7px",background:"transparent",border:`1px dashed ${c.line}`,color:c.mut,borderRadius:9,cursor:"pointer",fontSize:13}}>+ serie</button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:16,background:`linear-gradient(180deg,transparent,${c.bg} 30%)`}}>
        <button onClick={()=>onFinish(log, Math.floor((Date.now()-start)/1000))} style={{width:"100%",padding:"15px",background:routine.accent,color:"#181818",border:"none",borderRadius:13,fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:"0 8px 24px rgba(0,0,0,.4)"}}>Finalizar y analizar</button>
      </div>
    </div>
  );
}

/* ================= RESUMEN / ANÁLISIS ================= */
function Summary({data, onClose}){
  const [ai,setAi] = useState(null);
  const [loading,setLoading] = useState(true);
  const [err,setErr] = useState(false);
  useEffect(()=>{ let alive=true;
    (async()=>{
      try{
        const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1000, messages:[{role:"user", content: data.prompt}] })});
        const j = await res.json();
        const txt = (j.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n").trim();
        if(alive){ setAi(txt||null); setLoading(false); if(!txt) setErr(true); }
      }catch(e){ if(alive){ setErr(true); setLoading(false);} }
    })();
    return ()=>{alive=false;};
  },[]);
  return (
    <div style={{padding:16,paddingBottom:120}}>
      <h2 style={{fontSize:22,fontWeight:700,margin:"6px 0 2px"}}>Sesión cerrada</h2>
      <div style={{color:c.mut,fontFamily:MONO,fontSize:13,marginBottom:16}}>{data.day} · {data.durMin} min · {data.totalSets} series · {Math.round(data.volume).toLocaleString()} kg movidos</div>

      {data.prs.length>0 && (
        <div style={{background:`${c.teal}14`,border:`1px solid ${c.teal}55`,borderRadius:12,padding:14,marginBottom:14}}>
          <div style={{color:c.teal,fontWeight:700,marginBottom:6}}>🏆 Récords estimados</div>
          {data.prs.map((p,i)=><div key={i} style={{fontSize:14,color:c.ink}}>{p.name}: <span style={{fontFamily:MONO}}>{p.w}×{p.r}</span> <span style={{color:c.faint}}>(e1RM {p.e1rm.toFixed(0)} kg)</span></div>)}
        </div>
      )}

      <div style={{background:c.panel,border:`1px solid ${c.line}`,borderRadius:12,padding:16,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{width:8,height:8,borderRadius:4,background:c.amber,display:"inline-block"}}></span>
          <span style={{fontWeight:700}}>Análisis del entrenador</span>
        </div>
        {loading && <div style={{color:c.mut,fontSize:14}}>Analizando tu sesión…</div>}
        {!loading && ai && <div style={{fontSize:14.5,lineHeight:1.6,color:c.ink,whiteSpace:"pre-wrap"}}>{ai}</div>}
        {!loading && err && (
          <div style={{fontSize:14,lineHeight:1.6,color:c.ink}}>
            {data.fallback}
            <div style={{marginTop:8,color:c.faint,fontSize:12}}>(No pude conectar con el análisis IA en este momento — arriba tienes el resumen calculado.)</div>
          </div>
        )}
      </div>

      <div style={{background:c.panel,border:`1px solid ${c.line}`,borderRadius:12,padding:14,marginBottom:14}}>
        <div style={{fontWeight:600,marginBottom:8,fontSize:14}}>Progresión para la próxima vez</div>
        {data.nextHints.map((h,i)=><div key={i} style={{fontSize:13.5,color:c.mut,padding:"3px 0"}}>· {h}</div>)}
      </div>

      <button onClick={onClose} style={{width:"100%",padding:14,background:c.panel2,color:c.ink,border:`1px solid ${c.line}`,borderRadius:12,fontSize:15,fontWeight:600,cursor:"pointer"}}>Listo</button>
    </div>
  );
}

/* ================= HISTORIAL ================= */
function History({state}){
  const exNames = useMemo(()=> Object.keys(state.history).filter(k=>(state.history[k]||[]).length>1).sort(),[state.history]);
  const [sel,setSel] = useState(exNames[0]||"");
  const series = (state.history[sel]||[]).map(p=>({date:p.d.slice(5), e1rm:Math.round(p.e1rm), vol:p.vol}));
  return (
    <div style={{padding:16,paddingBottom:100}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Progresión</h2>
      <div style={{color:c.mut,fontSize:13,marginBottom:14}}>Fuerza estimada (e1RM) a lo largo del tiempo — incluye tu historial de Hevy.</div>
      <select value={sel} onChange={e=>setSel(e.target.value)} style={{width:"100%",padding:"11px 12px",background:c.panel,color:c.ink,border:`1px solid ${c.line}`,borderRadius:10,fontSize:14,marginBottom:14,fontFamily:UI}}>
        {exNames.map(n=><option key={n} value={n}>{n}</option>)}
      </select>
      <div style={{background:c.panel,border:`1px solid ${c.line}`,borderRadius:14,padding:"16px 8px 8px",height:260}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{top:4,right:12,left:-14,bottom:0}}>
            <CartesianGrid stroke={c.line} vertical={false}/>
            <XAxis dataKey="date" stroke={c.faint} fontSize={11} tickLine={false} axisLine={{stroke:c.line}} minTickGap={24}/>
            <YAxis stroke={c.faint} fontSize={11} tickLine={false} axisLine={false} width={44} domain={['dataMin-5','dataMax+5']}/>
            <Tooltip contentStyle={{background:c.panel2,border:`1px solid ${c.line}`,borderRadius:8,color:c.ink,fontSize:12}} labelStyle={{color:c.mut}}/>
            <Line type="monotone" dataKey="e1rm" stroke={c.amber} strokeWidth={2.5} dot={{r:2,fill:c.amber}} activeDot={{r:5}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 style={{fontSize:16,fontWeight:700,margin:"22px 0 10px"}}>Sesiones registradas aquí</h3>
      {state.sessions.length===0 && <div style={{color:c.faint,fontSize:14,fontStyle:"italic"}}>Aún no registras sesiones en el asistente. Tu primera aparecerá aquí.</div>}
      {[...state.sessions].reverse().map((s,i)=>(
        <div key={i} style={{background:c.panel,border:`1px solid ${c.line}`,borderRadius:12,padding:14,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontWeight:600}}>{s.tag} · {s.title}</span>
            <span style={{fontFamily:MONO,fontSize:12,color:c.mut}}>{s.date}</span>
          </div>
          <div style={{color:c.faint,fontFamily:MONO,fontSize:12,marginTop:5}}>{s.totalSets} series · {Math.round(s.volume).toLocaleString()} kg · {Math.round(s.durationSec/60)} min{s.prs?` · ${s.prs} PR`:""}</div>
        </div>
      ))}
    </div>
  );
}

/* ================= RUTINAS ================= */
function Routines(){
  return (
    <div style={{padding:16,paddingBottom:100}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Rutinas del bloque</h2>
      <div style={{color:c.mut,fontSize:13,marginBottom:16}}>Especialización pecho · 4 días · pesos de arranque desde tus datos.</div>
      {DAY_ORDER.map(k=>{ const r=ROUTINES[k]; return (
        <div key={k} style={{background:c.panel,border:`1px solid ${c.line}`,borderRadius:14,padding:16,marginBottom:12}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}><Tag color={r.accent}>{r.tag}</Tag><span style={{fontWeight:700,fontSize:16}}>{r.title}</span></div>
          {r.ex.map((e,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderTop:i?`1px solid ${c.line}`:"none"}}>
              <span style={{fontSize:14}}>{e.name}</span>
              <span style={{fontFamily:MONO,fontSize:13,color:c.mut,whiteSpace:"nowrap",marginLeft:10}}>{e.sets}×{e.lo}-{e.hi} · {e.unit==="bw"?"PC":`${e.start}${e.unit.includes("/")?e.unit.slice(2):"kg"}`}</span>
            </div>
          ))}
        </div>
      );})}
      <div style={{color:c.faint,fontSize:12,lineHeight:1.6,marginTop:8,fontStyle:"italic"}}>Progresión: doble progresión en pecho (cierras el tope de reps en todas las series → subes peso). Resto en mantenimiento a 2-3 RIR. Semana 7: descarga.</div>
    </div>
  );
}

/* ================= AJUSTES ================= */
function Settings(){
  const [status,setStatus] = useState(getSubscription() ? "activo" : "inactivo");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const activar = async () => {
    setBusy(true); setError("");
    try{ await subscribePush(); setStatus("activo"); }
    catch(e){ setError(e.message || "No se pudo activar"); }
    finally{ setBusy(false); }
  };
  return (
    <div style={{padding:16,paddingBottom:100}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Ajustes</h2>
      <div style={{color:c.mut,fontSize:13,marginBottom:16}}>Aviso de descanso en segundo plano (push), aunque el teléfono esté bloqueado o estés en otra app.</div>
      {!isStandalone() && (
        <div style={{background:`${c.coral}18`,border:`1px solid ${c.coral}55`,borderRadius:12,padding:14,marginBottom:14,fontSize:13,color:c.ink}}>
          Para que los avisos funcionen en iPhone, abre esta app desde el ícono en tu pantalla de inicio (Compartir → Agregar a inicio), no desde una pestaña de Safari.
        </div>
      )}
      <div style={{background:c.panel,border:`1px solid ${c.line}`,borderRadius:12,padding:16,marginBottom:14}}>
        <div style={{marginBottom:10,fontSize:14}}>Estado: <span style={{fontFamily:MONO,color:status==="activo"?c.teal:c.mut}}>{status}</span></div>
        <button onClick={activar} disabled={busy} style={{width:"100%",padding:14,background:c.amber,color:"#181818",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",opacity:busy?0.6:1}}>
          {busy? "Activando…" : "Activar avisos en segundo plano"}
        </button>
        {error && <div style={{marginTop:8,color:c.coral,fontSize:13}}>{error}</div>}
      </div>
    </div>
  );
}

/* ================= APP ================= */
export default function App(){
  const [state,setState] = useState(null);
  const [tab,setTab] = useState("train");
  const [active,setActive] = useState(null);
  const [summary,setSummary] = useState(null);

  useEffect(()=>{ (async()=>{ let s=await loadState(); if(!s){ s=seedState(); await saveState(s);} setState(s); })(); },[]);
  useEffect(()=>{ initPush().catch(()=>{}); },[]);

  const persist = async(ns)=>{ setState(ns); await saveState(ns); };

  const finishSession = async(routine, log, durationSec)=>{
    const today = new Date().toISOString().slice(0,10);
    const ns = { ...state, lastperf:{...state.lastperf}, history:{...state.history}, sessions:[...state.sessions] };
    let volume=0, totalSets=0; const prs=[]; const nextHints=[]; const exLines=[];
    log.forEach((e,ei)=>{
      const ex = routine.ex[ei];
      const done = e.sets.filter(s=>s.done);
      const counted = done.length?done:e.sets;
      let bestE=0,bestS=null;
      counted.forEach(s=>{ const w=s.w||0,r=s.r||0; volume+=w*r; totalSets+=1; const ee=e1rm(w,r); if(ee>bestE){bestE=ee;bestS=s;} });
      // PR check vs history
      const hist = ns.history[e.name]||[]; const prevBest = Math.max(0,...hist.map(p=>p.e1rm||0));
      if(bestE>prevBest+0.1 && bestS && (bestS.w||0)>0){ prs.push({name:e.name, w:bestS.w, r:bestS.r, e1rm:bestE}); }
      // update lastperf + history
      ns.lastperf[e.name] = { date:today, sets: counted.map(s=>({w:(ex.unit==="bw"?(s.w||0):s.w), r:s.r})) };
      ns.history[e.name] = [...hist, { d:today, e1rm:+bestE.toFixed(1), tw:Math.max(0,...counted.map(s=>s.w||0)), vol:Math.round(counted.reduce((a,s)=>a+(s.w||0)*(s.r||0),0)) }];
      // next hint
      const sug = suggestion(ex, ns.lastperf);
      nextHints.push(`${e.name}: ${sug.msg}`);
      exLines.push(`${e.name}: ${counted.map(s=>`${ex.unit==="bw"?"PC+":""}${s.w||0}×${s.r||0}`).join(", ")}`);
    });
    ns.sessions.push({ tag:routine.tag, title:routine.title, day:`${routine.tag} · ${routine.title}`, date:today, durationSec, totalSets, volume, prs:prs.length });
    await persist(ns);

    const chestFocus = routine.key==="SA"||routine.key==="SB";
    const prompt = `Eres el entrenador personal de Wladimir (49 años, hipertrofia, bloque de especialización de PECHO, 4 días/semana upper-lower). Acaba de terminar esta sesión:\n\n${routine.tag} · ${routine.title}\n${exLines.join("\n")}\n\nVolumen total: ${Math.round(volume)} kg · ${totalSets} series · ${Math.round(durationSec/60)} min.\n${prs.length?`Posibles récords: ${prs.map(p=>p.name+" "+p.w+"×"+p.r).join("; ")}.`:"Sin récords hoy."}\n${chestFocus?"Este es un día de pecho prioritario: el pecho puede ir a 1-2 RIR; el resto en mantenimiento.":"Día de tren inferior/mantenimiento: 2-3 RIR, sostener no reventar."}\n\nDame un análisis breve y directo en español (máx 5 frases, sin listas): qué salió bien, qué ajustar la próxima sesión, y una señal de progresión o alerta de recuperación. Tono de coach experto, cero relleno.`;

    const fallback = `Moviste ${Math.round(volume).toLocaleString()} kg en ${totalSets} series. ${prs.length?`Marcaste ${prs.length} posible(s) récord: buena señal de progreso.`:"Sin récords hoy, normal en una sesión de mantenimiento o de acumulación."} Revisa las sugerencias de abajo para la próxima vez.`;

    setSummary({ prompt, fallback, day:`${routine.tag} · ${routine.title}`, durMin:Math.round(durationSec/60), totalSets, volume, prs, nextHints });
    setActive(null);
  };

  if(!state) return <div style={{background:c.bg,color:c.mut,minHeight:"100vh",display:"grid",placeItems:"center",fontFamily:UI}}>Cargando tu historial…</div>;

  return (
    <div style={{background:c.bg,color:c.ink,minHeight:"100vh",fontFamily:UI,WebkitFontSmoothing:"antialiased"}}>
      <style>{`* { box-sizing:border-box; } button:focus-visible{outline:2px solid ${c.amber};outline-offset:2px;} select:focus{outline:none;border-color:${c.amber};} ::-webkit-scrollbar{width:8px;height:8px;} ::-webkit-scrollbar-thumb{background:${c.line};border-radius:4px;} @media(prefers-reduced-motion:reduce){*{transition:none!important;}}`}</style>

      {summary ? <Summary data={summary} onClose={()=>{setSummary(null);setTab("history");}}/> :
       active ? <ActiveSession routine={ROUTINES[active]} state={state} onFinish={(log,dur)=>finishSession(ROUTINES[active],log,dur)} onCancel={()=>setActive(null)}/> :
      <>
        <div style={{padding:"20px 16px 8px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:MONO,fontSize:12,letterSpacing:2,color:c.amber}}>ASISTENTE · BLOQUE PECHO</div>
              <h1 style={{fontSize:24,fontWeight:800,margin:"3px 0 0",letterSpacing:-.5}}>Entrenamiento</h1>
            </div>
            <button onClick={async()=>{ if(confirm("¿Reiniciar todo y recargar tu historial base? Se borran las sesiones registradas aquí.")){ const s=seedState(); await persist(s);} }}
              style={{background:"transparent",border:`1px solid ${c.line}`,color:c.faint,borderRadius:9,padding:"7px 10px",fontSize:12,cursor:"pointer"}}>Reiniciar</button>
          </div>
        </div>

        <div style={{display:"flex",gap:6,padding:"0 16px 6px"}}>
          {[["train","Entrenar"],["history","Historial"],["routines","Rutinas"],["settings","Ajustes"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",fontSize:14,fontWeight:600,
              background: tab===k?c.panel2:"transparent", color: tab===k?c.ink:c.mut}}>{l}</button>
          ))}
        </div>

        {tab==="train" && (
          <div style={{padding:16}}>
            <div style={{color:c.mut,fontSize:14,marginBottom:14}}>Elige la sesión de hoy. Te muestro tu peso previo y una sugerencia por ejercicio mientras registras.</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {DAY_ORDER.map(k=>{ const r=ROUTINES[k]; const lastDone=[...state.sessions].reverse().find(s=>s.tag===r.tag);
                return (
                  <button key={k} onClick={()=>setActive(k)} style={{textAlign:"left",background:c.panel,border:`1px solid ${c.line}`,borderLeft:`3px solid ${r.accent}`,borderRadius:14,padding:16,cursor:"pointer",color:c.ink}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}><Tag color={r.accent}>{r.tag}</Tag><span style={{fontWeight:700,fontSize:16}}>{r.title}</span></div>
                        <div style={{color:c.faint,fontSize:12.5}}>{r.ex.length} ejercicios · {r.ex.reduce((a,e)=>a+e.sets,0)} series{lastDone?` · última: ${lastDone.date}`:""}</div>
                      </div>
                      <span style={{color:r.accent,fontSize:22}}>▸</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {tab==="history" && <History state={state}/>}
        {tab==="routines" && <Routines/>}
        {tab==="settings" && <Settings/>}
      </>}
    </div>
  );
}
