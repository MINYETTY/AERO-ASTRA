"""Pruebas automáticas de Misión Orión v2 en Chrome sin pantalla.
Uso: python3 pruebas/prueba_juego.py [ancho alto]"""
import sys, json, asyncio, pathlib
from playwright.async_api import async_playwright

RAIZ = pathlib.Path(__file__).resolve().parent.parent
URL = (RAIZ / 'dist' / 'index.html').as_uri()
OUT = RAIZ / 'pruebas' / 'capturas'
OUT.mkdir(exist_ok=True)

async def main(w=1100, h=760):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': w, 'height': h})
        errores = []
        pg.on('console', lambda m: errores.append('consola: ' + m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errores.append('página: ' + str(e)))
        await pg.add_init_script('window.__ORION_TEST=true;')
        await pg.goto(URL)
        await pg.wait_for_timeout(600)
        await pg.screenshot(path=str(OUT / f'01_inicio_{w}.png'))

        # --- datos ---
        datos = await pg.evaluate('''()=>{const O=window.__ORION;
          return {misiones:O.MISIONES.length,conDato:O.MISIONES.filter(m=>m.dato&&m.f&&m.f.length).length,
          sinFuente:O.MISIONES.filter(m=>!m.f||!m.f.length).map(m=>m.n),
          lineas:[0,1,2,3].map(r=>O.Dialogo.total(r)),charlas:O.CHARLAS.length,conocimiento:O.CONOCIMIENTO.length,
          minijuegos:[...new Set(O.MISIONES.map(m=>m.mg))].length,
          fuentesRotas:O.MISIONES.flatMap(m=>m.f).filter(k=>!FUENTES[k]),
          fuentesConoc:O.CONOCIMIENTO.flatMap(e=>e.f).filter(k=>!FUENTES[k])}}''')
        print('DATOS', json.dumps(datos, ensure_ascii=False))

        # --- empezar: un jugador, Comandante ---
        await pg.click('#bSolo')
        await pg.wait_for_timeout(200)
        await pg.screenshot(path=str(OUT / f'02_roles_{w}.png'))
        await pg.click('#listaRoles button >> nth=0')
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=str(OUT / f'03_intro_{w}.png'))
        await pg.click('#saltar')
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path=str(OUT / f'04_nave_{w}.png'))

        # --- alcanzabilidad de todos los objetos desde cada casa ---
        alc = await pg.evaluate('''()=>{const O=window.__ORION,mal=[];
          for(const r of O.ROLES){const sx=r.home[0],sy=r.home[1];
            for(const o of O.OBJETOS){const metas=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>[o.tx+dx,o.ty+dy]).filter(([x,y])=>O.transitable(x,y));
              if(!metas.length){mal.push(o.n+' sin acceso');continue;}
              const c=O.bfs(sx,sy,metas);if(c===null&&!metas.some(([x,y])=>x===sx&&y===sy))mal.push(r.n+' → '+o.n);}}
          return [...new Set(mal)];}''')
        print('INALCANZABLES', alc)

        # --- abrir y cerrar todos los minijuegos (misiones y eventos) ---
        mg = await pg.evaluate('''async()=>{const O=window.__ORION,res=[];
          const lista=[...O.MISIONES.map(m=>[m.n,m.mg,m.o]),...EVENTOS_NAVE.map(e=>['ev '+e.n,e.mg,e.o])];
          for(const [n,mg,o] of lista){try{O.UI.minijuego(n,mg,o,()=>{});await new Promise(r=>setTimeout(r,120));
            const vacio=document.getElementById('mcuerpo').innerHTML.length<40;O.UI.cerrarModal();if(vacio)res.push(n+': vacío');}catch(e){res.push(n+': '+e.message);}}
          return res;}''')
        print('MINIJUEGOS con problemas', mg)
        await pg.evaluate('''()=>{const O=window.__ORION;O.UI.minijuego('PRUEBA','gonogo',{},()=>{});}''')
        await pg.wait_for_timeout(200)
        await pg.screenshot(path=str(OUT / f'05_minijuego_{w}.png'))
        await pg.evaluate('()=>window.__ORION.UI.cerrarModal()')

        # --- un minijuego jugado de verdad: interruptores ---
        ok_int = await pg.evaluate('''async()=>{const O=window.__ORION;let gano=false;
          O.UI.minijuego('T','interruptores',{items:['A','B','C']},()=>{gano=true;});
          await new Promise(r=>setTimeout(r,50));
          for(const t of ['A','B','C']){[...document.querySelectorAll('#mcuerpo .sws .btn')].find(b=>b.textContent===t).click();}
          await new Promise(r=>setTimeout(r,1000));return gano;}''')
        print('INTERRUPTORES gana:', ok_int)

        # --- asesora ---
        ase = await pg.evaluate('''()=>{const A=window.__ORION.Asesora;const q=['¿Qué es el SLS?','cuanto dura la noche en la luna','agujero negro','quién fue Gagarin','receta de pizza','¿Cuándo fue el Apolo 11?'];
          return q.map(x=>{const r=A.buscar(x);return [x,r.mejor?r.mejor.id:null];});}''')
        print('ASESORA', ase)
        await pg.evaluate('()=>window.__ORION.Asesora.abrir()')
        await pg.wait_for_timeout(300)
        await pg.click('#aSug .sug >> nth=0')
        await pg.wait_for_timeout(2600)
        await pg.screenshot(path=str(OUT / f'06_asesora_{w}.png'))
        await pg.fill('#aCampo', 'receta de pizza')
        await pg.click('#aEnviar')
        await pg.wait_for_timeout(2600)
        txt = await pg.text_content('#aTexto')
        print('ASESORA sin dato →', txt[:80])
        await pg.click('#aCerrar')

        # --- diálogo con un PNJ ---
        dlg = await pg.evaluate('''()=>{const O=window.__ORION;const ls=new Set();for(let i=0;i<12;i++)ls.add(O.Dialogo.linea(1));return ls.size;}''')
        print('Líneas distintas en 12 peticiones (Piloto):', dlg)

        # --- recorrido completo del acto 1 (simulado) ---
        rec = await pg.evaluate('''async()=>{const O=window.__ORION,J=O.JUEGO,log=[];
          const espera=ms=>new Promise(r=>setTimeout(r,ms));
          for(let paso=0;paso<400;paso++){
            if(J.acto===2)break;
            if(document.getElementById('cine').hidden===false){document.getElementById('saltar').click();await espera(30);continue;}
            if(!document.getElementById('dlg').hidden)O.UI.cerrarDialogo();
            if(!document.getElementById('modal').hidden)O.UI.cerrarModal();
            if(J.evento){O.Nave.resolverEvento('yo');O.UI.cerrarDialogo();}
            const f=O.Nave.faseActual();
            const m=O.MISIONES.find(x=>!J.hecho[x.id]&&x.fase<=f&&x.fase<6&&x.req.every(i=>J.hecho[i]));
            if(m){O.Nave.completar(m.id,m.rol===J.rol?'yo':'npc');log.push(m.id);}
            await espera(60);
          }
          await espera(500);
          return {acto:J.acto,hechos:J.hecho.filter(Boolean).length,met:J.met,orden:log.join(','),base:!!J.base};}''')
        print('ACTO 1 →', rec)
        await pg.wait_for_timeout(1500)
        for _ in range(5):
            if await pg.is_visible('#cine'):
                await pg.click('#saltar'); await pg.wait_for_timeout(300)
        await pg.evaluate('()=>{const O=window.__ORION;if(!document.getElementById("dlg").hidden)O.UI.cerrarDialogo();}')
        await pg.wait_for_timeout(800)
        await pg.screenshot(path=str(OUT / f'07_base_{w}.png'))

        # --- acto 2: acciones y simulación ---
        base = await pg.evaluate('''async()=>{const O=window.__ORION,J=O.JUEGO,B=O.BaseLunar,log=[];
          const acc=a=>{const r=B.accion(a,J.rol);log.push(a.t+':'+(r.ok?'ok':r.msg));return r;};
          if(!J.base)return 'sin base';
          acc({t:'construir',tipo:'agua_o2',planta:1,col:2});
          acc({t:'construir',tipo:'invernadero',planta:2,col:6});
          acc({t:'construir',tipo:'laboratorio',planta:2,col:3});
          acc({t:'excavar'});
          const lib=J.base.trip;acc({t:'asignar',trip:lib[2].id,sala:J.base.salas.find(s=>s.tipo==='agua_o2').id});
          for(let h=0;h<300;h++)B.paso(1);
          return {log,hora:J.base.hora,recursos:J.base.recursos,trip:J.base.trip.length,salas:J.base.salas.length,obj:B.objetivos().filter(o=>o.hecho).map(o=>o.id),registro:J.base.log.slice(-6).map(l=>l.msg)};}''')
        print('BASE →', json.dumps(base, ensure_ascii=False)[:1500])
        await pg.wait_for_timeout(500)
        await pg.screenshot(path=str(OUT / f'08_base_construida_{w}.png'))
        # abrir cada panel
        pan = await pg.evaluate('''async()=>{const O=window.__ORION,res=[];for(const p of ['construir','trip','inv','rover','prio','informe']){try{O.BaseUI.abrirPanel({tipo:p});await new Promise(r=>setTimeout(r,150));res.push(p+':'+document.getElementById('mcuerpo').innerHTML.length);}catch(e){res.push(p+' ERROR '+e.message);}}
          const s=O.JUEGO.base.salas[0];O.BaseUI.abrirPanel({tipo:'sala',id:s.id});await new Promise(r=>setTimeout(r,150));res.push('sala:'+document.getElementById('mcuerpo').innerHTML.length);return res;}''')
        print('PANELES', pan)
        await pg.screenshot(path=str(OUT / f'09_panel_sala_{w}.png'))
        await pg.evaluate('()=>window.__ORION.UI.cerrarModal()')

        # --- guardar y cargar ---
        gc = await pg.evaluate('''()=>{const O=window.__ORION;const e=O.Principal.estado();const c=O.codificar(e);const d=O.decodificar(c);
          const antes=JSON.stringify(O.JUEGO.base.salas);const ok=O.Principal.cargar(d);return {ok,len:c.length,igual:JSON.stringify(O.JUEGO.base.salas)===antes,acto:O.JUEGO.acto};}''')
        print('GUARDAR/CARGAR', gc)
        await pg.wait_for_timeout(400)
        print('ERRORES', errores[:20])
        await b.close()

if __name__ == '__main__':
    a = [int(x) for x in sys.argv[1:3]] or [1100, 760]
    asyncio.run(main(*a))
