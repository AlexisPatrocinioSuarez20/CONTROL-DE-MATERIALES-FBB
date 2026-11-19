# Control General de Materiales FBB Dept.

Página web pública para el stock por almacén, la comparación de almacenes y el calendario de entregas.

- **Cualquier persona** con el link puede ver la página, tenga o no cuenta.
- **Solo el equipo FBB** (correos autorizados) puede registrar entregas, fijar mínimos y cargar reportes.
- El stock se actualiza **solo**: un script de Python descarga el reporte del WMS con Selenium y lo sube.

```
index.html              ← la página web
config.js               ← conexión a la base de datos (URL y anon key de Supabase)
supabase_schema.sql     ← crea las tablas y los permisos
script/
  actualizar_stock.py   ← descarga del WMS + subida automática
  requirements.txt      ← librerías de Python
  .env.example          ← plantilla de credenciales (copiar como .env)
  ejecutar_actualizacion.bat ← para el Programador de tareas de Windows
```

Cómo encaja todo:

```
 PC en la red Viettel                     Internet
 ┌──────────────────────┐   sube corte   ┌──────────────┐   lee datos   ┌──────────────────┐
 │ actualizar_stock.py  │ ─────────────▶ │   Supabase   │ ◀──────────── │  GitHub Pages    │
 │ (Selenium → WMS)     │                │ (base datos) │ ───────────▶  │  index.html      │ ◀── cualquier persona
 └──────────────────────┘                └──────────────┘  equipo edita └──────────────────┘
```

---

## Paso 1 — Base de datos en Supabase (gratis)

1. Crea una cuenta en <https://supabase.com> y luego un proyecto nuevo (**New project**). Elige la región más cercana (por ejemplo, São Paulo) y guarda la contraseña de la base de datos.
2. Ve a **SQL Editor → New query**, pega todo el contenido de `supabase_schema.sql` y pulsa **Run**.
3. **Bloquea los registros públicos:** en **Authentication → Sign In / Providers**, desactiva *Allow new users to sign up*. Así nadie puede crearse una cuenta por su cuenta.
4. **Crea los usuarios del equipo:** en **Authentication → Users → Add user → Create new user**, ingresa el correo y la contraseña y marca *Auto Confirm User*. Crea también un usuario **robot** para el script (por ejemplo, `robot.fbb@tu-dominio.com`).
5. **Autoriza esos correos para editar:** en **SQL Editor** ejecuta:
   ```sql
   insert into public.equipo (email, nombre) values
     ('tu.correo@bitel.com.pe', 'Tu nombre'),
     ('robot.fbb@tu-dominio.com', 'Script de actualización');
   ```
   Para dar acceso a alguien más adelante: crea su usuario (punto 4) y agrega su correo aquí.
6. En **Project Settings → API** copia el **Project URL** y la **anon public key**. Pégalos en `config.js`.

> La *anon key* puede ser pública: solo permite leer. Las escrituras las bloquean las reglas de seguridad salvo para los correos de la tabla `equipo`. **Nunca** pongas en la página la *service_role key*.

## Paso 2 — Publicar la página en GitHub Pages (gratis)

1. Crea una cuenta en <https://github.com> y un repositorio **público** nuevo, por ejemplo `control-materiales-fbb`.
2. Sube `index.html` y `config.js` (con tus valores de Supabase). Puedes subir también la carpeta `script/`, **pero nunca el archivo `.env`** (el `.gitignore` ya lo excluye).
3. Ve a **Settings → Pages → Build and deployment**, elige *Deploy from a branch*, rama `main`, carpeta `/ (root)`, y pulsa **Save**.
4. En 1 o 2 minutos la página estará en `https://TU-USUARIO.github.io/control-materiales-fbb/`. Ese es el link para compartir.

Si se abre sin Supabase configurado, la página muestra "Modo demo" y no guarda nada.

## Paso 3 — Script de actualización automática

Debe ejecutarse en una **PC conectada a la red de Viettel**, porque el WMS (10.121.6.132) no es accesible desde internet.

1. Instala Python 3.10 o superior (<https://www.python.org>; marca *Add Python to PATH*) y Google Chrome.
2. En una terminal, dentro de la carpeta `script`:
   ```bash
   pip install -r requirements.txt
   copy .env.example .env      # en Mac/Linux: cp .env.example .env
   ```
3. Abre `.env` y completa el usuario y la clave del WMS, la URL y la anon key de Supabase, y el correo y la clave del robot.
4. **Primera carga** (con el Excel que ya tienes):
   ```bash
   python actualizar_stock.py --archivo "C:\ruta\Bao_cao_tong_hop_ton_kho_16_11_2026.xls"
   ```
5. **Configura los clics de Selenium.** Abre `actualizar_stock.py` y edita `PASOS_NAVEGACION`: es la lista de clics que haces a mano después del login, en orden. Para sacar el selector de cada botón o menú: en Chrome pulsa F12, haz clic derecho sobre el elemento en el panel *Elements* y elige **Copy → Copy XPath**. Prueba solo la descarga, con la ventana visible:
   ```bash
   python actualizar_stock.py --solo-descargar
   ```
   Si falla, el script guarda una captura `error_*.png` en `script/descargas/` que muestra dónde se detuvo. Si el login no encuentra los campos, ajusta `SEL_USUARIO`, `SEL_CLAVE` y `SEL_ENTRAR` en `.env`.
6. **Prueba completa:** `python actualizar_stock.py`. La página web se actualiza sola en unos segundos.
7. **Prográmalo** con el *Programador de tareas* de Windows: **Crear tarea básica → Diaria** (o varias veces al día) **→ Iniciar un programa →** `ejecutar_actualizacion.bat`. La PC debe estar encendida y conectada a la red Viettel a esa hora. El registro de cada ejecución queda en `script/actualizar_stock.log`.

> Si el login de Viettel pide captcha o un código OTP, Selenium no podrá completarlo solo. En ese caso usa la descarga manual y `--archivo`, o avísame y buscamos otra forma.

## Uso diario

- **Ver:** cualquiera abre el link.
- **Editar:** botón **Acceso equipo** (abajo a la izquierda), con el correo y la contraseña creados en Supabase.
- **Mínimos de stock:** en **Stock**, abre un material y escribe su mínimo. Las alertas aparecen en **Resumen**.
- **Carga manual:** en **Actualizar stock** se puede arrastrar el Excel, por si el script falla.
- **Descargar Excel:** botón en **Stock** (respeta los filtros aplicados).

## Seguridad y avisos

- La página es **pública**: cualquiera con el link ve el inventario y las entregas. Confirma con tu área que eso está permitido.
- El `.env` contiene la contraseña del WMS: guárdalo solo en esa PC y no lo compartas.
- Los proyectos gratuitos de Supabase pueden pausarse si pasan varios días sin actividad. El script diario lo mantiene activo; si se pausa, se reactiva desde el panel de Supabase.

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| La página dice "Modo demo" | Falta completar `config.js` con la URL y la anon key. |
| "Tu cuenta no tiene permiso para modificar datos" | Agrega ese correo a la tabla `equipo` (Paso 1.5). |
| El script dice "Supabase rechazó el corte" | El correo del robot no está en `equipo`, o su contraseña en `.env` es incorrecta. |
| Selenium no encuentra un botón | Ajusta el XPath de ese paso en `PASOS_NAVEGACION` o aumenta `ESPERA_ENTRE_PASOS`. |
| No aparecen los cambios | Recarga la página. Revisa en Supabase → Database → Replication que las tablas tengan *Realtime* activo. |
