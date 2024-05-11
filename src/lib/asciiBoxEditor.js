// 
// Object-oriented approach


// == MAIN OBJECT 🚀 ==
// Contains the database, create and update the canvas 'world'
// Handle text inputs and CMD+KEY commands
class asciiBox {
    constructor(config) {
        this.config = config;
        this.width = config.width || 40;
        this.height = config.height || 10;
        this.scale = config.scale || 2;
        this.rosetta = new asciiBox_Rosetta();

        // Tools
        this.toolManager = new asciiBox_ToolManager(this, config.tools.styleContainer);
        this.toolNameContainer = config.tools.toolNameContainer;

        // Database
        this.db = [];
        this.history = [];
        this.historyIndex = 0;
        this.selection = {
            adresses: [],
            start: null,
            end: null,
        }

        // World
        this.world = [];
        this.worldContainer = config.container;
        this.worldTableContainer = null;
        this.worldTable = null;
        this.worldSizeHandle = null;
        this.newWorldContainer(this.worldContainer);

        // Initilisation
        this.newDatabase(this.width, this.height);
        this.databaseSizeContainer = config.tools.databaseSizeContainer;
        this.buildWorldFromDatabase();
        this.saveToHistory();
        this.updateWorldSize();


        // Text
        this.textInput = this.createTextInput();
        this.textInputPosition = {
            current:null,
            initial:null
        }
    }

    // == HTML INITILAISATION ==
    newWorldContainer(container) {
        // We add CONTAINER
        const containerDiv = document.createElement("div");
        containerDiv.id = 'css-ascii-container';
        containerDiv.style.cssText = 'display: inline-block';
        this.worldTableContainer = containerDiv;
        this.worldTableContainer.style.setProperty('--ascii-container-scale', this.scale);

        // We add WORKSPACE UI
        const workspace = document.createElement("div");
        workspace.id = 'css-ascii-workspace-ui';
        // workspace.classList.add('active');

        // North-east handle
        const neHandle = document.createElement('div');
        neHandle.id = 'ne';
        // nwHandle.className = '';
        neHandle.classList.add('css-ascii-handle');
        neHandle.classList.add('css-ascii-nesw-resize');
        neHandle.style.cssText = 'top: 0; right: 0; transform: translate(50%, -50%);';

        // South-East handle
        const seHandle = document.createElement('div');
        seHandle.id = 'se';
        seHandle.classList.add('css-ascii-handle');
        seHandle.classList.add('css-ascii-nwse-resize');
        seHandle.style.cssText = 'bottom: 0; right: 0; transform: translate(50%, 50%);';

        // South-West handle
        const swHandle = document.createElement('div');
        swHandle.id = 'sw';
        swHandle.classList.add('css-ascii-handle');
        swHandle.classList.add('css-ascii-nesw-resize');
        swHandle.style.cssText = 'bottom: 0; left: 0; transform: translate(-50%, 50%);';

        // North-West handle
        const nwHandle = document.createElement('div');
        nwHandle.id = 'nw';
        nwHandle.classList.add('css-ascii-handle');
        nwHandle.classList.add('css-ascii-nwse-resize');
        nwHandle.style.cssText = 'top: 0; left: 0; transform: translate(-50%, -50%);';

        workspace.appendChild(neHandle);
        workspace.appendChild(seHandle);
        workspace.appendChild(swHandle);
        workspace.appendChild(nwHandle);

        // North handle
        const nHandle = document.createElement('div');
        nHandle.id = 'n';
        nHandle.classList.add('css-ascii-handle');
        nHandle.classList.add('css-ascii-ns-resize');
        nHandle.style.cssText = 'top: 0; left: 50%; transform: translate(-50%, -50%);';

        // South handle
        const sHandle = document.createElement('div');
        sHandle.id = 's';
        sHandle.classList.add('css-ascii-handle');
        sHandle.classList.add('css-ascii-ns-resize');
        sHandle.style.cssText = 'bottom: 0; left: 50%; transform: translate(-50%, 50%);';

        // West handle
        const wHandle = document.createElement('div');
        wHandle.id = 'w';
        wHandle.classList.add('css-ascii-handle');
        wHandle.classList.add('css-ascii-ew-resize');
        wHandle.style.cssText = 'left: 0; top: 50%; transform: translate(-50%, -50%);';

        // East handle
        const eHandle = document.createElement('div');
        eHandle.id = 'e';
        eHandle.classList.add('css-ascii-handle');
        eHandle.classList.add('css-ascii-ew-resize');
        eHandle.style.cssText = 'right: 0; top: 50%; transform: translate(50%, -50%);';

        // Append the new handles to the workspace
        workspace.appendChild(nHandle);
        workspace.appendChild(sHandle);
        workspace.appendChild(wHandle);
        workspace.appendChild(eHandle);

        containerDiv.appendChild(workspace);
        this.worldSizeHandle = workspace;

        // We add TABLE
        const table= document.createElement("table");
        table.id= 'css-ascii-table';
        table.classList.add('no-select');
        containerDiv.appendChild(table);
        this.worldTable = table;

        // Add to html
        container.appendChild(containerDiv);

        // We add SELECT OUT
        const selectOut= document.createElement("div");
        selectOut.id= 'css-ascii-select-out';

        selectOut.addEventListener('mousedown', (e) => {
            e.preventDefault();
            // Unselect if a selection is here
            if(this.selection.adresses) {
                this.selectEnd();
                this.toolManager.currentTool.deactivate();
            }
            // Unselect textinput if we have one
            if(this.textInputPosition.current) {
                document.activeElement.blur();
            }
        });
        selectOut.addEventListener('mouseup', (e) => {
            e.preventDefault();
            // Unselect if a selection is here
            this.toolManager.handleAction('onMouseUpOut');
        });
        this.worldContainer.appendChild(selectOut);
    }

    // == TOOL MANAGER ==
    setTool(toolName) {
        this.toolNameContainer.textContent = toolName;
        this.toolManager.setTool(toolName);
    }
    handleAction(args) {
        this.toolManager.handleAction(args);
    }

    // == DATABASE INITIATLISATION ==
    newDatabase(w, h){
        this.db = [];
        this.width = w;
        this.height = h;
        for(let y=0; y<h; y++){
            this.db.push([]);
            for(let x=0; x<w; x++){
                this.db[y].push(" ")
            };
        };
    }
    updateWorld() {
        const haveSameSize = arraysHaveSameSize(this.db, this.world);
        // console.log('haveSameSize', haveSameSize);
        if(haveSameSize) {
            this.db.forEach((row, x) => {
                row.forEach((elem, y) => {
                    this.world[x][y].innerHTML = elem;
                })
            })
        }
        if(!haveSameSize) {
            this.buildWorldFromDatabase();
        }
        this.updateWorldSize();
    }
    buildWorldFromDatabase() {
        // Ensure tbody exists, create if not
        let tbody = this.worldTable.querySelector("tbody");
        if (!tbody) {
            tbody = document.createElement("tbody");
            this.worldTable.appendChild(tbody);
        }
        this.db.forEach((row, x) => {
            // If the row doesn't exist, create it
            let tr = tbody.rows[x] || tbody.insertRow();
            // Ensure the world array has a row array ready
            this.world[x] = this.world[x] || [];
    
            for (let y = 0; y < row.length; y++) {
                let td = tr.cells[y];
                // If the cell doesn't exist, create it
                if (!td) {
                    td = tr.insertCell();
                    td.addEventListener('mouseenter', () => this.toolManager.handleAction('onMouseEnter', x, y));
                    td.addEventListener('mousedown', () => this.toolManager.handleAction('onMouseDown', x, y));
                    td.addEventListener('mouseup', () => this.toolManager.handleAction('onMouseUp', x, y));
                    td.addEventListener('dblclick', () => this.toolManager.handleAction('onDoubleClick', x, y));
                }
                td.innerHTML = row[y];
                this.world[x][y] = td;
            }
    
            // Update the world array for the current row, trimming excess cells
            this.world[x] = this.world[x].slice(0, row.length);
    
            // Remove excess cells from the DOM
            while (tr.cells.length > row.length) {
                tr.deleteCell(row.length);
            }
        });
    
        // Remove excess rows from both the DOM and the world array
        while (tbody.rows.length > this.db.length) {
            tbody.deleteRow(this.db.length);
            this.world.pop();
        }
    }
    updateWorldSize() {
        // Update the size container
        this.databaseSizeContainer.textContent = `Size ${this.width} x ${this.height}`;
    }
    
    // == UPDATE DATABASE ==
    updateShape(newWidth, newHeight, corner) {
        console.log('🏗 UPDATE SHAPE')
        // corner: nw, ne, se, sw
        const currentWidth = this.width;
        const currentHeight = this.height;
        const currentDb = this.arrayToString(this.history[0]);

        // console.log('width', currentWidth, newWidth);
        // console.log('height', currentHeight, newHeight);
        // console.log('corner', corner);

        let x, y;
        // If x and y have been provided
        if (Array.isArray(corner) ) {
            x = corner[0];
            y = corner[1];
        }
        // Deduce x and y based on the corner value
        else {
            switch (corner) {
                case 'nw':
                    x = newWidth - currentWidth;
                    y = newHeight - currentHeight;
                    break;
                case 'ne':
                    x = 0;
                    y = newHeight - currentHeight;
                    break;
                case 'se':
                    x = 0;
                    y = 0;
                    break;
                case 'sw':
                    x = newWidth - currentWidth;
                    y = 0;
                    break;
                case 'n':
                    x = newWidth - currentWidth;
                    y = 0;
                    break;
                case 's':
                    x = 0;
                    y = 0;
                    break;
                case 'w':
                    x = 0;
                    y = newHeight - currentHeight;
                    break;
                case 'e':
                    x = 0;
                    y = 0;
                    break;
                default:
                    console.log('ERROR: Invalid corner value, should be n, s, w, e, nw, ne, se, sw. Is curently', corner);
                    return;  // Exit if corner is invalid
            }
        }
        
        this.newDatabase(newWidth, newHeight);
        this.pasteString(x, y, currentDb);
        this.updateWorld();
    }
    newCharAt(x, y, newValue) {
        this.db[x][y] = newValue;
        this.world[x][y].innerHTML = newValue;
    }
    newCharAtFromCode(x, y, code, alternativeIndex) {
        let newChar;
        const currentChar = this.db[x][y];
        // On trouve le code equivalent
        const currentCode = this.rosetta.getCodeFromChar(currentChar);

        // currentCode à combiner avec code, s'il existe
        if (currentCode) {
            const codeTemp = combineArrays(code, currentCode);
            const charTemp = this.rosetta.getCharFromCode(codeTemp);
            if(charTemp) {
                newChar = charTemp;
                code = codeTemp;
            }
            else newChar = this.rosetta.getCharFromCode(code);
        }
        else newChar = this.rosetta.getCharFromCode(code);
        if(!newChar) {
            // const codeComplementary = code.slice(2).concat(code.slice(0, 2));
            // code = combineArrays(code, codeComplementary)
            // newChar = this.rosetta.getCharFromCode(code);
            newChar = currentChar;
        }
        // Check other char if an alternative code is provided
        if(alternativeIndex) {
            // Ensure alternativeIndex is an array
            const indices = Array.isArray(alternativeIndex) ? alternativeIndex : [alternativeIndex];

            // Iterate over the indices to find a new char alternative
            for (const index of indices) {
                const newCharAlternative = this.rosetta.getCharFromCodeAlternative(code, index);
                if (newCharAlternative) {
                    newChar = newCharAlternative;
                    break; // Stop at the first valid alternative
                }
            }
        }
        this.db[x][y] = newChar;
    }

    // == HISTORY ==
    saveToHistory() {
        console.log('✨ SNAPSHOT');
        let snapshot = this.db.map(arr => arr.slice()); // deep copy of this.db
        if( this.historyIndex > 0 ) {
            // Discard "future" states if any undos have been made
            this.history = this.history.slice(this.historyIndex);
            this.historyIndex = 0; // Reset history index
        }
        this.history.unshift(snapshot); // Add new state to the front
        if(this.history.length > 20) this.history = this.history.slice(0, 20); // Limit history length
    }
    restoreLastHistory() {
        // Create a deep copy of this.db
        let snapshot = this.history[this.historyIndex].map(arr => arr.slice());
        const haveSameSize = arraysHaveSameSize(snapshot, this.db);
        this.db = snapshot;
        // Restore informations
        if(this.db.length != this.height) this.height = this.db.length;
        if(this.db[0].length != this.width) this.width = this.db[0].length;
        if(!haveSameSize) {
            console.log('size mismatch');
            this.buildWorldFromDatabase();
        }
    }

    // == SELECTION ==
    selectStart(args) {
        if(this.selection.adresses.length>0) this.selectEnd();
        this.selection.start = args;
    }
    selectTo(args) {
        this.selectEnd();
        this.selection.end = args;
        // We add all the tiles
        const A = copyArray(this.selection.start);
        const B = copyArray(this.selection.end);
        const minX = Math.min(A[0], B[0]);
        const maxX = Math.max(A[0], B[0]);
        const minY = Math.min(A[1], B[1]);
        const maxY = Math.max(A[1], B[1]);
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                this.selection.adresses.push([x, y]);
            }
        }
        // We add a selected class to all
        this.selection.adresses.forEach(elem => {
            let tile = this.world[elem[0]][elem[1]]
            if (!tile.classList.contains('selected')) tile.classList.add('selected');
        })
        // We update the info of selection
        this.databaseSizeContainer.textContent = `Selection ${maxY-minY+1} x ${maxX-minX+1}`;
    }
    selectEnd() {
        if(this.selection.adresses.length==0) return
        this.selection.adresses.forEach(elem => {
            let tile = this.world[elem[0]][elem[1]];
            if (tile.classList.contains('selected')) {
                tile.classList.remove('selected');
            }
        })
        this.selection.adresses = [];
        this.updateWorldSize();
    }
    selectEmpty() {
        this.selection.adresses.forEach(elem => {
            this.db[elem[0]][elem[1]] = ' ';
        });
        this.updateWorld();
        this.saveToHistory();
        this.selectEnd();
        return true
    }
    selectAll() {
        if(this.toolManager.currentTool.name.toLowerCase() != 'select') {
            this.setTool('select');
        }
        console.log('SELECT ALL');
        this.selectEnd();
        this.selectStart([0,0]);
        this.selectTo([this.height-1,this.width-1]);
    }

    // == TEXT INPUT ==
    createTextInput() {
        const hiddenInput = document.createElement('textarea');
        // hiddenInput.type = 'textarea';
        hiddenInput.style.position = 'absolute';
        hiddenInput.style.left = '-999px';
        hiddenInput.style.opacity = '0';
        document.body.appendChild(hiddenInput);

        const thisContainer = this;
        hiddenInput.addEventListener('input', function() {
            thisContainer.textInputAdd(this.value);
            this.value = ''
        });
        hiddenInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && event.shiftKey) {
                event.preventDefault();
                thisContainer.textInputNewLine();
            }
            if (event.key === 'Backspace') {
                event.preventDefault();
                thisContainer.textInputRemove();
            }
            if (event.key === 'ArrowUp') {
                thisContainer.textInputMove('Up');
            }
            if (event.key === 'ArrowRight') {
                thisContainer.textInputMove('Right');
            }
            if (event.key === 'ArrowDown') {
                thisContainer.textInputMove('Down');
            }
            if (event.key === 'ArrowLeft') {
                thisContainer.textInputMove('Left');
            }

            // UNDO
            const cmdOrCtrl = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? event.metaKey : event.ctrlKey;
            const shiftKey = event.shiftKey;
            const key = event.key.toUpperCase();
            // if (cmdOrCtrl) event.preventDefault();
            if (cmdOrCtrl && !shiftKey && key === 'Z') {
                console.log('CMD Z')
                // Unselect textinput
                if(thisContainer.textInputPosition.current) {
                    document.activeElement.blur();
                }
                thisContainer.undo();
            }
        });
        hiddenInput.addEventListener('focusin', function() {
        });
        hiddenInput.addEventListener('focusout', function() {
            thisContainer.textInputFocusOut();
        });

        return hiddenInput;
    }
    textInputFocusIn(args) {
        console.log('🖌 TEXT FOCUS IN');
        this.selectEnd();
        const [x, y] = args;
        this.textInput.value = this.db[x][y];
        this.textInput.focus();
        this.textInput.select();
        this.textInputPosition.initial = copyArray(args);
        this.textInputPosition.current = copyArray(args);
        this.world[x][y].classList.add('writing');
    }
    textInputFocusOut() {
        console.log('🖌 TEXT FOCUS OUT');
        if(!arraysEqual(this.textInputPosition.current, this.textInputPosition.initial)) this.saveToHistory();
        if(!this.textInputPosition.current) return;
        let [x, y] = this.textInputPosition.current;
        this.world[x][y].classList.remove('writing');
        this.textInputPosition.initial = null;
        this.textInputPosition.current = null;
    }
    textInputMove(direction){
        if(!this.textInputPosition.current) return;
        let [x, y] = this.textInputPosition.current;
        switch(direction) {
            case 'Up':
                if(x>0) {
                    this.textInputPosition.current = [x-1, y];
                    this.world[x][y].classList.remove('writing');
                    this.world[x-1][y].classList.add('writing');
                }
                break;
            case 'Right':
                if(y<this.width-1) {
                    this.textInputPosition.current = [x, y+1];
                    this.world[x][y].classList.remove('writing');
                    this.world[x][y+1].classList.add('writing');
                }
                break;
            case 'Down':
                if(x<this.height-1) {
                    this.textInputPosition.current = [x+1, y];
                    this.world[x][y].classList.remove('writing');
                    this.world[x+1][y].classList.add('writing');
                }
                break;
            case 'Left':
                if(y>0) {
                    this.textInputPosition.current = [x, y-1];
                    this.world[x][y].classList.remove('writing');
                    this.world[x][y-1].classList.add('writing');
                }
                break;
        }
    }
    textInputAdd(value) {
        if(!this.textInputPosition.current) return;
        const [x, y] = this.textInputPosition.current;
        if( value.length>1 ) {
            this.pasteString(y, x, value);
            this.textInputFocusOut();
            this.updateWorld();
            this.saveToHistory();
        }
        else {
            this.world[x][y].innerHTML = value;
            this.db[x][y] = value;
            if(y < this.width-1) {
                this.textInputPosition.current[1]++;
                this.world[x][y].classList.remove('writing');
                this.world[x][y+1].classList.add('writing');
            }
        }
    }
    textInputNewLine() {
        const [xInitial, yInitial] = this.textInputPosition.initial;
        const [xCurrent, yCurrent] = this.textInputPosition.current;
        if(xCurrent < this.height-1) {
            this.world[xCurrent][yCurrent].classList.remove('writing');
            this.world[xCurrent+1][yInitial].classList.add('writing');
            this.textInputPosition.current = [xCurrent+1, yInitial];
        }
    }
    textInputRemove() {
        if(!this.textInputPosition.current) return;
        let [x, y] = this.textInputPosition.current;

        // Si on est pas sur une case vide
        if (this.db[x][y] != ' ') {
            this.world[x][y].innerHTML = ' ';
            this.db[x][y] = ' ';
            return
        }

        // Logic to update x and y
        this.world[x][y].classList.remove('writing');
        if (y > 0) {
            y--;
        } else if (x > 0) {
            x--;
            y = this.width - 1;
        }
        this.textInputPosition.current = [x, y];
        this.world[x][y].classList.add('writing');
        this.world[x][y].innerHTML = ' ';
        this.db[x][y] = ' ';

        return

        // console.log('Remove at', x, y);
        // console.log(this.textInputPosition);
        // Si on est au même endroit juste on supprime
        // Si c'est déjà vide on suprime celui d'avant et on se déplace
        // if (arraysEqual(this.textInputPosition.initial, this.textInputPosition.current)) {
        //     console.log('Remove current location only');
        // }

        // Si on est en début de ligne
        if (y==this.width-1) {
            this.world[x][y].innerHTML = ' ';
            this.db[x][y] = ' ';
        }
        // Move left unless we're at the start of a line
        if (y > 0) {
            console.log('we move left', x, y);
            this.world[x][y].classList.remove('writing');
            y--;
            this.world[x][y].classList.add('writing');
        } else if (x > 0) {
            // If at the start of a line, move up to the end of the previous line
            this.world[x][y].classList.remove('writing');
            x--;
            y = this.width - 1; // Move to the end of the previous line
            this.world[x][y].classList.add('writing');
        }
        this.textInputPosition.current = [x, y];
        console.log('we are now at', this.textInputPosition.current);
        this.world[x][y].innerHTML = ' ';
        this.db[x][y] = ' ';
    }

    // == COPY PASTE COMMANDS ==
    arrayToString(input) {
        return input.map(row => row.join('')).join('\n');
    }
    copy() {
        console.log('COPY');

        let stringToCopy = '';
        // Check if we have a selection
        if( this.selection.adresses.length>0 ) {
            const A = copyArray(this.selection.start);
            const B = copyArray(this.selection.end);
            const minX = Math.min(A[0], B[0]);
            const maxX = Math.max(A[0], B[0]);
            const minY = Math.min(A[1], B[1]);
            const maxY = Math.max(A[1], B[1]);
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    stringToCopy += this.db[x][y];
                }
                if (x < maxX) { // Avoid adding a newline after the last line
                    stringToCopy += '\n';
                }
            }
        }
        // Convert the 2D array to a string with line breaks
        else stringToCopy = this.arrayToString(this.db);

        // Use the Clipboard API to copy the string to the clipboard
        navigator.clipboard.writeText(stringToCopy).then(() => {
            // No message if only one selected
            if(this.selection.adresses.length == 1 ) return
            const messageDiv = document.querySelector('.js-copy-message');
            let message = this.selection.adresses.length > 1 ? 'Selection': 'Artwork';
            messageDiv.textContent = `${message} copied to clipboard 👌`;
            messageDiv.classList.add('show');
            // Automatically remove 'show' after 2 seconds
            setTimeout(() => {
                messageDiv.classList.remove('show');
            }, 1500);

        }).catch(err => {
            console.error('Could not copy text to clipboard', err);
        });
    }
    async paste() {
        // If a paste occurs when the user has a selection
        if( this.selection.adresses.length > 0 ) {
            console.log('PASTE');
            let text = '';
            try {
                text = await navigator.clipboard.readText();
                console.log('Clipboard content:', text);
                const [x, y] = this.selection.start;
                if(text.length > 1) {
                    this.pasteString(y, x, text);
                }
                else {
                    this.selection.adresses.forEach(elem => {
                        this.db[elem[0]][elem[1]] = text;
                    });
                }
                this.selectEnd();
                this.updateWorld();
                this.saveToHistory();
            } catch (err) {
                console.error('Failed to read clipboard contents: ', err);
                this.selectEnd();
            }
        }
    }
    pasteString(x, y, string) {
        // console.log(string);
        const lines = string.split('\n');
        // console.log(lines);
        // Iterate over each line
        for (let i = 0; i < lines.length; i++) {
            // Skip the line if the y position is out of the db bounds
            if (y + i < 0 || y + i >= this.db.length) continue;
    
            const line = lines[i];
            let lineToPaste;
            let startX = x;
    
            // Adjust startX and lineToPaste based on x
            if (x < 0) {
                lineToPaste = line.substring(-x);  // Skip the first -x characters
                startX = 0;  // Start pasting at the beginning of the row
            } else {
                lineToPaste = line;
            }
    
            // Paste each character of the current line
            for (let j = 0; j < lineToPaste.length; j++) {
                // Stop if the x position is out of the db bounds
                if (startX + j >= this.db[0].length) break;
    
                // Check if the x position is within the db bounds before pasting
                if (startX + j >= 0) {
                    this.db[y + i][startX + j] = lineToPaste[j];
                }
            }
        }
    }
    cut() {
        if( this.selection.adresses.length>0 ) {
            this.copy();
            console.log('CUT');
            this.selection.adresses.forEach(elem => {
                this.db[elem[0]][elem[1]] = ' ';
            });
            this.updateWorld();
            this.saveToHistory();
            this.selectEnd();
        }
    }

    // == UNDO / REDO ==
    undo() {
        if (this.historyIndex >= this.history.length-1) return // Check bounds
        console.log('🪡 UNDO');
        this.historyIndex++;
        this.db = copyArray(this.history[this.historyIndex]); // Deep copy from history
        if(this.db.length != this.height) this.height = this.db.length; // Restore informations
        if(this.db[0].length != this.width) this.width = this.db[0].length;
        this.selectEnd();
        this.updateWorld();
    }
    redo() {
        if (this.historyIndex <= 0) return // Check bounds
        console.log('🧵 REDO');
        this.historyIndex--;
        this.db = copyArray(this.history[this.historyIndex]); // Deep copy from history
        if(this.db.length != this.height) this.height = this.db.length; // Restore informations
        if(this.db[0].length != this.width) this.width = this.db[0].length;
        this.selectEnd();
        this.updateWorld();
        // this world n'a pas la bonne shape !!
    }

    // == ZOOM IN / OUT ==
    zoomIn() {
        console.log('🔍 ZOOM IN');
        this.scale = Math.min(this.scale + 0.1, 4);
        this.worldTableContainer.style.setProperty('--ascii-container-scale', this.scale);
    }
    zoomOut() {
        console.log('🔍 ZOOM OUT');
        this.scale = Math.max(this.scale - 0.1, 0.8);
        this.worldTableContainer.style.setProperty('--ascii-container-scale', this.scale);
    }

    // == DEBUG ==
    debug() {
        console.log('== DEBUG ==');
        console.log(this.history);
    }
}


// == TOOL MANAGER 🧰 ==
// Manages the current and previous tool, handling the switch
// and invoking actions on the active tool
class asciiBox_ToolManager {
    constructor(db, styleContainer) {
        this.db = db;
        this.currentTool = null;
        this.previousTool = null;
        this.tools = {
            "draw line": new asciiBox_DrawLine(this),
            "draw box": new asciiBox_DrawBox(this),
            "erase": new asciiBox_Erase(this),
            "brush": new asciiBox_Brush(this),
            "select": new asciiBox_Select(this),
            "workspace": new asciiBox_Workspace(this),
            "movement": new asciiBox_Movement(this),
            "write text": new asciiBox_WriteText(this),
            // Initialize other tools here...
        };
        this.setStyleContainer(styleContainer);
        this.style = {
            body: 1,
            tail: 'butt',
            head: 'arrow',
            roundedAngles: false,
        }
        this.canSetTool = true;
    }

    // Initiate the style containers HTML content
    setStyleContainer(styleContainer) {
        if(styleContainer.body) {
            const optionsBody = [
                { value: "1", text: "─ Normal" },
                { value: "2", text: "━ Bold" },
                { value: "3", text: "═ Double" },
                { value: "11", text: "╌ Point 1" },
                { value: "12", text: "╍ Point 1 Bold" },
                { value: "13", text: "┄ Point 2" },
                { value: "14", text: "┅ Point 2 Bold" },
                { value: "15", text: "┈ Point 3" },
                { value: "16", text: "┉ Point 3 Bold" },
            ];
            optionsBody.forEach(optionData => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.text;
                if (optionData.value === "1") option.selected = true;
                styleContainer.body.appendChild(option);
            });
            styleContainer.body.addEventListener('change', function() {
                db.toolManager.style.body = parseInt(this.value);
            });
        }
        if(styleContainer.tail) {
            const optionsBody = [
                { value: "butt", text: "- Half" },
                { value: "long", text: "-- Full" },
                { value: "arrow-full", text: "◀-" },
                { value: "arrow-outline", text: "◁-" },
                { value: "hammer", text: "|-" },
                { value: "none", text: "(None)" },
            ];
            optionsBody.forEach(optionData => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.text;
                if (optionData.value === "butt") option.selected = true;
                styleContainer.tail.appendChild(option);
            });
            styleContainer.tail.addEventListener('change', function() {
                db.toolManager.style.tail = this.value;
            });
        }
        if(styleContainer.head) {
            const optionsBody = [
                { value: "butt", text: "Half -" },
                { value: "long", text: "Full --" },
                { value: "arrow-full", text: "-▶" },
                { value: "arrow-outline", text: "-▷" },
                { value: "hammer", text: "-|" },
                { value: "none", text: "(None)" },
            ];
            optionsBody.forEach(optionData => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.text;
                if (optionData.value === "arrow") option.selected = true;
                styleContainer.head.appendChild(option);
            });
            styleContainer.head.addEventListener('change', function() {
                db.toolManager.style.head = this.value;
            });
        }
        if(styleContainer.roundedAngles) {
            styleContainer.roundedAngles.addEventListener('change', function() {
                db.toolManager.style.roundedAngles = this.checked;
            });
        }
    }

    setTool(toolName) {
        // Sanitize Input
        toolName = toolName.toLowerCase();
        // Set the current tool
        if (this.tools[toolName] && this.tools[toolName]!=this.currentTool) {
            console.log('🧰 SETTING TOOL:', toolName.toUpperCase())
            if(this.currentTool) this.currentTool.deactivate();
            if(this.currentTool) this.currentTool.onSetOffTool();
            this.previousTool = this.currentTool;
            this.currentTool = this.tools[toolName];
            this.currentTool.onSetTool();
            if(this.db.selection.adresses.length>0) this.db.selectEnd();
        }
        else if (this.tools[toolName]==this.currentTool) {
            console.log('Tool is already selected: ', toolName);
        }
        else console.log('ERROR: No tool', toolName);
    }

    revertToPreviousTool() {
        if (this.previousTool) {
            this.db.setTool(this.previousTool.name);
        }
    }

    // Pass the action to the current tool
    handleAction(action, ...args) {
        // Log
        // console.log(action, args);
        if(this.currentTool) {
            // Call the action method on the current tool
            if (this.currentTool[action]) {
                this.currentTool[action](args);
            }
            else console.log('No action for', action);
        }
    }

}

// == TOOL GENERAL CLASS 🛠 == 
// Defines common behavior and properties shared by all tools
class asciiBox_Tool {
    constructor(name, manager) {
        this.name = name;
        this.manager = manager;
        this.isActive = false;
        this.lastKnownedPosition = null;
    }

    activate() {
        this.isActive = true;
    }
    deactivate() {
        this.isActive = false;
    }

    onSetTool() {}
    onSetOffTool() {}
    onMouseDown(args) {}
    onMouseEnter(args) {}
    onMouseUp(args) {}
    onMouseUpOut() {}
    onSpace() {}
    onEscape() {}
    onShift() {}
    onTab() {}
    onEnter() {}
    onDelete() {
        // Delete the current tile if the tool is not active
        if (this.isActive) return;
        this.manager.db.newCharAt(this.lastKnownedPosition[0], this.lastKnownedPosition[1], ' ');
        this.manager.db.saveToHistory();
    }
}


// == SELECT 👋 ==
class asciiBox_Select extends asciiBox_Tool {
    constructor(manager) {
        super('Select', manager);
        this.positionStart=null;
        this.isSet=false;
    }
    onSetTool() {
    }

    onDoubleClick(args) {
        // console.log('DOUBLE CLICK', args);
        this.manager.db.textInputFocusIn(args);
    }

    onMouseDown(args) {
        if (this.isActive) this.deselect();
        this.manager.db.selectStart(args);
        this.positionStart = args;
        this.activate();
    }

    onMouseEnter(args) {
        this.lastKnownedPosition = args;
        if (!this.isActive) return;
        this.manager.db.selectTo(args);
    }

    onMouseUp(args) {
        if (!this.isActive) return;
        this.manager.db.selectTo(args);
        // if (args[0]==this.positionStart[0] && args[1]==this.positionStart[1]) db.textInputFocusIn(args);
        this.deactivate();
    }

    onMouseLeave() {
        // if mouse get out of the container
        if (!this.isActive) return;
        this.deactivate();
    }

    onEscape() {
        if (!this.isActive) return;
        this.manager.db.selectEnd();
        this.deactivate();
    }

    onDelete() {
        if (this.isActive) return;
        if (this.manager.db.selectEmpty() && !this.manager.db.textInputPosition.current) {
            console.log('hey');
            this.manager.db.newCharAt(this.lastKnownedPosition[0], this.lastKnownedPosition[1], ' ');
        }
    }

}

// == DRAW BOX 🖊 ==
class asciiBox_DrawBox extends asciiBox_Tool {
    constructor(manager) {
        super('Draw Box', manager);
        this.detailSetup = { 
            positionStart: null, 
            positionEnd: null,
            routeA:[],
            routeB:[],
            routeIsSquare: false,
        };
        this.detail = deepCopyObjectWithArrays(this.detailSetup);
        // We assume the database was declared and named 'db'
    }
    onSetTool() {
        this.manager.db.worldContainer.classList.add('css-ascii-crosshair');
    }
    onSetOffTool() {
        this.manager.db.worldContainer.classList.remove('css-ascii-crosshair');
    }
    onMouseDown(args) {
        if (this.isActive) return;
        // We make isActive to True
        this.activate();
        this.detail.positionStart = args;
    }
    onMouseEnter(args) {
        // We update the last visited tile coordinates
        this.lastKnownedPosition = args;
        if (!this.isActive) return;
        // We update the end to the current location
        this.detail.positionEnd = args;
        // We draw the path
        this.draw();
    }
    onMouseUp(args) {
        // Make the drawing and save it
        if (!this.isActive) return;
        // If we did not move we add a cross
        if(!this.detail.positionEnd) {
            let currentValue = this.manager.db.db[args[0]][args[1]];
            let sequence = [' ', '+', '╱', '╲', '╳', '◇', '◯', '◻', ' '];
            let newChar;
            if (sequence.includes(currentValue)) {
                newChar = sequence[(sequence.indexOf(currentValue) + 1) % sequence.length];
            } else {
                newChar = sequence[1];
            }
            this.manager.db.newCharAt(args[0], args[1], newChar);
        }
        // We save the current state
        // console.log('WE DRAW');
        this.manager.db.saveToHistory();
        // Initialise again the tool
        this.detail = deepCopyObjectWithArrays(this.detailSetup);
        this.deactivate();
    }
    onMouseUpOut() {
        if (!this.isActive) return;
        // Make the drawing and save it
        this.manager.db.saveToHistory();
        // Initialise again the tool
        this.detail = deepCopyObjectWithArrays(this.detailSetup);
        this.deactivate();
    }
    onEscape() {
        // Cancel the drawing if the tool is active
        if (!this.isActive) return;
        console.log('⛔️ CANCEL DRAWING');

        this.manager.db.restoreLastHistory();
        this.manager.db.updateWorld();

        // Initialise again the tool
        this.detail = deepCopyObjectWithArrays(this.detailSetup);
        this.deactivate();
    }
    onShift(args) {
        if(this.detail.routeIsSquare != args[0]) {
            console.log('⚙️ WE CHANGE BEHAVIOUR', args[0]);
            this.detail.routeIsSquare = args[0];
            this.draw();
        }
    }

    // MAIN PATH DRAWING 
    draw() {
        const { positionStart, positionEnd } = this.detail;
        // Create copies of the arrays
        const positionStartCopy = copyArray(positionStart);
        const positionEndCopy = copyArray(positionEnd);
        // break if we went back
        if(positionStartCopy[0]==positionEndCopy[0] && positionStartCopy[1]==positionEndCopy[1]) {
            this.manager.db.restoreLastHistory();
            this.manager.db.updateWorld();
            return
        }

        // == IF SHIFT IS PRESSED ==
        if(this.detail.routeIsSquare) {
            console.log('ONLY ONE WAY');
            const diffX = Math.abs(positionEnd[0] - positionStart[0]);
            const diffY = Math.abs(positionEnd[1] - positionStart[1]);

            if (diffX >= diffY) {
                positionEndCopy[1] = positionStart[1]+diffX;
            } else {
                positionEndCopy[0] = positionStart[0]+diffY;
            }
            if(positionEndCopy[0]>this.manager.db.height-1) positionEndCopy[0]=this.manager.db.height-1
            if(positionEndCopy[1]>this.manager.db.width-1) positionEndCopy[1]=this.manager.db.width-1
        }

        // == WE GRAB THE ROUTES ==
        const routeApath = [];
        const routeBpath = [];
        // Route A: Horizontal then Vertical
        for (let x = positionStartCopy[0]; x !== positionEndCopy[0]; positionStartCopy[0] < positionEndCopy[0] ? x++ : x--) {
            routeApath.push([x, positionStartCopy[1]]);
        }
        for (let y = positionStartCopy[1]; y !== positionEndCopy[1]; positionStartCopy[1] < positionEndCopy[1] ? y++ : y--) {
            routeApath.push([positionEndCopy[0], y]);
        }
        routeApath.push(positionEndCopy);
        // Route B: Vertical then Horizontal
        for (let y = positionStartCopy[1]; y !== positionEndCopy[1]; positionStartCopy[1] < positionEndCopy[1] ? y++ : y--) {
            routeBpath.push([positionStartCopy[0], y]);
        }
        for (let x = positionStartCopy[0]; x !== positionEndCopy[0]; positionStartCopy[0] < positionEndCopy[0] ? x++ : x--) {
            routeBpath.push([x, positionEndCopy[1]]);
        }
        // We combine them
        if(routeBpath.length>0) {
            for(let x=routeBpath.length-1; x>=0; x--) {
                routeApath.push(routeBpath[x]);
            }
        }
        routeApath.push(routeApath[1]);

        // == WE MAKE THE CODE FOR EACH TILE ==
        const routeFinal = [];
        function createTile(x, y, nextX, nextY, prevX, prevY) {
            let value = [0, 0, 0, 0]; // [top, right, bottom, left]
            // Adjusting for inverted axes: x is vertical, y is horizontal
            if (nextX > x) value[2] = 1; // Next tile is below
            if (nextX < x) value[0] = 1; // Next tile is above
            if (nextY > y) value[1] = 1; // Next tile is to the right
            if (nextY < y) value[3] = 1; // Next tile is to the left
            // Check for previous tile and update value accordingly
            if (prevX > x) value[2] = 1; // Previous tile is below
            if (prevX < x) value[0] = 1; // Previous tile is above
            if (prevY > y) value[1] = 1; // Previous tile is to the right
            if (prevY < y) value[3] = 1; // Previous tile is to the left
            return { coordinates: [x, y], value };
        }
        routeApath.forEach( (elem, index) => {
            const previousElem = routeApath[index-1] ? routeApath[index-1]: elem;
            const nextElem = routeApath[index+1] ? routeApath[index+1]: elem;
            routeFinal.push( createTile( elem[0], elem[1], nextElem[0], nextElem[1], previousElem[0], previousElem[1]) );
        });

        // == WE STYLE THE DRAWING ==
        let alternativeCode = [];
        if(this.manager.style.roundedAngles) {
            alternativeCode.push(1);
        }
        if(this.manager.style.body != 1 && this.manager.style.body < 10) {
            routeFinal.forEach(tile => { tile.value = tile.value.map((item, index) => item === 1 ? this.manager.style.body : item); });
        }
        if(this.manager.style.body > 10) {
            alternativeCode.push(this.manager.style.body);
        }
        
        // == WE DRAW ==
        this.manager.db.restoreLastHistory();
        routeFinal.forEach(tile => {
            this.manager.db.newCharAtFromCode(tile.coordinates[0], tile.coordinates[1], tile.value, alternativeCode);
        })
        this.manager.db.updateWorld();
    }
}

// == DRAW LINE 🖊 ==
class asciiBox_DrawLine extends asciiBox_Tool {
    constructor(manager) {
        super('Draw Line', manager);
        this.detailSetup = { 
            positionStart: null, 
            positionEnd: null,
            routeA:[],
            routeB:[],
            routeStartWithVertical: false,
            routeIsOnlyOneWay: false,
        };
        this.detail = deepCopyObjectWithArrays(this.detailSetup);
        // We assume the database was declared and named 'db'
    }
    onSetTool() {
        this.manager.db.worldContainer.classList.add('css-ascii-crosshair');
    }
    onSetOffTool() {
        this.manager.db.worldContainer.classList.remove('css-ascii-crosshair');
    }
    onMouseDown(args) {
        if (this.isActive) return;
        this.activate();
        this.detail.positionStart = args;
    }
    onMouseEnter(args) {
        // We update the last visited tile coordinates
        this.lastKnownedPosition = args;
        if (!this.isActive) return;
        // We update the end to the current location
        this.detail.positionEnd = args;
        // We draw the path
        this.draw();
    }
    onMouseUp(args) {
        // Make the drawing and save it
        if (!this.isActive) return;
        // If we did not move we add a cross
        if(!this.detail.positionEnd) {
            let currentValue = this.manager.db.db[args[0]][args[1]];
            let sequence = [' ', '+', '╱', '╲', '╳', '◇', '◯', '◻', ' '];
            let newChar;
            if (sequence.includes(currentValue)) {
                newChar = sequence[(sequence.indexOf(currentValue) + 1) % sequence.length];
            } else {
                newChar = sequence[1];
            }
            this.manager.db.newCharAt(args[0], args[1], newChar);
        }
        // We save the current state
        // console.log('WE DRAW');
        this.manager.db.saveToHistory();
        // Initialise again the tool
        this.detail = deepCopyObjectWithArrays(this.detailSetup);
        this.deactivate();
    }
    onMouseUpOut() {
        if (!this.isActive) return;
        // Make the drawing and save it
        this.manager.db.saveToHistory();
        // Initialise again the tool
        this.detail = deepCopyObjectWithArrays(this.detailSetup);
        this.deactivate();
    }
    onSpace() {
        // Invert the starting route if the tool is active
        // To do dynamically
        if (!this.isActive) return;
        console.log('⚙️ WE CHANGE ROUTE ORIENTATION');
        this.detail.routeStartWithVertical = !this.detail.routeStartWithVertical;
        this.draw();
    }
    onEscape() {
        // Cancel the drawing if the tool is active
        if (!this.isActive) return;
        console.log('⛔️ CANCEL DRAWING');

        this.manager.db.restoreLastHistory();
        this.manager.db.updateWorld();

        // Initialise again the tool
        this.detail = deepCopyObjectWithArrays(this.detailSetup);
        this.deactivate();
    }
    onShift(args) {
        if(this.detail.routeIsOnlyOneWay != args[0]) {
            console.log('⚙️ WE CHANGE BEHAVIOUR', args[0]);
            this.detail.routeIsOnlyOneWay = args[0];
            this.draw();
        }
    }

    // MAIN PATH DRAWING 
    draw() {
        const { positionStart, positionEnd } = this.detail;
        // Create copies of the arrays
        const positionStartCopy = copyArray(positionStart);
        const positionEndCopy = copyArray(positionEnd);

        // == IF SHIFT IS PRESSED ==
        if(this.detail.routeIsOnlyOneWay) {
            console.log('⚙️ ONLY ONE WAY');
            const diffX = Math.abs(positionEnd[0] - positionStart[0]);
            const diffY = Math.abs(positionEnd[1] - positionStart[1]);

            if (diffX >= diffY) {
                positionEndCopy[1] = positionStart[1]; // Make the line horizontal
            } else {
                positionEndCopy[0] = positionStart[0]; // Make the line vertical
            }
        }

        // == WE GRAB THE ROUTES ==
        const routeApath = [];
        const routeBpath = [];
        // Route A: Horizontal then Vertical
        for (let x = positionStartCopy[0]; x !== positionEndCopy[0]; positionStartCopy[0] < positionEndCopy[0] ? x++ : x--) {
            routeApath.push([x, positionStartCopy[1]]);
        }
        for (let y = positionStartCopy[1]; y !== positionEndCopy[1]; positionStartCopy[1] < positionEndCopy[1] ? y++ : y--) {
            routeApath.push([positionEndCopy[0], y]);
        }
        routeApath.push(positionEndCopy);
        // Route B: Vertical then Horizontal
        for (let y = positionStartCopy[1]; y !== positionEndCopy[1]; positionStartCopy[1] < positionEndCopy[1] ? y++ : y--) {
            routeBpath.push([positionStartCopy[0], y]);
        }
        for (let x = positionStartCopy[0]; x !== positionEndCopy[0]; positionStartCopy[0] < positionEndCopy[0] ? x++ : x--) {
            routeBpath.push([x, positionEndCopy[1]]);
        }
        routeBpath.push(positionEndCopy);

        // == WE MAKE THE CODE FOR EACH TILE ==
        const routeA = [];
        const routeB = [];
        function createTile(x, y, nextX, nextY, prevX, prevY) {
            let value = [0, 0, 0, 0]; // [top, right, bottom, left]
            // Adjusting for inverted axes: x is vertical, y is horizontal
            if (nextX > x) value[2] = 1; // Next tile is below
            if (nextX < x) value[0] = 1; // Next tile is above
            if (nextY > y) value[1] = 1; // Next tile is to the right
            if (nextY < y) value[3] = 1; // Next tile is to the left
            // Check for previous tile and update value accordingly
            if (prevX > x) value[2] = 1; // Previous tile is below
            if (prevX < x) value[0] = 1; // Previous tile is above
            if (prevY > y) value[1] = 1; // Previous tile is to the right
            if (prevY < y) value[3] = 1; // Previous tile is to the left
            return { coordinates: [x, y], value };
        }
        routeApath.forEach( (elem, index) => {
            const previousElem = routeApath[index-1] ? routeApath[index-1]: elem;
            const nextElem = routeApath[index+1] ? routeApath[index+1]: elem;
            routeA.push( createTile( elem[0], elem[1], nextElem[0], nextElem[1], previousElem[0], previousElem[1]) );
        });
        routeBpath.forEach( (elem, index) => {
            const previousElem = routeBpath[index-1] ? routeBpath[index-1]: elem;
            const nextElem = routeBpath[index+1] ? routeBpath[index+1]: elem;
            routeB.push( createTile( elem[0], elem[1], nextElem[0], nextElem[1], previousElem[0], previousElem[1]) );
        })

        // == WE STYLE THE DRAWING ==
        switch(this.manager.style.tail) {
            default:
            case 'butt':
                break;
            case 'long':
                const codeAl = routeA[0].value;
                const codeBl = routeB[0].value;
                const codeAlComplementary = codeAl.slice(2).concat(codeAl.slice(0, 2));
                const codeBlComplementary = codeBl.slice(2).concat(codeBl.slice(0, 2));
                routeA[0].value = combineArrays(codeAl, codeAlComplementary);
                routeB[0].value = combineArrays(codeBl, codeBlComplementary);
                break;
            case 'hammer':
                let codeAh = routeA[0].value;
                let codeBh = routeA[0].value;
                const codeAhComplementary1 = codeAh.slice(1).concat(codeAh.slice(0, 1));
                const codeAhComplementary3 = codeAh.slice(3).concat(codeAh.slice(0, 3));
                const codeBhComplementary1 = codeBh.slice(1).concat(codeBh.slice(0, 1));
                const codeBhComplementary3 = codeBh.slice(3).concat(codeBh.slice(0, 3));
                codeAh = combineArrays(codeAh, codeAhComplementary1);
                codeAh = combineArrays(codeAh, codeAhComplementary3);
                codeBh = combineArrays(codeBh, codeBhComplementary1);
                codeBh = combineArrays(codeBh, codeBhComplementary3);
                routeA[0].value = codeAh;
                routeB[0].value = codeBh;
                break;
            case 'arrow-full':
                routeA[0].value = routeA[0].value.map((item, index) =>  item * 10 );
                routeB[0].value = routeB[0].value.map((item, index) =>  item * 10 );
                break;
            case 'arrow-outline':
                routeA[0].value = routeA[0].value.map((item, index) =>  item * 11 );
                routeB[0].value = routeB[0].value.map((item, index) =>  item * 11 );
                break;
            case 'none':
                routeA[0].value = [0,0,0,0];
                routeB[0].value = [0,0,0,0];    
                break;
        }
        switch(this.manager.style.head) {
            default:
            case 'butt':
                break;
            case 'long':
                const codeA = routeA[routeA.length-1].value;
                const codeB = routeB[routeB.length-1].value;
                const codeAComplementary = codeA.slice(2).concat(codeA.slice(0, 2));
                const codeBComplementary = codeB.slice(2).concat(codeB.slice(0, 2));
                routeA[routeA.length-1].value = combineArrays(codeA, codeAComplementary);
                routeB[routeB.length-1].value = combineArrays(codeB, codeBComplementary);
                break;
            case 'hammer':
                let codeAh = routeA[routeA.length-1].value;
                let codeBh = routeA[routeA.length-1].value;
                const codeAhComplementary1 = codeAh.slice(1).concat(codeAh.slice(0, 1));
                const codeAhComplementary3 = codeAh.slice(3).concat(codeAh.slice(0, 3));
                const codeBhComplementary1 = codeBh.slice(1).concat(codeBh.slice(0, 1));
                const codeBhComplementary3 = codeBh.slice(3).concat(codeBh.slice(0, 3));
                codeAh = combineArrays(codeAh, codeAhComplementary1);
                codeAh = combineArrays(codeAh, codeAhComplementary3);
                codeBh = combineArrays(codeBh, codeBhComplementary1);
                codeBh = combineArrays(codeBh, codeBhComplementary3);
                routeA[routeA.length-1].value = codeAh;
                routeB[routeA.length-1].value = codeBh;
                break;
            case 'arrow-full':
                routeA[routeA.length-1].value = routeA[routeA.length-1].value.map((item, index) => item * 10 );
                routeB[routeB.length-1].value = routeB[routeB.length-1].value.map((item, index) => item * 10 );    
                break;
            case 'arrow-outline':
                routeA[routeA.length-1].value = routeA[routeA.length-1].value.map((item, index) => item * 11 );
                routeB[routeB.length-1].value = routeB[routeB.length-1].value.map((item, index) => item * 11 );    
                break;
            case 'none':
                routeA[routeA.length-1].value = [0,0,0,0];
                routeB[routeB.length-1].value = [0,0,0,0];    
                break;
        }
        let alternativeCode = [];
        if(this.manager.style.roundedAngles) {
            alternativeCode.push(1);
        }
        if(this.manager.style.body != 1 && this.manager.style.body < 10) {
            routeA.forEach(tile => { tile.value = tile.value.map((item, index) => item === 1 ? this.manager.style.body : item); });
            routeB.forEach(tile => { tile.value = tile.value.map((item, index) => item === 1 ? this.manager.style.body : item); });
        }
        if(this.manager.style.body > 10) {
            alternativeCode.push(this.manager.style.body);
        }
        
        // == WE DRAW ==
        this.manager.db.restoreLastHistory();
        if (!this.detail.routeStartWithVertical) {
            routeA.forEach(tile => {
                this.manager.db.newCharAtFromCode(tile.coordinates[0], tile.coordinates[1], tile.value, alternativeCode);
            })
        } else {
            routeB.forEach(tile => {
                this.manager.db.newCharAtFromCode(tile.coordinates[0], tile.coordinates[1], tile.value, alternativeCode);
            })
        }
        this.manager.db.updateWorld();
    }
}

// == ERASER 🧼 ==
class asciiBox_Erase extends asciiBox_Tool {
    constructor(manager) {
        super('Erase', manager);
    }
    onSetTool() {
        this.manager.db.worldContainer.classList.add('css-ascii-crosshair');
    }
    onSetOffTool() {
        this.manager.db.worldContainer.classList.remove('css-ascii-crosshair');
    }
    onMouseDown(args) {
        if( this.isActive == true ) return
        this.activate();
        this.manager.db.newCharAt(args[0], args[1], ' ');
        this.isActive = true;
    }
    onMouseEnter(args) {
        this.lastKnownedPosition = args;
        if (!this.isActive) return;
        this.manager.db.newCharAt(args[0], args[1], ' ');
    }
    onMouseUp() {
        // Make the drawing and save it
        if (!this.isActive) return;
        // We save the current state
        this.manager.db.saveToHistory();
        this.deactivate();
    }
    onEscape() {
        // Cancel the drawing if the tool is active
        if (!this.isActive) return;
        console.log('⛔️ WE CANCEL');

        this.manager.db.restoreLastHistory();
        this.manager.db.updateWorld();
        
        // Initialise again the tool
        this.detail = deepCopyObjectWithArrays(this.detailSetup);
        this.deactivate();
    }
}

// == BRUSH 🖌 ==
class asciiBox_Brush extends asciiBox_Tool {
    constructor(manager) {
        super('Brush', manager);

        this.brushSelector = document.querySelector(".js-brush-selector")
        this.brushChar = document.querySelector(".js-current-brush")
        this.char = '•'

        this.initiateBrushTool();
    }
    // == INITIATE ==
    initiateBrushTool() {

        let brushCharacters = [
            '▁▂▃▄▅▆▇█▉▊▋▌▍▎▏▔▕',
            '▖▗▘▝▄▀▌▐▚▞▙▛▜▟█▓▒░',
            '■□▢▣▤▥▦▧▨▩▪▫▬▭▮▯',
            '▰▱▲△▴▵▶▷▸▹►▻▼▽▾▿',
            '◀◁◂◃◄◅◆◇◈◉◊○◌◍◎●',
            '◐◑◒◓◔◕◖◗◘◙◚◛◜◝◞◟',
            '◠◡◢◣◤◥◦◧◨◩◪◫◬◭◮◯',
            '◰◱◲◳◴◵◶◷◸◹◺◻◼◽◾',
            '╱╲╳',
        ]
        const table = document.querySelector('.js-brush-selector table');
        for (let i=0; i<brushCharacters.length; i++) {
            const row = table.insertRow();
            for (let j=0; j<brushCharacters[i].length; j++) {
                const cell = row.insertCell();
                cell.textContent = brushCharacters[i][j];
            }
        }

        // Show brushSelector when clicked
        this.brushChar.addEventListener('click', () => {
            console.log('remove')
            this.brushSelector.classList.remove('hidden');
        });
        
        // Event delegation to handle clicks on table cells
        this.brushSelector.addEventListener('click', (e) => {
            if (e.target.tagName === 'TD') {
                let targetChar = e.target.textContent
                this.char = targetChar;
                this.brushChar.textContent = targetChar;
            }
            this.brushSelector.classList.add('hidden');
        });
        
    }


    onSetTool() {
        this.manager.db.worldContainer.classList.add('css-ascii-crosshair');
    }
    onSetOffTool() {
        this.manager.db.worldContainer.classList.remove('css-ascii-crosshair');
    }

    onMouseDown(args) {
        if (this.isActive) return;
        // console.log('CLICK AT', args);
        this.activate();
        this.manager.db.newCharAt(args[0], args[1], this.char);
    }

    onMouseEnter(args) {
        // We update the last visited tile coordinates
        this.lastKnownedPosition = args;
        if (!this.isActive) return;
        this.manager.db.newCharAt(args[0], args[1], this.char);
        // console.log('BRUSH AT', args);
    }

    onMouseUp() {
        // Make the drawing and save it
        if (!this.isActive) return;
        this.manager.db.saveToHistory();
        this.deactivate();
    }

    onEscape() {
        // Cancel the drawing if the tool is active
        if (!this.isActive) return;
        console.log('⛔️ WE CANCEL');
        this.manager.db.restoreLastHistory();
        this.manager.db.updateWorld();
        this.deactivate();
    }
}

// == WRITE TEXT 🖍 == 
class asciiBox_WriteText extends asciiBox_Tool {
    constructor(manager) {
        super('WRITE TEXT', manager);
        // We assume the database was declared and named 'db'
    }
    
    onSetTool() {
        this.manager.db.worldContainer.classList.add('css-ascii-text');
    }
    onSetOffTool() {
        this.manager.db.worldContainer.classList.remove('css-ascii-text');
    }

    onMouseUp(args) {
        // if (this.isActive) return;
        this.manager.db.textInputFocusIn(args);
    }

    onMouseEnter(args) {
        this.lastKnownedPosition = args;
    }
}

// == WORKSPACE == 
class asciiBox_Workspace extends asciiBox_Tool {
    constructor(manager) {
        super('WORKSPACE', manager);
        this.isSet = false;
        this.isDragging = false;
        this.aChangeOccured = false;
        this.startDragX,
        this.startDragY;
        this.table;
        this.cellHeight;
        this.cellWidth;

        this.deltaSaved = [0,0];
        this.cornerPositionSaved = [0,0];
        this.cornerPositionCurrent = [0,0];
        this.cornerCurrent = null;
        
        this.height;
        this.width;
    }

    onSetTool() {
        this.manager.db.worldSizeHandle.classList.add('active');
        if(!this.isSet) {
            this.table = this.manager.db.worldTable;
            this.cellHeight = this.table.rows[0].cells[0].clientHeight;
            this.cellWidth = this.table.rows[0].cells[0].clientWidth;

            // console.log('this.cellWidth, this.cellHeight :', this.cellWidth, this.cellHeight);

            // Add mousedown event listener for each handle
            ['ne', 'se', 'sw', 'nw', 'n', 's', 'e', 'w'].forEach(handleId => {
                document.getElementById(handleId).addEventListener('mousedown', (e) => {
                    this.isDragging = true;
                    this.startDragX = e.clientX;
                    this.startDragY = e.clientY;
                    this.height = this.manager.db.height;
                    this.width = this.manager.db.width;
                    this.id = handleId;
                    if(this.id == 'ne'||this.id == 'sw') this.manager.db.worldContainer.classList.add('css-ascii-nesw-resize');
                    if(this.id == 'nw'||this.id == 'se') this.manager.db.worldContainer.classList.add('css-ascii-nwse-resize');
                    if(this.id == 'n'||this.id == 's') this.manager.db.worldContainer.classList.add('css-ascii-ns-resize');
                    if(this.id == 'e'||this.id == 'w') this.manager.db.worldContainer.classList.add('css-ascii-ew-resize');
                    e.preventDefault(); // Prevent default to avoid any unwanted behavior like text selection
                });
            });

            document.addEventListener('mousemove', (e) => {
                if (!this.isDragging) return;
                this.updateOnDrag(e.clientX, e.clientY, this.id);
            });

            document.addEventListener('mouseup', () => {
                this.isDragging = false;
                if(this.id == 'ne'||this.id == 'sw') this.manager.db.worldContainer.classList.remove('css-ascii-nesw-resize');
                if(this.id == 'nw'||this.id == 'se') this.manager.db.worldContainer.classList.remove('css-ascii-nwse-resize');
                if(this.id == 'n'||this.id == 's') this.manager.db.worldContainer.classList.remove('css-ascii-ns-resize');
                if(this.id == 'e'||this.id == 'w') this.manager.db.worldContainer.classList.remove('css-ascii-ew-resize');
            });
        }
    }
    onSetOffTool() {
        if(this.aChangeOccured) this.manager.db.saveToHistory();
        this.manager.db.worldSizeHandle.classList.remove('active');
    }

    onEscape() {
        // Cancel the drawing
        // console.log('this.isDragging', this.isDragging);
        // if (!this.isDragging) return;
        console.log('⛔️ WE CANCEL');
        this.deactivate();
        this.manager.db.restoreLastHistory();
        this.manager.db.updateWorld();
    }
    onEnter() {
        // console.log('ENTER');
        this.manager.db.setTool('Select');
    }
    onDelete() {
        this.onEscape();
    }

    deactivate() {
        this.isDragging = false;
        if(this.id == 'ne'||this.id == 'sw') this.manager.db.worldContainer.classList.remove('css-ascii-nesw-resize');
        if(this.id == 'nw'||this.id == 'se') this.manager.db.worldContainer.classList.remove('css-ascii-nwse-resize');
        if(this.id == 'n'||this.id == 's') this.manager.db.worldContainer.classList.remove('css-ascii-ns-resize');
        if(this.id == 'e'||this.id == 'w') this.manager.db.worldContainer.classList.remove('css-ascii-ew-resize');
    }

    updateOnDrag(currentDragX, currentDragY, handleId) {
        let deltaX = currentDragX - this.startDragX; // px
        let deltaY = currentDragY - this.startDragY; // px
        const cellWidth = this.cellWidth/2*this.manager.db.scale;
        const cellHeight = this.cellHeight/2*this.manager.db.scale;
        deltaX = Math.round(deltaX/cellWidth); // cellsize wise
        deltaY = Math.round(deltaY/cellHeight); // cellsize wise
        let currentWidth = this.width;
        let currentHeight = this.height;

        // Correct for single-axis handles
        switch (handleId) {
            case 'n':
            case 's':
                deltaX = 0;
                break;
            case 'w':
            case 'e':
                deltaY = 0;
                break;
        }
        // console.log('currentWidth, currentHeight : ', currentWidth, currentHeight);
        // console.log('deltaX, deltaY : ', deltaX, deltaY);
        // console.log('Math.round(deltaX/this.cellWidth) : ', Math.round(deltaX/this.cellWidth));
        // console.log('currentWidth, currentHeight : ', currentWidth, currentHeight);
        // console.log('currentWidth!=this.manager.db.width : ', currentWidth!=this.manager.db.width);

        if (deltaX!=this.deltaSaved[0] || deltaY!=this.deltaSaved[1]) {
            if(!this.aChangeOccured) this.aChangeOccured = true;
            this.deltaSaved = [deltaX, deltaY];

            if (handleId != this.cornerCurrent) {
                this.cornerCurrent = handleId;
                this.cornerPositionSaved[0] += this.cornerPositionCurrent[0];
                this.cornerPositionSaved[1] += this.cornerPositionCurrent[1];
            }

            switch (handleId) {
                case 'ne':
                    currentWidth += deltaX;
                    currentHeight -= deltaY;
                    this.cornerPositionCurrent = [0, -deltaY];
                    break;
                case 'se':
                    currentWidth += deltaX;
                    currentHeight += deltaY;
                    this.cornerPositionCurrent = [0, 0];
                    break;
                case 'sw':
                    currentWidth -= deltaX;
                    currentHeight += deltaY;
                    this.cornerPositionCurrent = [-deltaX, 0];
                    break;
                case 'nw':
                    currentWidth -= deltaX;
                    currentHeight -= deltaY;
                    this.cornerPositionCurrent = [-deltaX, -deltaY];
                    break;
                case 'n':
                    currentHeight -= deltaY;
                    this.cornerPositionCurrent = [0, -deltaY];
                    break;
                case 'w':
                    currentWidth -= deltaX;
                    this.cornerPositionCurrent = [-deltaX, 0];
                    break;
                case 's':
                    currentHeight += deltaY;
                    this.cornerPositionCurrent = [0, 0];
                    break;
                case 'e':
                    currentWidth += deltaX;
                    this.cornerPositionCurrent = [0, 0];
                    break;
            }
            if(!this.aChangeOccured) this.aChangeOccured = true;

            // console.log('current, saved : ', this.cornerPositionCurrent, this.cornerPositionSaved )
            let x = this.cornerPositionCurrent[0] + this.cornerPositionSaved[0];
            let y = this.cornerPositionCurrent[1] + this.cornerPositionSaved[1];

            // Le but c'est de garder le coin en haut à gauche, et de le passer en argument x et y, plutot que de doner l'ID
            this.manager.db.updateShape(currentWidth, currentHeight, [x, y]);
        }
    }
}

// == MOVEMENT == 
class asciiBox_Movement extends asciiBox_Tool {
    constructor(manager) {
        super('MOVEMENT', manager);
        this.elem= false
        this.isSet=false;
        this.isDragging = false;
        this.startDragX,
        this.startDragY;
        this.deltaX;
        this.deltaY;
        this.savedDelta = [0, 0];
    }

    onSetTool() {
        if(!this.isSet) {
            this.isSet = true;

            // We add UI MOVEMENT
            const movement= document.createElement("div");
            movement.id= 'css-ascii-movement';
            movement.classList.add('css-ascii-grab');
            this.manager.db.worldContainer.appendChild(movement);
            this.elem = movement;

            this.elem.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.isDragging = true;
                this.startDragX = e.clientX;
                this.startDragY = e.clientY;
                this.elem.classList.add('css-ascii-grabbing');
            });

            this.elem.addEventListener('mousemove', (e) => {
                if (!this.isDragging) return;
                this.deltaX = e.clientX - this.startDragX; // px
                this.deltaY = e.clientY - this.startDragY; // px
                let x = -this.deltaX + this.savedDelta[0];
                let y = - this.deltaY + this.savedDelta[1];
                this.manager.db.worldTableContainer.style.setProperty('--ascii-container-x', x+'px');
                this.manager.db.worldTableContainer.style.setProperty('--ascii-container-y', y+'px');
                // console.log('deltaX, deltaY :', this.deltaX, this.deltaY);
            });

            this.elem.addEventListener('mouseup', () => {
                this.savedDelta[0] -= this.deltaX;
                this.savedDelta[1] -= this.deltaY;
                console.log('🏃‍♂️ MOVEMENT :', this.savedDelta);
                this.isDragging = false; 
                this.elem.classList.remove('css-ascii-grabbing');
            });
        }  
        this.elem.classList.add('active');
    }
    onSetOffTool() {
        this.elem.classList.remove('active');
    }

    onDelete() {
        
    }
}


// == ROSETTA 🗿 ==
// Translation between code in array forms to char element
class asciiBox_Rosetta {
    constructor() {
        /**
         *  ROSETTA
         *  [ haut, droite, bas, gauche ] (ref https://en.wikipedia.org/wiki/Box_Drawing)
         *      -- BASE --
         *      '0': rien
         *      '1': trait
         *      '2': trait épais
         *      '3': double trait
         *      -- BONUS --
         *      '4': pointillé 2
         *      '5': pointillé 2 épais
         *      '6': pointillé 3
         *      '7': pointillé 3 épais
         *      '8': pointillé 4
         *      '9': pointillé 4 épais
         */
        this.rosetta = {
            // ' ': [0, 0, 0, 0],
            '╵': [1, 0, 0, 0],
            '╹': [2, 0, 0, 0],
            '╶': [0, 1, 0, 0],
            '╺': [0, 2, 0, 0],
            '╷': [0, 0, 1, 0],
            '╻': [0, 0, 2, 0],
            '╴': [0, 0, 0, 1],
            '╸': [0, 0, 0, 2],
            '─': [0, 1, 0, 1],
            '╼': [0, 2, 0, 1],
            '╾': [0, 1, 0, 2],
            '━': [0, 2, 0, 2],
            '│': [1, 0, 1, 0],
            '╿': [2, 0, 1, 0],
            '╽': [1, 0, 2, 0],
            '┃': [2, 0, 2, 0],
            '└': [1, 1, 0, 0],
            '┕': [1, 2, 0, 0],
            '┖': [2, 1, 0, 0],
            '┗': [2, 2, 0, 0],
            '┌': [0, 1, 1, 0],
            '┍': [0, 2, 1, 0],
            '┎': [0, 1, 2, 0],
            '┏': [0, 2, 2, 0],
            '┐': [0, 0, 1, 1],
            '┑': [0, 0, 1, 2],
            '┒': [0, 0, 2, 1],
            '┓': [0, 0, 2, 2],
            '┘': [1, 0, 0, 1],
            '┙': [1, 0, 0, 2],
            '┚': [2, 0, 0, 1],
            '┛': [2, 0, 0, 2],
            '├': [1, 1, 1, 0],
            '┝': [1, 2, 1, 0],
            '┞': [2, 1, 1, 0],
            '┟': [1, 1, 2, 0],
            '┠': [2, 1, 2, 0],
            '┡': [2, 2, 1, 0],
            '┢': [1, 2, 2, 0],
            '┣': [2, 2, 2, 0],
            '┤': [1, 0, 1, 1],
            '┥': [1, 0, 1, 2],
            '┦': [2, 0, 1, 1],
            '┧': [1, 0, 2, 1],
            '┨': [2, 0, 2, 1],
            '┩': [2, 0, 1, 2],
            '┪': [1, 0, 2, 2],
            '┫': [2, 0, 2, 2],
            '┬': [0, 1, 1, 1],
            '┭': [0, 1, 1, 2],
            '┮': [0, 2, 1, 1],
            '┯': [0, 2, 1, 2],
            '┰': [0, 1, 2, 1],
            '┱': [0, 1, 2, 2],
            '┲': [0, 2, 2, 1],
            '┳': [0, 2, 2, 2],
            '┴': [1, 1, 0, 1],
            '┵': [1, 1, 0, 2],
            '┶': [1, 2, 0, 1],
            '┷': [1, 2, 0, 2],
            '┸': [2, 1, 0, 1],
            '┹': [2, 1, 0, 2],
            '┺': [2, 2, 0, 1],
            '┻': [2, 2, 0, 2],
            '┼': [1, 1, 1, 1],
            '┽': [1, 1, 1, 2],
            '┾': [1, 2, 1, 1],
            '┿': [1, 2, 1, 2],
            '╀': [2, 1, 1, 1],
            '╁': [1, 1, 2, 1],
            '╂': [2, 1, 2, 1],
            '╃': [2, 1, 1, 2],
            '╄': [2, 2, 1, 1],
            '╅': [1, 1, 2, 2],
            '╆': [1, 2, 2, 1],
            '╇': [2, 2, 1, 2],
            '╈': [1, 2, 2, 2],
            '╉': [2, 1, 2, 2],
            '╊': [2, 2, 2, 1],
            '╋': [2, 2, 2, 2],
            '═': [0, 3, 0, 3],
            '║': [3, 0, 3, 0],
            '╒': [0, 3, 1, 0],
            '╓': [0, 1, 3, 0],
            '╔': [0, 3, 3, 0],
            '╕': [0, 0, 1, 3],
            '╖': [0, 0, 3, 1],
            '╗': [0, 0, 3, 3],
            '╘': [1, 3, 0, 0],
            '╙': [3, 1, 0, 0],
            '╚': [3, 3, 0, 0],
            '╛': [1, 0, 0, 3],
            '╜': [3, 0, 0, 1],
            '╝': [3, 0, 0, 3],
            '╞': [1, 3, 1, 0],
            '╟': [3, 1, 3, 0],
            '╠': [3, 3, 3, 0],
            '╡': [1, 0, 1, 3],
            '╢': [3, 0, 3, 1],
            '╣': [3, 0, 3, 3],
            '╤': [0, 3, 1, 3],
            '╥': [0, 1, 3, 1],
            '╦': [0, 3, 3, 3],
            '╧': [1, 3, 0, 3],
            '╨': [3, 1, 0, 1],
            '╩': [3, 3, 0, 3],
            '╪': [1, 3, 1, 3],
            '╫': [3, 1, 3, 1],
            '╬': [3, 3, 3, 3],
            // ARROWS
            '▼': [10, 0, 0, 0],
            '◀': [0, 10, 0, 0],
            '▲': [0, 0, 10, 0],
            '▶': [0, 0, 0, 10],
            '▽': [11, 0, 0, 0],
            '◁': [0, 11, 0, 0],
            '△': [0, 0, 11, 0],
            '▷': [0, 0, 0, 11],
            // '╱': [, , , ], // ok au clic
            // '╲': [, , , ], // ok au clic
            // '╳': [, , , ], // ok au clic
        }
        this.rosettaAlternative = {
            // ROUNDED ANGLES
            1: {
                '╭': [0, 1, 1, 0],
                '╮': [0, 0, 1, 1],
                '╯': [1, 0, 0, 1],
                '╰': [1, 1, 0, 0],
            },
            // TRAITS POINTILLES
            11: {
                '╌': [0, 1, 0, 1],
                '╎': [1, 0, 1, 0],
            },
            12: {
                '╍': [0, 1, 0, 1],
                '╏': [1, 0, 1, 0],
            },
            13: {
                '┄': [0, 1, 0, 1],
                '┆': [1, 0, 1, 0],
            },
            14: {
                '┅': [0, 1, 0, 1],
                '┇': [1, 0, 1, 0],
            },
            15: {
                '┈': [0, 1, 0, 1],
                '┊': [1, 0, 1, 0],
            },
            16: {
                '┉': [0, 1, 0, 1],
                '┋': [1, 0, 1, 0],
            }
        };
    }

    // Retrieve CHAR
    getCodeFromChar(char) {
        // Check the values
        let code = this.rosetta[char] || null; 
        // Check in the alternatives as well
        if(!code) {
            Object.keys(this.rosettaAlternative).some(key => {
                const alternatives = this.rosettaAlternative[key];
                if (alternatives[char]) {
                    code = alternatives[char];
                    return true; // Stop iterating once the code is found
                }
                return false; // Continue iterating
            });
        }
        return code
    }

    // Retrieve CODE
    getCharFromCode(code) {
        for (const [char, value] of Object.entries(this.rosetta)) {
            if (value.toString() === code.toString()) {
                return char;
            }
        }
        return null; // Return null if no match is found
    }
    getCharFromCodeAlternative(code, index) {
        for (const [char, value] of Object.entries(this.rosettaAlternative[index])) {
            if (value.toString() === code.toString()) {
                return char;
            }
        }
        return null; // Return null if no match is found
    }
}


// ===============
// == BUNDLE 🍭 == 
// ===============

function deepCopyObjectWithArrays(obj) {
    const copy = {};
    for (const [key, value] of Object.entries(obj)) {
        // Check if the value is an array
        if (Array.isArray(value)) {
            copy[key] = copyArray(value); // Shallow copy the array
        } else if (typeof value === 'object' && value !== null) {
            // Recursively copy for nested objects
            copy[key] = deepCopyObjectWithArrays(value);
        } else {
            copy[key] = value;
        }
    }
    return copy;
}

function copyArray(input) {
    return input.map(innerArray => 
        Array.isArray(innerArray) ? copyArray(innerArray) : innerArray
    );
}

function combineArrays(A, B) {
    if (A.length !== B.length) {
        console.error("ERROR: Arrays are not of the same length.");
        console.log(A);
        console.log(B);
        return;
    }
    return A.map((item, index) => item === 0 ? B[index] : item);
}

function arraysEqual(a, b) {
    if(!a || !b) return false

    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

function arraysHaveSameSize(array1, array2) {
    // Check if both arrays have the same number of rows
    if (array1.length !== array2.length) {
        return false;
    }

    // Check if each row in both arrays has the same number of columns
    for (let i = 0; i < array1.length; i++) {
        // If one of the arrays does not have a row where the other does, return false
        if (!array1[i] || !array2[i]) {
            return false;
        }

        // If the lengths of the rows are different, return false
        if (array1[i].length !== array2[i].length) {
            return false;
        }
    }

    return true;
}



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
