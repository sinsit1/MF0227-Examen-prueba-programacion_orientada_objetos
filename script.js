// =============================
// INICIALIZACIÓN
// =============================

const PAGE_KEY = "mf0227:" + (location.pathname.split("/").pop() || "index.html");

document.addEventListener("DOMContentLoaded", () => {

    iniciarTema();
    iniciarTest();
    iniciarPreguntasCortas();
    iniciarSoluciones();
    iniciarCodigo();
    crearPanelNota();

});


// =============================
// ALMACENAMIENTO (tolerante a fallos)
// =============================

function leer(clave, porDefecto){
    try{
        const valor = localStorage.getItem(PAGE_KEY + ":" + clave);
        return valor === null ? porDefecto : JSON.parse(valor);
    }catch(e){
        return porDefecto;
    }
}

function guardar(clave, valor){
    try{
        localStorage.setItem(PAGE_KEY + ":" + clave, JSON.stringify(valor));
    }catch(e){}
}


// =============================
// TEMA CLARO / OSCURO
// =============================

function iniciarTema(){

    const btn = document.querySelector(".theme-toggle");

    let tema = null;
    try{ tema = localStorage.getItem("mf0227:theme"); }catch(e){}

    if(tema){
        document.documentElement.dataset.theme = tema;
    }

    if(!btn){
        return;
    }

    const esOscuro = () =>
        document.documentElement.dataset.theme === "dark" ||
        (!document.documentElement.dataset.theme &&
         matchMedia("(prefers-color-scheme: dark)").matches);

    const pintar = () => {
        btn.textContent = esOscuro() ? "☀" : "☾";
        btn.title = esOscuro() ? "Modo claro" : "Modo oscuro";
    };

    pintar();

    btn.addEventListener("click", () => {
        const nuevo = esOscuro() ? "light" : "dark";
        document.documentElement.dataset.theme = nuevo;
        try{ localStorage.setItem("mf0227:theme", nuevo); }catch(e){}
        pintar();
    });

}


// =============================
// TEST
// =============================

let questions = [];
let respuestas = {};

function iniciarTest(){

    questions = Array.from(document.querySelectorAll(".question"));

    if(questions.length === 0){
        return;
    }

    respuestas = leer("test", {});

    questions.forEach((question, qi) => {

        question.id = question.id || "pregunta-" + (qi + 1);

        const answers = question.querySelectorAll(".answer");

        answers.forEach((answer, ai) => {

            answer.dataset.letter = "ABCDEFGH"[ai];

            answer.addEventListener("click", () => {

                if(question.classList.contains("answered")){
                    return;
                }

                respuestas[qi] = ai;
                guardar("test", respuestas);

                corregirPregunta(question, ai);
                actualizarNota();

            });

        });

        if(respuestas[qi] !== undefined){
            corregirPregunta(question, respuestas[qi]);
        }

    });

}

function corregirPregunta(question, elegida){

    const answers = question.querySelectorAll(".answer");
    const result = question.querySelector(".result");
    const answer = answers[elegida];

    if(!answer){
        return;
    }

    question.classList.add("answered");

    answers.forEach(btn => {
        btn.disabled = true;
        if(btn.classList.contains("correct")){
            btn.classList.add("show-correct");
        }
    });

    if(answer.classList.contains("correct")){
        question.classList.add("is-correct");
        result.textContent = "✔ Respuesta correcta";
        result.className = "result ok";
    }else{
        answer.classList.add("show-wrong");
        question.classList.add("is-wrong");
        result.textContent = "✘ Incorrecta. La respuesta correcta está marcada en verde.";
        result.className = "result ko";
    }

}

function reiniciarTest(){

    if(!confirm("¿Seguro que quieres borrar tus respuestas del test?")){
        return;
    }

    respuestas = {};
    guardar("test", respuestas);

    questions.forEach(question => {
        question.classList.remove("answered", "is-correct", "is-wrong");
        question.querySelectorAll(".answer").forEach(btn => {
            btn.disabled = false;
            btn.classList.remove("show-correct", "show-wrong");
        });
        const result = question.querySelector(".result");
        result.textContent = "";
        result.className = "result";
    });

    actualizarNota();
    questions[0].scrollIntoView({ behavior:"smooth", block:"center" });

}

function irASiguientePendiente(){

    const pendiente = questions.find(q => !q.classList.contains("answered"));

    if(pendiente){
        pendiente.scrollIntoView({ behavior:"smooth", block:"center" });
        pendiente.querySelector(".answer").focus({ preventScroll:true });
    }

}


// =============================
// PANEL DE NOTA
// =============================

function crearPanelNota(){

    if(questions.length === 0){
        return;
    }

    const panel = document.createElement("aside");
    panel.id = "score-panel";
    panel.setAttribute("aria-live", "polite");
    panel.innerHTML = `
        <div class="score-head">
            <h3>Nota del test</h3>
            <div id="score-grade">–</div>
        </div>
        <div class="progress" aria-hidden="true">
            <div class="bar-ok" style="width:0"></div>
            <div class="bar-ko" style="width:0"></div>
        </div>
        <div id="score-text"></div>
        <div class="score-actions">
            <button type="button" class="btn btn-ghost" data-action="next">Siguiente</button>
            <button type="button" class="btn btn-ghost" data-action="reset">Reiniciar</button>
        </div>
    `;

    document.body.appendChild(panel);

    panel.querySelector('[data-action="next"]').addEventListener("click", irASiguientePendiente);
    panel.querySelector('[data-action="reset"]').addEventListener("click", reiniciarTest);

    actualizarNota();

}

function actualizarNota(){

    const panel = document.getElementById("score-panel");

    if(!panel){
        return;
    }

    const total = questions.length;
    const respondidas = questions.filter(q => q.classList.contains("answered")).length;
    const aciertos = questions.filter(q => q.classList.contains("is-correct")).length;
    const fallos = respondidas - aciertos;

    const nota = (aciertos / total) * 10;
    const grade = document.getElementById("score-grade");

    grade.textContent = respondidas ? nota.toFixed(1) : "–";
    grade.className = respondidas === total ? (nota >= 5 ? "pass" : "fail") : "";

    panel.querySelector(".bar-ok").style.width = (aciertos / total * 100) + "%";
    panel.querySelector(".bar-ko").style.width = (fallos / total * 100) + "%";

    document.getElementById("score-text").textContent =
        respondidas === total
        ? `¡Terminado! ${aciertos} aciertos y ${fallos} fallos de ${total}.`
        : `${respondidas} de ${total} respondidas · ${aciertos} aciertos`;

    panel.querySelector('[data-action="next"]').disabled = respondidas === total;
    panel.querySelector('[data-action="next"]').style.opacity = respondidas === total ? .4 : 1;

}


// =============================
// PREGUNTAS CORTAS
// =============================

function iniciarPreguntasCortas(){

    const textos = leer("cortas", {});

    document.querySelectorAll(".short-question").forEach((bloque, i) => {

        const textarea = bloque.querySelector("textarea");
        const btn = bloque.querySelector(".check-btn");
        const feedback = bloque.querySelector(".feedback");

        if(textarea){
            if(!textarea.placeholder){
                textarea.placeholder = "Escribe tu respuesta y después compárala con la respuesta modelo…";
            }
            if(textos[i]){
                textarea.value = textos[i];
            }
            textarea.addEventListener("input", () => {
                textos[i] = textarea.value;
                guardar("cortas", textos);
            });
        }

        if(btn && feedback){
            btn.textContent = "Ver respuesta modelo";
            conmutar(btn, feedback, "Ver respuesta modelo", "Ocultar respuesta modelo");
        }

    });

}


// =============================
// SOLUCIONES PRÁCTICAS
// =============================

function iniciarSoluciones(){

    const pares = [];

    document.querySelectorAll(".solution-btn").forEach(btn => {

        const bloque = btn.parentElement.querySelector(".solution");

        if(!bloque){
            return;
        }

        pares.push([btn, bloque]);
        conmutar(btn, bloque, "Ver solución", "Ocultar solución");

    });

    // Botón "mostrar / ocultar todas" en cada sección que tenga soluciones
    document.querySelectorAll("[data-toggle-all]").forEach(boton => {

        const seccion = boton.closest("section") || document;
        const propios = pares.filter(([, b]) => seccion.contains(b));

        boton.addEventListener("click", () => {
            const abrir = propios.some(([, b]) => !b.classList.contains("open"));
            propios.forEach(([btn, b]) => {
                if(b.classList.contains("open") !== abrir){
                    btn.click();
                }
            });
            boton.textContent = abrir ? "Ocultar todas" : "Mostrar todas";
        });

    });

}

function conmutar(btn, bloque, textoAbrir, textoCerrar){

    btn.setAttribute("aria-expanded", "false");

    btn.addEventListener("click", () => {
        const abierto = bloque.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(abierto));
        btn.textContent = abierto ? textoCerrar : textoAbrir;
    });

}


// =============================
// BLOQUES DE CÓDIGO
// =============================

function iniciarCodigo(){

    document.querySelectorAll("pre").forEach(pre => {

        // Quita saltos de línea sobrantes al principio y al final
        pre.textContent = pre.textContent.replace(/^\s*\n/, "").replace(/\s+$/, "");

        const wrap = document.createElement("div");
        wrap.className = "code-wrap";
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);

        const copy = document.createElement("button");
        copy.type = "button";
        copy.className = "copy-btn";
        copy.textContent = "Copiar";
        wrap.appendChild(copy);

        copy.addEventListener("click", async () => {
            try{
                await navigator.clipboard.writeText(pre.textContent);
                copy.textContent = "¡Copiado!";
            }catch(e){
                copy.textContent = "No se pudo copiar";
            }
            setTimeout(() => copy.textContent = "Copiar", 1500);
        });

    });

}
