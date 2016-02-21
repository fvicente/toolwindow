/**
 * toolwindow.js
 *
 * BSD License (public domain)
 *
 * Copyright (c) 2008, AlferSoft (www.alfersoft.com.ar)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the company nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY AlferSoft ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AlferSoft BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Disable text selection for given element.
 * @param element {Object} - The element to disable text selection
 */
function disableTextSelection(element) {
	if(!element) {
		return;
	}
	if(typeof element.onselectstart != "undefined") {	// ie
		element.onselectstart = function() { return false; };
	} else if(typeof element.style.MozUserSelect != "undefined") { // firefox
		element.style.MozUserSelect = "none";
	} else if(Prototype.Browser.IE) {
		element.onselectstart = function() { return false; }	// another ie
	} else {
		element.onmousedown = function() { return false; }		// other mozilla
	}
}
ToolWindow = Class.create({
	makeResizer: function(parent, obj, type) {
		obj.initialX = 0;
		obj.initialY = 0;
		obj.type = type;
		obj.parent = parent;
		switch(type) {
		case "e":
			obj.resizeParent = function(objPosX, objPosY, objWidth, objHeight, diffX, diffY) {
				this.parent.setPosition(objPosX, objPosY);
				this.parent.setDimension(objWidth - diffX, objHeight);
			}
			obj.reposition = function() {
				this.setStyle({ zIndex: 99985, cursor: this.getCursor(), width: '4px', height: '100%', top: '0px', left: '0px' });
			}
			break;
		case "se":
			obj.resizeParent = function(objPosX, objPosY, objWidth, objHeight, diffX, diffY) {
				this.parent.setPosition(objPosX, objPosY);
				this.parent.setDimension(objWidth - diffX, objHeight - diffY);
			}
			obj.reposition = function() {
				this.setStyle({ zIndex: 99985, cursor: this.getCursor(), width: '100%', height: '4px', top: '0px', left: '0px' });
			}
			break;
		case "s":
			obj.resizeParent = function(objPosX, objPosY, objWidth, objHeight, diffX, diffY) {
				this.parent.setPosition(objPosX, objPosY);
				this.parent.setDimension(objWidth, objHeight - diffY);
			}
			obj.reposition = function() {
				this.setStyle({ zIndex: 99985, cursor: this.getCursor(), width: '100%', height: '4px', top: '0px', left: '0px' });
			}
			break;
		case "sw":
			obj.resizeParent = function(objPosX, objPosY, objWidth, objHeight, diffX, diffY) {
				this.parent.setPosition(objPosX - diffX, objPosY);
				this.parent.setDimension(objWidth + diffX, objHeight - diffY);
			}
			obj.reposition = function() {
				this.setStyle({ zIndex: 99985, cursor: this.getCursor(), width: '100%', height: '4px', top: '0px', left: '0px' });
			}
			break;
		case "w":
			obj.resizeParent = function(objPosX, objPosY, objWidth, objHeight, diffX, diffY) {
				this.parent.setPosition(objPosX - diffX, objPosY);
				this.parent.setDimension(objWidth + diffX, objHeight);
			}
			obj.reposition = function() {
				this.setStyle({ zIndex: 99985, cursor: this.getCursor(), width: '4px', height: '100%', top: '0px', left: '0px' });
			}
			break;
		}
		obj.getCursor = function() {
			return(this.type + '-resize');
		}
		obj.reposition();	// note that getCursor() is defined first
		obj.draggable = new Draggable(obj, {
			onStart: function(draggable, event) {
				document.body.style.cursor = this.getCursor();
			}.bind(obj),
			onEnd: function(draggable, event) {
				document.body.style.cursor = 'default';
				this.reposition()
				event.stop();
			}.bind(obj),
			onDrag: function(draggable, event) {
				var objPosX = this.parent.getX();
				var objPosY = this.parent.getY();
				var objWidth = this.parent.getW();
				var objHeight = this.parent.getH();
				var diffX = this.initialX - event.screenX;
				var diffY = this.initialY - event.screenY;
				this.resizeParent(objPosX, objPosY, objWidth, objHeight, diffX, diffY);
				if(objPosX != this.parent.getX() || objWidth != this.parent.getW()) {
					this.initialX = event.screenX;
				}
				if(objPosY != this.parent.getY() || objHeight != this.parent.getH()) {
					this.initialY = event.screenY;
				}
			}.bind(obj)
		});
		Event.observe(obj, "mousedown",
	    	function(event) {
				this.initialX = event.screenX;
				this.initialY = event.screenY;
	    	}.bind(obj));
	},
	createResizingItems: function(container) {
		// resizing items
		var resizer;
		var orient = ["e", "w", "s", "se", "sw"];
		var cont = [this.eastContainer, this.westContainer, this.southContainer, this.southEastContainer, this.southWestContainer]
		for(var i = 0; i < orient.length; i++) {
			resizer = $(new Element("div"));
			this.makeResizer(container, resizer, orient[i]);
			cont[i].appendChild(resizer);
		}
	},
	createHeaderTable: function(title) {
		/*
			Creates a table header like this:

			<table cellpadding="0" cellspacing="0" class="titleBarTable">
			<tbody>
				<tr>
					<td class="titleBarLeft"></td>
					<td class="titleBar"><div>title</div></td>
					<td class="titleBarRight"></td>
				</tr>
			</tbody>
			</table>
		*/
		var auxTable = new Element("table");
		auxTable.cellPadding = '0';
		auxTable.cellSpacing = '0';
		auxTable.addClassName('titleBarTable');
		var auxTableBody = new Element("tbody");
		auxTable.appendChild(auxTableBody);
		var auxRow = new Element("tr");
		var auxCol;
		auxCol = new Element("td");
		auxCol.addClassName('titleBarLeft');
		auxRow.appendChild(auxCol);
		auxCol = new Element("td");
		auxCol.addClassName('titleBar');
		var auxTitleDiv = new Element("div");
		auxTitleDiv.update(title);
		auxCol.appendChild(auxTitleDiv);
		auxRow.appendChild(auxCol);
		auxCol = new Element("td");
		auxCol.addClassName('titleBarRight');
		auxRow.appendChild(auxCol);
		auxTableBody.appendChild(auxRow);
		disableTextSelection(auxTable);
		return(auxTable);
	},
	createContainerLayout: function(container, element) {
		/* creates a container layout */
		this.westContainer = new Element("div", { 'class': 'westContainer' });
		container.appendChild(this.westContainer);
		this.eastContainer = new Element("div", { 'class': 'eastContainer' });
		container.appendChild(this.eastContainer);
		this.southContainer = new Element("div", { 'class': 'southContainer' });
		container.appendChild(this.southContainer);
		this.southWestContainer = new Element("div", { 'class': 'southWestContainer' });
		container.appendChild(this.southWestContainer);
		this.southEastContainer =  new Element("div", { 'class': 'southEastContainer' });
		container.appendChild(this.southEastContainer);
		this.mainContainer = $(new Element("div", { 'class': 'mainContainer' }));
		this.mainContainer.appendChild(element);
		container.appendChild(this.mainContainer);
		return(container);
	},
	initialize: function(clazz, title, content) {
		/* create the tool window */
		this.container = $(new Element("div", { 'class': clazz, style: 'overflow: hidden;' }));
		this.container.getX = function() { return(parseInt(this.getStyle('left') || '0')); }.bind(this.container);
		this.container.getY = function() { return(parseInt(this.getStyle('top') || '0')); }.bind(this.container);
		this.container.getW = function() { return(parseInt(this.getStyle('width') || '0')); }.bind(this.container);
		this.container.getH = function() { return(parseInt(this.getStyle('height') || '0')); }.bind(this.container);
		this.container.setPosition = function(x, y) {
			this.setStyle({ left: x + 'px', top: y + 'px' });
		}.bind(this.container);
		this.container.setDimension = function(w, h) {
			if(w < 0) w = 0;
			if(h < 0) h = 0;
			this.setStyle({ width: w + 'px', height: h + 'px' });
		}.bind(this.container);
		this.titleBarContainer = $(new Element("div", { 'class': 'titleBarContainer' }));
		this.titleBarContainer.appendChild(this.createHeaderTable(title));
		this.container.appendChild(this.titleBarContainer);
		this.windowContainer = $(new Element("div", { 'class': 'windowContainer' }));
		this.createContainerLayout(this.windowContainer, content)
		this.container.appendChild(this.windowContainer);
		this.createResizingItems(this.container);
		new Draggable(this.container, { zindex: 99985 });
		// add it to the document
		document.body.appendChild(this.container);
		return(this);
	}
});

