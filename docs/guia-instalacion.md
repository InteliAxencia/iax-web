# Guía de instalación del entorno

Cómo montar el entorno de desarrollo de iax-web desde cero, en Linux o en Windows con WSL2.

Termina cuando puedas clonar, instalar, arrancar el servidor, hacer un commit firmado y verlo verificado.

**Verificado en:** Ubuntu 26.04 con Podman 5.7.0, Git 2.53.0, Node 24.18.0 y pre-commit 4.5.1.

**Pendiente de verificar en WSL2.** El diseño contempla WSL2 y los puntos conflictivos están señalados, pero la guía no se ha ejecutado todavía en esa configuración. Los apartados marcados con "WSL2" son los que más atención requieren.

## 1. Requisitos previos

Se instalan en el anfitrión, no en el contenedor.

| Herramienta  | Para qué                      | Notas                              |
| ------------ | ----------------------------- | ---------------------------------- |
| Git          | Control de versiones          | Se ejecuta siempre en el anfitrión |
| Node por nvm | Ejecutar npm en el anfitrión  | La versión la fija .nvmrc          |
| Podman       | Motor del Dev Container       | Rootless                           |
| VS Code      | Editor                        | Con la extensión Dev Containers    |
| pre-commit   | Hook de detección de secretos | Instala gitleaks por su cuenta     |
| gh           | Cliente de GitHub             | Opcional pero recomendado          |

### WSL2: dónde va el repositorio

El repositorio va en el sistema de archivos de Linux, por ejemplo en ~/dev, **nunca en /mnt/c/**. En /mnt/c el mapeo de usuario del contenedor se comporta de otra forma y los permisos de los archivos se rompen.

### Instalar nvm y Node

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
```

Cierra y abre el terminal. Después, dentro del repositorio ya clonado, nvm lee la versión del archivo .nvmrc:

```bash
nvm install
nvm use
```

### Instalar pre-commit

```bash
sudo apt install pipx
pipx install pre-commit
```

gitleaks no hace falta instalarlo: pre-commit descarga y compila la versión fijada en .pre-commit-config.yaml.

### Instalar gh

El paquete de Ubuntu va varias versiones por detrás y arrastra incompatibilidades con la API de GitHub. Se instala desde el repositorio oficial:

```bash
sudo mkdir -p -m 755 /etc/apt/keyrings
wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null
sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
```

En máquinas con Ubuntu Pro, el repositorio de ESM tiene más prioridad y apt seguiría instalando la versión antigua. Hace falta fijar la preferencia:

```bash
sudo tee /etc/apt/preferences.d/github-cli > /dev/null <<'FIN'
Package: gh
Pin: origin cli.github.com
Pin-Priority: 600
FIN
apt policy gh
sudo apt install gh -y
```

El candidato debe ser la versión de cli.github.com.

## 2. Configuración de máquina

Esto no vive en el repositorio: se hace una vez por máquina y no se versiona. Es el único sitio de la documentación donde aparecen estos comandos.

### Identidad de Git

En un repositorio público, cada commit expone el email del autor. Usa el email noreply de GitHub para no publicar tu dirección real. Lo encuentras en la configuración de tu cuenta, en el apartado de email.

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "NUMERO+usuario@users.noreply.github.com"
```

### Clave SSH y firma de commits

Cada máquina necesita su propia clave. En WSL2, cada instancia cuenta como una máquina distinta.

```bash
ssh-keygen -t ed25519 -C "tu-maquina"
cat ~/.ssh/id_ed25519.pub
```

Esa clave se registra en GitHub **dos veces**: como clave de autenticación y como clave de firma. Son dos entradas separadas en la configuración de la cuenta, y hacen falta las dos.

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

### Otras opciones

```bash
git config --global pull.rebase false
git config --global fetch.prune true
```

La primera evita que un pull distraído rebase por su cuenta, que está prohibido por la política. La segunda limpia las referencias a ramas ya borradas en el servidor.

### Añadir tu clave al archivo de firmantes

Para que el resto del equipo pueda verificar tus firmas, tu clave tiene que estar en .github/allowed_signers. Se añade con un pull request, una línea con este formato:

```text
TU_EMAIL namespaces="git" ssh-ed25519 AAAA... comentario-de-la-maquina
```

### VS Code

Abre la paleta con Ctrl+Shift+P, busca "Preferences: Open User Settings (JSON)" y añade:

```json
"dev.containers.dockerPath": "podman",
"dev.containers.copyGitConfig": false,
"dev.containers.gitCredentialHelperConfigLocation": "none"
```

Los dos últimos son deliberados: impiden que VS Code copie tu identidad de Git y tus credenciales al contenedor. Git se ejecuta en el anfitrión.

**WSL2:** estos ajustes van en los ajustes remotos de WSL, no en los de Windows. Con la ventana conectada a WSL, la paleta ofrece "Remote [WSL]: Open Remote Settings (JSON)".

## 3. Clonar e instalar

```bash
mkdir -p ~/dev && cd ~/dev
git clone git@github.com:InteliAxencia/iax-web.git
cd iax-web
nvm install
npm ci --ignore-scripts
```

Después, dos configuraciones por clon:

```bash
git config --local gpg.ssh.allowedSignersFile .github/allowed_signers
pre-commit install
```

La primera apunta Git al archivo de firmantes del repositorio. La segunda activa el hook: la primera vez descarga y compila gitleaks, lo que puede tardar un par de minutos.

## 4. El Dev Container

En VS Code, con la carpeta del repositorio abierta: Ctrl+Shift+P y "Dev Containers: Reopen in Container".

La primera vez descarga la imagen e instala las dependencias. Cuando termine, la esquina inferior izquierda muestra el nombre del contenedor.

Comprobaciones dentro del contenedor:

```bash
whoami
id -u
node -v
npm -v
```

Esperado: node, 1000, Node en la serie 24 y npm en la 11. Si el usuario sale como root o los archivos aparecen como nobody, el mapeo no ha funcionado; en WSL2, revisa que el repositorio no esté en /mnt/c/.

Commitear dentro del contenedor falla por falta de identidad de Git. Es el comportamiento buscado, no un error.

## 5. Comprobación final

Si estos cinco pasos funcionan, el entorno está montado.

**Uno. Arrancar el servidor.** Desde dentro del contenedor:

```bash
npm run dev
```

Abre localhost:4321 en el navegador del anfitrión. Debe cargar la página.

**Dos. Los tres comandos de la CI.**

```bash
npm run format:check
npm run check
npm run build
```

**Tres. Un commit firmado.** Desde el anfitrión, nunca desde el contenedor:

```bash
git switch -c chore/prueba-entorno
git commit --allow-empty -m "chore: comprueba la firma en esta maquina"
git log --format='%h %G? %s' -1
```

La segunda columna tiene que ser una G. Si sale N, la firma no está activa; si sale E, falta tu clave en el archivo de firmantes.

**Cuatro. Limpiar la prueba.**

```bash
git switch main
git branch -D chore/prueba-entorno
```

**Cinco. Verificar el historial.**

```bash
git log --format='%h %G? %s' --first-parent -8
```

Los commits de fusión creados por GitHub salen con E: van firmados con la clave PGP de GitHub, que no está en el archivo de firmantes. Es lo esperado y no hay que arreglarlo.

## 6. El día a día

Git y los commits van en el anfitrión. El desarrollo, dentro del contenedor.

Antes de abrir un pull request, los tres comandos del paso dos. Es lo mismo que ejecuta la CI.

Los secretos locales van en .dev.vars, copiando .dev.vars.example. Ese archivo está ignorado y nunca se sube. Cada clave nueva tiene que declararse además en el esquema de astro:env en astro.config.mjs.

## 7. Qué hay en el repositorio

| Ruta                 | Qué es                                                     |
| -------------------- | ---------------------------------------------------------- |
| src/                 | El sitio. Fuente de verdad                                 |
| index.html           | Prototipo estático. Referencia visual, pendiente de migrar |
| scripts/check-r1.mjs | Comprobación de R1 para la CI                              |
| wrangler.json        | Configuración de despliegue en Cloudflare                  |
| .devcontainer/       | Definición del Dev Container                               |
| docs/                | Guía, política de Git y decisiones reversibles             |

El sistema de citas es un servicio externo y no forma parte de este repositorio ni del Dev Container. La decisión y su disparador están en docs/decisiones-reversibles.md.

## 8. Pendiente de verificar en WSL2

Cuatro puntos que el diseño contempla pero que nadie ha ejecutado todavía en esa configuración:

1. El Dev Container sobre Podman con el repositorio en el sistema de archivos de Linux.
2. Los ajustes de VS Code en los ajustes remotos de WSL.
3. La clave de firma propia de la instancia, registrada dos veces en GitHub y añadida al archivo de firmantes.
4. La compilación de gitleaks por pre-commit, que necesita red hacia proxy.golang.org.

Quien monte el entorno en WSL2 debería anotar lo que se desvíe de esta guía y corregirla en un pull request.
