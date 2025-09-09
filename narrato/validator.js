const fs = require('fs');

function validateStory(storyFilePath) {
    let storyData;
    try {
        const fileContent = fs.readFileSync(storyFilePath, 'utf-8');
        storyData = JSON.parse(fileContent);
    } catch (error) {
        console.error(`Chyba při čtení nebo parsování JSON souboru: ${error.message}`);
        return false;
    }

    const { startNode, nodes } = storyData;
    const errors = [];
    const warnings = [];

    if (!startNode || typeof startNode !== 'string') {
        errors.push("JSON soubor musí obsahovat vlastnost 'startNode' (string).");
    }
    if (!nodes || typeof nodes !== 'object' || Array.isArray(nodes)) {
        errors.push("JSON soubor musí obsahovat vlastnost 'nodes' (objekt).");
    }

    if (errors.length > 0) {
        errors.forEach(err => console.error(`- ${err}`));
        return false;
    }

    if (!nodes[startNode]) {
        errors.push(`Startovní uzel "${startNode}" definovaný v 'startNode' neexistuje v objektu 'nodes'.`);
    }

    const allReachableNodes = new Set();
    const pathStack = []; // Pro detekci cyklů: ukládá uzly v aktuální cestě rekurze
    const fullyProcessedNodes = new Set(); // Uzly, jejichž potomci byli plně prozkoumáni

    function dfsValidate(nodeId) {
        allReachableNodes.add(nodeId);
        pathStack.push(nodeId);

        const node = nodes[nodeId];

        if (!node) {
            errors.push(`Odkazovaný uzel "${nodeId}" není definován v 'nodes'.`);
            pathStack.pop();
            return;
        }

        if (node.is_ending === true) {
            if (node.choices && Array.isArray(node.choices) && node.choices.length > 0) {
                warnings.push(`Uzel "${nodeId}" je označen jako koncový (is_ending: true), ale má definované volby.`);
            }
            // Úspěšný konec cesty
            pathStack.pop();
            fullyProcessedNodes.add(nodeId);
            return;
        }

        // Pokud není koncový, musí mít volby
        if (!node.choices || !Array.isArray(node.choices) || node.choices.length === 0) {
            errors.push(`Uzel "${nodeId}" není koncový, ale nemá žádné volby (slepá ulička).`);
            pathStack.pop();
            fullyProcessedNodes.add(nodeId); // Označit jako zpracovaný, i když s chybou
            return;
        }

        for (let i = 0; i < node.choices.length; i++) {
            const choice = node.choices[i];
            if (!choice.next_node_id || typeof choice.next_node_id !== 'string') {
                errors.push(`Volba ${i+1} ("${choice.choice_text || 'Bezejmenná volba'}") v uzlu "${nodeId}" nemá platný 'next_node_id'.`);
                continue;
            }

            if (pathStack.includes(choice.next_node_id)) {
                errors.push(`Detekován cyklus: Cesta [${pathStack.join(' -> ')} -> ${choice.next_node_id}]`);
                // Pokračujeme dál v prohledávání ostatních voleb, ale tento cyklus už znovu neprojdeme
                continue;
            }
            
            // Projdeme potomka, pouze pokud ještě nebyl plně zpracován
            // (jeho vlastní struktura a jeho potomci)
            if (!fullyProcessedNodes.has(choice.next_node_id)) {
                dfsValidate(choice.next_node_id);
            } else {
                // Pokud byl uzel již plně zpracován, stále ho přidáme do dosažitelných,
                // pokud na něj vede tato nová cesta (pro případ sloučení větví).
                allReachableNodes.add(choice.next_node_id);
            }
        }
        pathStack.pop();
        fullyProcessedNodes.add(nodeId);
    }

    // Spustíme validaci ze startovního uzlu, pokud existuje
    if (nodes[startNode]) {
        dfsValidate(startNode);
    }
    
    // Kontrola nedosažitelných uzlů
    const allDefinedNodeIds = Object.keys(nodes);
    for (const nodeId of allDefinedNodeIds) {
        if (!allReachableNodes.has(nodeId)) {
            errors.push(`Uzel "${nodeId}" je definován v 'nodes', ale je nedosažitelný ze startovního uzlu "${startNode}".`);
        }
        // Doplňková kontrola pro koncové uzly - jsou všechny koncové uzly dosažitelné?
        // Toto je již pokryto obecnou kontrolou nedosažitelnosti, ale pro úplnost:
        if (nodes[nodeId] && nodes[nodeId].is_ending === true && !allReachableNodes.has(nodeId)) {
            // Již by mělo být zachyceno výše jako nedosažitelný uzel.
        }
    }

    // Výstup výsledků
    console.log("\n--- Výsledky validace ---");
    if (errors.length > 0) {
        console.error("Validace selhala s následujícími chybami:");
        errors.forEach(err => console.error(`- ${err}`));
        return false;
    } else {
        console.log("Struktura JSON příběhu je platná! 🎉");
    }

    if (warnings.length > 0) {
        console.warn("\nByla nalezena následující varování:");
        warnings.forEach(warn => console.warn(`- ${warn}`));
    }
    return true;
}

// ----- Spuštění skriptu -----
// Skript se spouští z příkazové řádky Node.js:
// node nazev_tohoto_skriptu.js cesta_k_vasemu_json_souboru.json
// Příklad: node validateStory.js pribehBroucku.json

const storyFilePath = process.argv[2]; // Získá cestu k souboru z argumentů příkazové řádky

if (!storyFilePath) {
    console.error("Prosím, zadejte cestu k JSON souboru jako argument.");
    console.log("Příklad: node validateStory.js pribeh.json");
} else {
    validateStory(storyFilePath);
}