#!/bin/sh
# Hook de pre-commit: el commit solo sale si el correo del autor y el del
# committer estan en .github/allowed_signers.
#
# Motivo: entre el 19 de octubre y el 5 de noviembre de 2026 entraron en main
# 40 commits con la identidad de ejemplo de Git (WEBIAX-93). La firma era
# valida, pero GitHub no podia asociarla a ninguna cuenta.
#
# En sh y no en Node porque se ejecuta en el host, donde Node puede no estar
# en el PATH, por ejemplo si se instalo con nvm.
set -eu

LISTA=.github/allowed_signers

if [ ! -f "$LISTA" ]; then
  echo "Falta $LISTA: no se puede comprobar la identidad del commit." >&2
  exit 1
fi

# git var devuelve la identidad que Git va a usar de verdad, incluidas las
# variables de entorno GIT_AUTHOR_EMAIL y GIT_COMMITTER_EMAIL.
correo() {
  git var "$1" 2>/dev/null | sed -n 's/.*<\(.*\)>.*/\1/p'
}

AUTOR=$(correo GIT_AUTHOR_IDENT)
COMMITTER=$(correo GIT_COMMITTER_IDENT)
ADMITIDOS=$(grep -v -e '^[[:space:]]*#' -e '^[[:space:]]*$' "$LISTA" | cut -d' ' -f1)

comprobar() {
  if printf '%s\n' "$ADMITIDOS" | grep -qxF -- "$2"; then
    return 0
  fi
  echo "El commit saldria con el correo de $1 \"${2:-sin definir}\", que no esta en $LISTA." >&2
  return 1
}

estado=0
comprobar autor "$AUTOR" || estado=1
comprobar committer "$COMMITTER" || estado=1

if [ "$estado" -ne 0 ]; then
  echo "Correos admitidos:" >&2
  printf '  %s\n' $ADMITIDOS >&2
  echo "Revisa git config --global user.email en el host." >&2
fi
exit "$estado"
