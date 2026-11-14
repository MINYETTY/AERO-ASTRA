"""Interacción real: teclado en la nave y toques en la base."""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
RAIZ=pathlib.Path(__file__).resolve().parent.parent;URL=(RAIZ/'dist'/'index.html').as_uri();OUT=RAIZ/'pruebas'/'capturas'
async def main(w,h):
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':w,'height':h});err=[]
        pg.on('pageerror',lambda e:err.append(str(e)));pg.on('console',lambda m:err.append(m.text) if m.type=='error' else None)
        await pg.add_init_script('window.__ORION_TEST=true;');await pg.goto(URL);await pg.wait_for_timeout(400)
        await pg.click('#bSolo');await pg.click('#listaRoles button >> nth=3');await pg.wait_for_timeout(300);await pg.click('#saltar');await pg.wait_for_timeout(600)
        # caminar con teclado: mantener D 0.6 s y comprobar que se movió
        x0=await pg.evaluate('()=>window.__ORION.P.x');await pg.keyboard.down('a');await pg.wait_for_timeout(600);await pg.keyboard.up('a')
        x1=await pg.evaluate('()=>window.__ORION.P.x');print('Movimiento con teclado:',round(x0),'→',round(x1))
        # acercarse al disyuntor (misión 1) y pulsar E
        await pg.evaluate('()=>{const O=window.__ORION,o=O.OBJETOS.find(o=>o.clase==="m"&&o.m.id===1);O.P.x=o.tx*16+8;O.P.y=(o.ty+1)*16+10;}');await pg.wait_for_timeout(300)
        print('Cerca de:',await pg.evaluate('()=>{const c=window.__ORION.JUEGO.cerca;return c&&c.o?c.o.n:null}'),'· pista:',await pg.text_content('#pista'))
        await pg.keyboard.press('e');await pg.wait_for_timeout(300)
        print('Minijuego abierto:',await pg.is_visible('#modal'),await pg.text_content('#mtitulo'))
        # resolver los interruptores en orden haciendo clic
        orden=await pg.evaluate('()=>[...document.querySelectorAll("#mcuerpo .seq b")].map(b=>b.textContent.replace(/^\\d+\\. /,""))')
        for t in orden: await pg.click(f'#mcuerpo .sws .btn:text-is("{t}")')
        await pg.wait_for_timeout(1300);print('Misión 1 hecha:',await pg.evaluate('()=>window.__ORION.JUEGO.hecho[1]'),'· dato visible:',await pg.is_visible('#dlg'))
        await pg.screenshot(path=str(OUT/f'11_dato_{w}.png'));await pg.keyboard.press('Enter');await pg.wait_for_timeout(200)
        print('Diálogo cerrado con Enter:',not await pg.is_visible('#dlg'))
        # hablar con un PNJ
        await pg.evaluate('()=>{const O=window.__ORION,n=O.npcs[1];O.P.x=n.x+10;O.P.y=n.y;}');await pg.wait_for_timeout(200)
        await pg.click('#bUsar');await pg.wait_for_timeout(200);print('Habla un PNJ:',await pg.text_content('#dlgnom'),'—',(await pg.text_content('#dlgtxt'))[:60])
        await pg.click('#dlgok')
        # ventana y bitácora
        await pg.click('#bBitacora');await pg.wait_for_timeout(200);print('Bitácora:',await pg.text_content('#mtitulo'));await pg.click('#mcerrar')
        await pg.click('#bMisiones');await pg.wait_for_timeout(200);print('Lista de misiones, filas:',await pg.evaluate('()=>document.querySelectorAll("#lista li").length'));await pg.click('#bMisiones')
        # menú: exportar código
        await pg.click('#bMenu');await pg.click('#menuExportar');await pg.wait_for_timeout(200);print('Código exportado, longitud:',len(await pg.input_value('#menuCodigo')));await pg.click('#menuSeguir')
        # ---- base: construir con toques ----
        await pg.click('#bMenu');await pg.click('#menuInicio');await pg.click('#bBaseDirecta');await pg.click('#listaRoles button >> nth=3');await pg.wait_for_timeout(300);await pg.click('#saltar');await pg.wait_for_timeout(800)
        await pg.click('#barraBase [data-panel="construir"]');await pg.wait_for_timeout(200);await pg.click('#mcuerpo [data-tipo="taller"]');await pg.wait_for_timeout(200)
        print('Modo construir:',await pg.evaluate('()=>window.__ORION.BaseUI.modo&&window.__ORION.BaseUI.modo.tipo'),'·',await pg.text_content('#barraBase'))
        await pg.screenshot(path=str(OUT/f'12_construir_{w}.png'))
        # tocar la celda de planta 2, columna 3 (en coordenadas de la base)
        await pg.evaluate('()=>{const U=window.__ORION.BaseUI._prueba;U.tocarMundo(10+3*20+10,U.yPlanta(2)+12);}');await pg.wait_for_timeout(300)
        print('Salas:',await pg.evaluate('()=>window.__ORION.JUEGO.base.salas.map(s=>s.tipo+"@"+s.planta+":"+s.col).join(" ")'))
        # tocar una sala de verdad con el ratón
        pos=await pg.evaluate('()=>{const U=window.__ORION.BaseUI._prueba,r=document.getElementById("cv").getBoundingClientRect(),s=window.__ORION.JUEGO.base.salas.find(s=>s.tipo==="control");return [r.left+(U.ox+U.salaX(s)+6)*U.escala,r.top+(U.yPlanta(s.planta)+20-window.__ORION.BaseUI.camY+U.oy)*U.escala]}')
        print('Elemento bajo el clic:',await pg.evaluate(f'()=>{{const e=document.elementFromPoint({pos[0]},{pos[1]});return e?e.id||e.className:null}}'),pos)
        await pg.mouse.click(pos[0],pos[1]+0);await pg.wait_for_timeout(300)
        print('Panel tras clic real:',await pg.text_content('#mtitulo'),'visible:',await pg.is_visible('#modal'))
        if await pg.is_visible('#modal'): await pg.click('#mcerrar')
        await pg.click('#recBase [data-vel="6"]');await pg.wait_for_timeout(1500);print('Velocidad ×6, hora:',await pg.evaluate('()=>Math.round(window.__ORION.JUEGO.base.hora)'))
        await pg.screenshot(path=str(OUT/f'13_base_tiempo_{w}.png'))
        print('ERRORES',err[:6]);await b.close()
asyncio.run(main(*(int(x) for x in (sys.argv[1:3] or [1000,720]))))
