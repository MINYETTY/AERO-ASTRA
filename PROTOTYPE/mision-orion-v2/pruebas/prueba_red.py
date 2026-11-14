"""Prueba del multijugador con dos páginas y una sala simulada (pruebas/mock_sala.js)."""
import asyncio, json, pathlib, subprocess, time
from playwright.async_api import async_playwright
RAIZ=pathlib.Path(__file__).resolve().parent.parent
MOCK=(RAIZ/'pruebas'/'mock_sala.js').read_text(encoding='utf-8')
async def main():
    srv=subprocess.Popen(['python3','-m','http.server','8765','--bind','127.0.0.1'],cwd=RAIZ/'dist',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.8)
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
            ctx=await b.new_context(viewport={'width':900,'height':700})
            err={'A':[],'B':[]}
            async def pagina(n):
                pg=await ctx.new_page();pg.on('pageerror',lambda e:err[n].append(str(e)));pg.on('console',lambda m:err[n].append(m.text) if m.type=='error' else None)
                await pg.add_init_script('window.__ORION_TEST=true;'+MOCK);await pg.goto('http://127.0.0.1:8765/index.html');await pg.wait_for_timeout(400);return pg
            A=await pagina('A');B=await pagina('B')
            for pg,rol in ((A,0),):
                await pg.click('#bEnLinea');await pg.fill('#codigoNave','prueba');await pg.click('#bConectar');await pg.wait_for_timeout(1200)
                await pg.click(f'#listaRoles button >> nth={rol}');await pg.wait_for_timeout(300);await pg.click('#saltar')
            await A.wait_for_timeout(500)
            await B.click('#bEnLinea');await B.fill('#codigoNave','prueba');await B.click('#bConectar');await B.wait_for_timeout(1500)
            ocupado=await B.evaluate('()=>[...document.querySelectorAll("#listaRoles button")].map(b=>b.disabled)')
            print('Roles ocupados vistos por B:',ocupado)
            await B.click('#listaRoles button >> nth=3');await B.wait_for_timeout(300);await B.click('#saltar')
            await A.wait_for_timeout(4000)
            est=lambda pg:pg.evaluate('()=>{const O=window.__ORION;return {anf:O.Red.esAnfitrion(),pares:O.Red.pares().map(p=>p.r),met:Math.round(O.JUEGO.met),npcs:O.npcs.filter(n=>!O.Red.pares().some(p=>p.r===n.rol)&&n.rol!==O.JUEGO.rol).map(n=>[n.rol,Math.round(n.x),Math.round(n.y)]),tam:O.Red.tam}}')
            print('A:',await est(A));print('B:',await est(B))
            await B.evaluate('()=>window.__ORION.Nave.completar(1,"yo")');await A.wait_for_timeout(1500)
            print('A ve la misión 1 de B:',await A.evaluate('()=>window.__ORION.JUEGO.hecho[1]'))
            await A.evaluate('()=>window.__ORION.Nave.lanzarEvento("ventilador")');await B.wait_for_timeout(1500)
            print('B recibe el evento:',await B.evaluate('()=>window.__ORION.JUEGO.evento&&window.__ORION.JUEGO.evento.id'))
            await B.evaluate('()=>{window.__ORION.Nave.resolverEvento("yo");window.__ORION.UI.cerrarDialogo();}');await A.wait_for_timeout(1500)
            print('A tras resolverlo B:',await A.evaluate('()=>window.__ORION.JUEGO.evento'))
            # saltar al acto 2 desde el anfitrión
            await A.evaluate('()=>{const O=window.__ORION;const s=O.MISIONES.map(m=>m.fase<6?"1":"0").join("");O.Nave.aplicarHechoRemoto(s,true);}')
            await A.wait_for_timeout(3000)
            print('Actos A/B:',await A.evaluate('()=>window.__ORION.JUEGO.acto'),await B.evaluate('()=>window.__ORION.JUEGO.acto'))
            # B (Ingeniero) construye; A (Comandante) intenta construir; B intenta fijar prioridad
            await B.evaluate('()=>window.__ORION.BaseUI.hacer({t:"construir",tipo:"taller",planta:1,col:2},r=>window.__resB=r)')
            await A.evaluate('()=>window.__ORION.BaseUI.hacer({t:"construir",tipo:"almacen",planta:2,col:2},r=>window.__resA=r)')
            await B.evaluate('()=>window.__ORION.BaseUI.hacer({t:"prioridad",p:"ciencia"},r=>window.__resB2=r)')
            await A.wait_for_timeout(2500)
            print('B construir →',await B.evaluate('()=>window.__resB'));print('A construir →',await A.evaluate('()=>window.__resA'));print('B prioridad →',await B.evaluate('()=>window.__resB2'))
            print('Salas en A:',await A.evaluate('()=>window.__ORION.JUEGO.base.salas.map(s=>s.tipo).join(",")'))
            print('Salas en B:',await B.evaluate('()=>window.__ORION.JUEGO.base.salas.map(s=>s.tipo).join(",")'))
            print('Hora A/B:',await A.evaluate('()=>Math.round(window.__ORION.JUEGO.base.hora)'),await B.evaluate('()=>Math.round(window.__ORION.JUEGO.base.hora)'))
            print('Presencia máx. A/B (bytes):',await A.evaluate('()=>window.__maxPres'),await B.evaluate('()=>window.__maxPres'),'excesos',await A.evaluate('()=>window.__excesos||0'))
            # anfitrión se va: B debe tomar el relevo
            await A.close(run_before_unload=True);await B.wait_for_timeout(4500)
            print('B es anfitrión tras irse A:',await B.evaluate('()=>window.__ORION.Red.esAnfitrion()'),'hora sigue:',await B.evaluate('()=>Math.round(window.__ORION.JUEGO.base.hora)'))
            await B.screenshot(path=str(RAIZ/'pruebas'/'capturas'/'10_red_B.png'))
            print('ERRORES',{k:v[:5] for k,v in err.items()})
            await b.close()
    finally: srv.terminate()
asyncio.run(main())
