"""Une los módulos de src/ en un solo HTML autocontenido: dist/index.html."""
import pathlib, re, sys

RAIZ = pathlib.Path(__file__).parent
SRC = RAIZ / 'src'
ORDEN = ['datos_nave.js', 'dialogos.js', 'conocimiento.js', 'datos_base.js', 'motor.js', 'trayecto.js',
         'cinematicas.js', 'minijuegos.js', 'nave.js', 'ui.js', 'asesora.js', 'base_lunar.js',
         'ui_base.js', 'red.js', 'principal.js']

def main():
    plantilla = (SRC / 'plantilla.html').read_text(encoding='utf-8')
    css = (SRC / 'estilo.css').read_text(encoding='utf-8')
    partes = []
    for nombre in ORDEN:
        js = (SRC / nombre).read_text(encoding='utf-8')
        if re.search(r'</script', js, re.I):
            sys.exit(f'{nombre} contiene </script>')
        partes.append(f'/* ===== {nombre} ===== */\n{js}')
    js = '\n'.join(partes)
    html = plantilla.replace('/*CSS*/', css).replace('/*JS*/', js)
    dist = RAIZ / 'dist'
    dist.mkdir(exist_ok=True)
    (dist / 'index.html').write_text(html, encoding='utf-8')
    (dist / 'juego.js').write_text(js, encoding='utf-8')  # para comprobar la sintaxis con node
    print(f'dist/index.html: {len(html.encode("utf-8"))/1024:.0f} KiB')

if __name__ == '__main__':
    main()
