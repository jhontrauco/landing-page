/* ============================================================
   MAIN.JS — jhontrauco.dev
   1. Modo claro / oscuro
   2. Año automático en el pie
   3. Aparición al hacer scroll
   4. Enlace activo en la navegación
   5. Borde de la cabecera al bajar
   6. Envío del formulario
   7. Cierre del menú móvil
   ============================================================ */

/* ---------- 1. MODO CLARO / OSCURO ---------- */
const raiz = document.documentElement;
const botonTema = document.getElementById('tema');

// Prioridad: lo que el visitante eligió antes > lo que usa su sistema
function temaInicial() {
  const guardado = localStorage.getItem('tema');
  if (guardado) return guardado;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

function aplicarTema(tema) {
  raiz.setAttribute('data-tema', tema);
  localStorage.setItem('tema', tema);
}

aplicarTema(temaInicial());

botonTema.addEventListener('click', () => {
  const actual = raiz.getAttribute('data-tema');
  aplicarTema(actual === 'oscuro' ? 'claro' : 'oscuro');
});

/* ---------- 2. AÑO AUTOMÁTICO ---------- */
document.getElementById('anio').textContent = new Date().getFullYear();

/* ---------- 3. APARICIÓN AL HACER SCROLL ---------- */
const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (entrada.isIntersecting) {
      entrada.target.classList.add('visible');
      observador.unobserve(entrada.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.aparece').forEach((el) => observador.observe(el));

/* ---------- 4. ENLACE ACTIVO EN LA NAVEGACIÓN ---------- */
const enlacesNav = document.querySelectorAll('.nav a');
const secciones = [...enlacesNav].map((a) => document.querySelector(a.getAttribute('href')));

const observadorNav = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (!entrada.isIntersecting) return;
    enlacesNav.forEach((a) => {
      const esActivo = a.getAttribute('href') === '#' + entrada.target.id;
      a.classList.toggle('activo', esActivo);
      if (esActivo) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });

secciones.forEach((s) => s && observadorNav.observe(s));

/* ---------- 5. BORDE DE LA CABECERA AL BAJAR ---------- */
const cabecera = document.querySelector('.cabecera');

window.addEventListener('scroll', () => {
  cabecera.classList.toggle('fijada', window.scrollY > 8);
}, { passive: true });

/* ---------- 6. ENVÍO DEL FORMULARIO ---------- */
const formulario = document.getElementById('formulario');
const aviso = document.getElementById('aviso');
const botonEnviar = document.getElementById('enviar');

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = 'aviso ' + (tipo || '');
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  // Validación propia: marcamos en rojo los campos vacíos
  const campos = formulario.querySelectorAll('[required]');
  let hayErrores = false;

  campos.forEach((campo) => {
    const vacio = campo.value.trim() === '';
    campo.classList.toggle('error', vacio);
    if (vacio) hayErrores = true;
  });

  if (hayErrores) {
    mostrarAviso('Completa todos los campos para continuar.', 'fallo');
    return;
  }

  botonEnviar.disabled = true;
  botonEnviar.textContent = 'Enviando...';
  mostrarAviso('');

  try {
    const respuesta = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(formulario)))
    });

    const datos = await respuesta.json();

    if (datos.success) {
      formulario.reset();
      mostrarAviso('Mensaje enviado. Te respondo hoy mismo.', 'exito');
    } else {
      mostrarAviso('No se pudo enviar. Escríbeme por WhatsApp mientras lo reviso.', 'fallo');
    }
  } catch (error) {
    mostrarAviso('Falló la conexión. Revisa tu internet o escríbeme por WhatsApp.', 'fallo');
  } finally {
    botonEnviar.disabled = false;
    botonEnviar.textContent = 'Enviar mensaje';
  }
});

// Quitamos el rojo apenas el visitante empieza a escribir
formulario.querySelectorAll('[required]').forEach((campo) => {
  campo.addEventListener('input', () => campo.classList.remove('error'));
});

/* ---------- 7. MENÚ MÓVIL ---------- */
const menuToggle = document.getElementById('menu-toggle');
const navEnvoltura = document.getElementById('nav-envoltura');

function menuAbierto() {
  return navEnvoltura.classList.contains('abierta');
}

function abrirMenu() {
  navEnvoltura.classList.add('abierta');
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', 'Cerrar menú de navegación');
}

function cerrarMenu() {
  navEnvoltura.classList.remove('abierta');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menú de navegación');
}

menuToggle.addEventListener('click', () => {
  menuAbierto() ? cerrarMenu() : abrirMenu();
});

// Tocar un enlace del menú lo cierra, en vez de dejarlo tapando la página
navEnvoltura.querySelectorAll('a').forEach((enlace) => {
  enlace.addEventListener('click', cerrarMenu);
});

// Tocar fuera del menú también lo cierra
document.addEventListener('click', (evento) => {
  if (!menuAbierto()) return;
  const dentroDelMenu = navEnvoltura.contains(evento.target) || menuToggle.contains(evento.target);
  if (dentroDelMenu) return;
  cerrarMenu();
});

// Esc cierra el menú y devuelve el foco al botón
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && menuAbierto()) {
    cerrarMenu();
    menuToggle.focus();
  }
});
