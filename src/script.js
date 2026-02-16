// script.js

// ====================
// -- INITIALISATION --
// ====================

// Has to be called 'db'
const db = new asciiBox({
    width: 60,
    height: 15,
    scale: 2,
    container: document.getElementById('css-content'),
    tools: {
        toolNameContainer: document.querySelector('.js-output'),
        databaseSizeContainer: document.querySelector('.js-database-size-output'),
        styleContainer: {
            body: document.querySelector(".js-select-style-body"),
            tail: document.querySelector(".js-select-style-tail"),
            head: document.querySelector(".js-select-style-head"),
            roundedAngles: document.querySelector(".js-checkbox-style-roundedAngles"),
        }
    }
});


function setTool(args) {
    // Remove 'active' class from all toolbar icons
    document.querySelectorAll('.toolbar-icon').forEach(icon => {
        icon.classList.remove('active');
    });

    document.querySelectorAll('.toolbar-info').forEach(icon => {
        icon.classList.remove('active');
    });

    // Add the 'active' class to the desired
    document.querySelectorAll(`.tool-${args.replace(' ','')}`).forEach(elem => {
        elem.classList.add('active');
    });
    db.setTool(args); 
}

// Initialise First Tool
setTool('Select', null); 

function zoomIn() {
    db.zoomIn();
}
function zoomOut() {
    db.zoomOut();
}
function undo() {
    db.undo();
}
function redo() {
    db.redo();
}
function copy() {
    db.copy();
}





// ================
// -- KEY EVENTS --
// ================

// == KEY DOWN ==
document.addEventListener('keydown', (event) => {
    const tagName = document.activeElement.tagName;
    
    // IF TEXT AREA IS FOCUS
    // Loose focus on ESCAPE or ENTER without SHIFT
    if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
        if (event.key === 'Escape' || (event.key === 'Enter' && !event.shiftKey)) document.activeElement.blur();
        return;
    }

    // ELSE
    // console.log(`Key pressed: ${event.key}`);
    const cmdOrCtrl = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? event.metaKey : event.ctrlKey;
    const shiftKey = event.shiftKey;
    const key = event.key.toUpperCase();

    // SIMPLE LETTER TYPING
    if (!cmdOrCtrl && key === 'V') {
        setTool('Select');
    }
    else if (key === 'L') {
        setTool('Draw Line');
    }
    else if (key === 'M') {
        setTool('Draw Box');
    }
    else if (key === 'T') {
        setTool('Write Text');
    }
    else if (key === 'B') {
        setTool('Brush');
    }
    else if (key === 'E') {
        setTool('Erase');
    }
    else if (shiftKey && key === 'O') {
        setTool('Workspace');
    }
    
    // SPACE BAR
    else if (key === ' ') {
        event.preventDefault();
        if(db.toolManager.currentTool.name.toLowerCase() == 'movement') return;
        if(!db.toolManager.currentTool.isActive) db.setTool('Movement');
        else db.handleAction('onSpace');
        // TO DO - Setup onSpace ?
    } 
    // ESCAPE
    else if (key === "ESCAPE") {
        event.preventDefault();
        if(db.toolManager.currentTool) db.handleAction('onEscape');
    }
    // DELETE
    else if (key === "BACKSPACE" || key === "DELETE") {
        event.preventDefault();
        console.log('PIF');
        if(db.toolManager.currentTool) db.handleAction('onDelete');
    }
    // TAB
    else if (key === "TAB") {
        event.preventDefault();
        if(db.toolManager.currentTool) db.handleAction('onTab');
    }
    // ENTER
    else if (key === "ENTER") {
        event.preventDefault();
        if(db.toolManager.currentTool) db.handleAction('onEnter');
    }
    // SHIFT
    else if (shiftKey) {
        if(db.toolManager.currentTool.isActive) {
            event.preventDefault();
            db.handleAction('onShift', true);
        }
    } 

    // === COMMANDS ===
    
    // UNDO
    if (cmdOrCtrl && !shiftKey && key === 'Z') {
        event.preventDefault();
        db.undo();
    }
    // REDO
    else if (cmdOrCtrl && shiftKey && key === 'Z') {
        event.preventDefault();
        db.redo();
    }
    // COPY
    if (cmdOrCtrl && !shiftKey && key === 'C') {
        event.preventDefault();
        db.copy();
    } 
    // PASTE
    else if (cmdOrCtrl && !shiftKey && key === 'V') {
        event.preventDefault();
        db.paste();
    } 
    // CUT
    else if (cmdOrCtrl && !shiftKey && key === 'X') {
        event.preventDefault();
        db.cut();
    } 
    else if (cmdOrCtrl && !shiftKey && key === 'A') {
        event.preventDefault();
        db.selectAll();
    } 
    // XX  'key' is upcasing of event.key !?
    else if ((event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        //console.log("Arrow Key pressed: ", event.key);
        if (db.selection && db.selection.adresses && db.selection.adresses.length > 0 &&
                ! cmdOrCtrl && !shiftKey) {
            const dir = event.key.replace('Arrow', '');
            db.moveSelectionByOne(dir);
        }
    }

    // === DEBUG ===

    else if (key === '0') {
        console.log(db.db);
    }
    else if (key === '1') {
        console.log(db.history); 
    }
    else if (key === '2') {
    }
    else if (key === '5') {
    }
    else if (key === '6') {
    }
    else if (key === '8') {
        db.debug();
    }
    else if (key === '9') {
        console.log(db);
    }
});

// == KEY UP ==
document.addEventListener('keyup', (event) => {
    // console.log(`Key released: ${event.key}`);
    const cmdOrCtrl = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? event.metaKey : event.ctrlKey;
    const shiftKey = event.shiftKey;
    const key = event.key.toUpperCase();

    // SPACE
    if ( key === ' ' && db.toolManager.currentTool.name.toLowerCase() === 'movement') {
        db.toolManager.revertToPreviousTool();
    }
    // SHIFT
    else if (key === 'SHIFT') {
        if(db.toolManager.currentTool.isActive) {
            event.preventDefault();
            db.handleAction('onShift', false);
        }
    }
});

// == SCROLL ==
$('#css-content').bind('mousewheel', function(e){
    //scroll down
    if(e.originalEvent.deltaY > 0) {
        db.zoomOut();
    }
    //scroll up
    else {
        db.zoomIn();
    }
    return false //prevent page fom scrolling
});


/*
    ████████             ████████             ▄▄█▀▀▀█▄▄  
    ████████           ████     ███        ▄█▀▀       ▀█ 
████        ████    ███          ██      ▄█▀           ▀█
████        ████   ███           ███    █▀             █▀
████        ████   ██           ███    ▄▀             █▀ 
████        ████   ██           ██     █            ▄█▀  
    ████████        ██     █████       ▀█        ▄▄▀▀     Coded by 
    ████████         ████████            ▀▀▄▄▄█▀▀▀      Theo Francart
*/
