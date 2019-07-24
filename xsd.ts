import { Component } from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
   XML_SCHEMA = `
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema  xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:simpleType name="C">
        <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
        </xs:restriction>
    </xs:simpleType>
    <xs:simpleType name="Char_20">
        <xs:restriction base="C">
            <xs:minLength value="1"/>
            <xs:maxLength value="20"/>
        </xs:restriction>
    </xs:simpleType>
</xs:schema>
`;

 sInitial = 0;
 sDeclaration = 1;
 sPreElement = 2;
 sElement = 3;
 sAttribute = 5;
 sAttrNML = 6; // No Mans Land
 sValue = 7;
 sEndElement = 9;
 sContent = 11;
 sAttributeSpacer = 12;
 sComment = 13;
 sProcessingInstruction = 15;
 sCData = 17;
 sDocType = 19;
 sDTD = 21;
 sError = 23;
 sEndDocument = 25;
  constructor() {
    this.getJSON();
  }
  getJSON() {
    const obj = this.parseString(this.XML_SCHEMA, {'attributePrefix': '@','valueProperty': false,
     'coerceTypes': false});
     console.log(JSON.stringify(obj));
     

  }



 stateName(state) {
	if (state == this.sInitial) {
		return 'INITIAL';
	}
	else if (state == this.sDeclaration) {
		return 'DECLARATION';
	}
	else if (state == this.sElement) {
		return 'ELEMENT';
	}
	else if (state == this.sAttribute) {
		return 'ATTRIBUTE';
	}
	else if (state == this.sValue) {
		return 'VALUE';
	}
	else if (state == this.sEndElement) {
		return 'END_ELEMENT';
	}
	else if (state == this.sContent) {
		return 'CONTENT';
	}
	else if (state == this.sComment) {
		return 'COMMENT';
	}
	else if (state == this.sProcessingInstruction) {
		return 'PROCESSING_INSTRUCTION';
	}
	else if (state == this.sCData) {
		return 'CDATA';
	}
	else if (state == this.sDocType) {
		return 'DOCTYPE';
	}
	else if (state == this.sDTD) {
		return 'DTD';
	}
	else if (state == this.sError) {
		return 'ERROR';
	}
	else if (state == this.sEndDocument) {
		return 'END_DOCUMENT';
	}
}

 reset(context) {
	context.state = this.sInitial;
	context.newState = this.sInitial;
	context.token = '';
	context.boundary = ['<?','<'];
	context.bIndex = -1;
	context.lastElement = '';
	context.keepToken = false;
	context.position = 0;
	context.depth = 0;
	context.wellFormed = false;
	context.validControlChars = ['\t','\r','\n'];
	context.error = false;
}

// to create a push parser, pass in a callback function and omit the context parameter
// to create a pull parser, pass in null for the callback function and initially provide an empty object as the context
 jgeParse(s,callback,context) {

	if (context && context.newState) {
		if (!context.keepToken) context.token = '';
		context.state = context.newState;
	}
	else {
		context = {};
		this.reset(context);
	}

	let c;
	for (let i=context.position;i<s.length;i++) {
		c = s.charAt(i);
		if ((c.charCodeAt(0) < 32) && (context.validControlChars.indexOf(c) < 0)) {
			context.newState = context.state = this.sError;
		}

		if (context.state != this.sContent) {
			if (context.validControlChars.indexOf(c) >= 0) { //other unicode spaces are not treated as whitespace
				c = ' ';
			}
		}

		context.bIndex = -1;
		for (let b=0;b<context.boundary.length;b++) {
			if (s.substr(i,context.boundary[b].length) == context.boundary[b]) {
				context.bIndex = b;
				if (context.boundary[context.bIndex].length>1) {
					i = i + context.boundary[context.bIndex].length-1;
				}
				break;
			}
		}

		if (context.bIndex >= 0) {

			if ((context.state != this.sValue) && (context.state != this.sComment)) { // && (context.state != sContent)
				context.token = context.token.trim();
			}

			context.keepToken = false;
			if (((context.state & 1) == 1) && ((context.token.trim() !== '') || context.state == this.sValue)) {
				// TODO test element names for validity (using regex?)
				if (context.state != this.sCData) {
          console.log(context.token);
          

					if (context.token.indexOf('&#') >= 0) {
						context.token = context.token.replace(/&(?:#([0-9]+)|#x([0-9a-fA-F]+));/g, function(match, group1, group2) {
							let e;
							if (group2) {
								e = String.fromCharCode(parseInt(group2,16));
								if ((e.charCodeAt(0) < 32) && (context.validControlChars.indexOf(e) < 0)) {
									context.newState = context.state = this.sError;
								}
								return e;
							}
							else {
								e = String.fromCharCode(group1);
								if ((e.charCodeAt(0) < 32) && (context.validControlChars.indexOf(e) < 0)) {
									context.newState = context.state = this.sError;
								}
								return e;
							}
						});
					}
				}

				if (context.state == this.sElement) context.depth++;
				else if (context.state == this.sEndElement) {
					context.depth--;
					if (context.depth<0) {
						context.newState = context.state = this.sError;
					}
				}
				if (context.state == this.sError) {
					context.error = true;
				}
				if (callback) {
					callback(context.state,context.token);
				}
				if (context.state == this.sError) {
					context.boundary = [];
				}
			}

			if (context.state == this.sInitial) {
				if (context.boundary[context.bIndex] == '<?') {
					context.newState = this.sDeclaration;
					context.boundary = ['?>'];
				}
				else {
					context.newState = this.sElement;
					context.boundary = ['>',' ','/','!--','?','!DOCTYPE','![CDATA['];
					context.boundary = context.boundary.concat(context.validControlChars);
				}
			}
			else if (context.state == this.sDeclaration) {
				context.newState = this.sPreElement;
				context.boundary = ['<'];
				if (context.token.indexOf('1.1')>0) {
					context.validControlChars.push('\u2028','\u0085','\u0015');
				}
			}
			else if (context.state == this.sPreElement) {
				context.newState = this.sElement;
				context.boundary = ['>',' ','/','!--','?','!DOCTYPE','![CDATA['];
				context.boundary = context.boundary.concat(context.validControlChars);
			}
			else if (context.state == this.sElement) {
				context.lastElement = context.token;
				if (c == '>') {
					context.newState = this.sContent;
					context.boundary = ['<!DOCTYPE','<'];
				}
				else if (c == ' ') {
					context.newState = this.sAttribute;
					context.boundary = ['/','=','>'];
				}
				else if (c == '/') {
					context.newState = this.sEndElement;
					context.boundary = ['>'];
					context.keepToken = true;
				}
				else if (c == '?') {
					context.newState = this.sProcessingInstruction;
					context.boundary = ['?>'];
				}
				else if (context.boundary[context.bIndex] == '!--') {
					context.newState = this.sComment;
					context.boundary = ['-->'];
				}
				else if (context.boundary[context.bIndex] == '![CDATA[') {
					context.newState = this.sCData;
					context.boundary = [']]>'];
				}
				else if (context.boundary[context.bIndex] == '!DOCTYPE') {
					context.newState = this.sDocType;
					context.boundary = ['>','['];
				}
			}
			else if (context.state == this.sAttribute) {
				if (c == '=' ) {
					context.newState = this.sAttrNML;
					context.boundary = ['\'','"'];
				}
				else if (c == '>') {
					context.newState = this.sContent;
					context.boundary = ['<!DOCTYPE','<'];
				}
				else if (c == '/') {
					context.newState = this.sEndElement;
					context.keepToken = true;
					context.state = this.sAttributeSpacer; // to stop dummy attributes being emitted to pullparser
					context.token = context.lastElement;
				}
			}
			else if (context.state == this.sAttrNML) {
				context.newState = this.sValue;
				context.boundary = [c];
			}
			else if (context.state == this.sValue) {
				context.newState = this.sAttribute;
				context.boundary = ['=','/','>'];
			}
			else if (context.state == this.sEndElement) {
				if (context.depth !== 0) context.newState = this.sContent;
				context.boundary = ['<']; // don't allow DOCTYPE's after the first sEndElement
			}
			else if (context.state == this.sContent) {
				if (context.boundary[context.bIndex] == '<!DOCTYPE') {
					context.newState = this.sDocType;
					context.boundary = ['>','['];
				}
				else {
					context.newState = this.sElement;
					context.boundary = ['>',' ','/','!--','?','![CDATA['];
					context.boundary = context.boundary.concat(context.validControlChars);
				}
			}
			else if (context.state == this.sComment) {
				context.newState = this.sContent;
				context.boundary = ['<!DOCTYPE','<'];
			}
			else if (context.state == this.sProcessingInstruction) {
				context.newState = this.sContent;
				context.boundary = ['<!DOCTYPE','<'];
			}
			else if (context.state == this.sCData) {
				context.newState = this.sContent;
				context.boundary = ['<!DOCTYPE','<'];
			}
			else if (context.state == this.sDocType) {
				if (context.boundary[context.bIndex] == '[') {
					context.newState = this.sDTD;
					context.boundary = [']>'];
				}
				else {
					context.newState = this.sPreElement;
					context.boundary = ['<'];
				}
			}
			else if (context.state == this.sDTD) {
				context.newState = this.sPreElement;
				context.boundary = ['<'];
			}

			if (!callback) {
				if (((context.state & 1) == 1) && ((context.token.trim() !== '') || context.state == this.sValue)) {
					context.position = i+1;
					return context;
				}
			}
			context.state = context.newState;

			if (!context.keepToken) context.token = '';
		}
		else {
			context.token += c;
		}

	}
	if ((context.state == this.sEndElement) && (context.depth === 0) && (context.token.trim() === '')) {
		context.wellFormed = true;
	}
	if ((!context.wellFormed) && (!context.error)) {
		if (callback) {
			// generate a final error, only for pushparsers though
			callback(this.sError,context.token);
		}
	}
	context.state = this.sEndDocument;
	if (callback) {
		callback(context.state,context.token);
		return context.wellFormed;
	}
	else {
		return context;
	}
}

  // ------------------mm
   parseString(xml, options) {
 let sElement = this.sElement;
  let sContent = this.sContent;

    let stack = [];
    let context = {};
    let lastElement = '';
  
    let defaults = {
      attributePrefix: "@",
      textName: '#text',
      valName: '#value',
      valueProperty: false,
      coerceTypes: false
    };
  
    options = Object.assign({},defaults,options); // merge/extend
  
    let obj = {};
    let newCursor = obj;
    let cursor = obj;
  
    let currentElementName = '';
    let currentAttributeName = '';
    let index = -1;
  
  let  tEmit = this.emit;
    this.jgeParse(xml,function(state,token) {
  
     let tInitial = 0;
     let tDeclaration = 1;
     let tPreElement = 2;
     let tElement = 3;
     let tAttribute = 5;
     let tAttrNML = 6; // No Mant Land
     let  tValue = 7;
     let  tEndElement = 9;
     let  tContent = 11;
     let tAttributeSpacer = 12;
     let  tComment = 13;
     let  tProcessingInstruction = 15;
     let  tCData = 17;
     let  tDocType = 19;
     let   tDTD = 21;
     let  tError = 23;
     let tEndDocument = 25;  

      if (state == sElement) {
        let parentElementName = currentElementName;
  
        context = {};
        context['cursor'] = newCursor;
        context['parent'] = cursor;
        context['index'] = index;
        context['elementName'] = currentElementName;
        stack.push(context);
  
        cursor = newCursor;
        currentElementName = token;
  
        if (newCursor[currentElementName]) {
          let n = {};
          newCursor[currentElementName].push(n);
          index = newCursor[currentElementName].length-1;
          newCursor = n;
        }
        else {
          newCursor[currentElementName] = [{}]; // we start off assuming each element is an object in an array not just a property
          newCursor = newCursor[currentElementName][0];
          index = 0;
        }
      }
      else if ((state == sContent) || (state == tCData)) {
        token = this.emit(token,options.coerceTypes);
        let target = cursor[currentElementName][index][options.textName];
        if (!target) {
          target = cursor[currentElementName][index][options.textName] = [];
        }
        let nt = {};
        nt[options.valName] = token;
        target.push(nt);
      }
      else if (state == tEndElement) {
        // finish up
        context = stack[stack.length-1];
        currentElementName = context['elementName'];
        newCursor = context['cursor'];
        cursor = context['parent'];
        index = context['index'];
  
        stack.pop();
      }
      else if (state == tAttribute) {
        currentAttributeName = options.attributePrefix+token;
      }
      else if (state == tValue) {
        token = tEmit(token,options.coerceTypes);
        cursor[currentElementName][index][currentAttributeName] = token;
      }
    },null);
  
    if (!options.valueProperty) {
      obj = this.postProcess(obj,'',options); // first pass
      obj = this.postProcess(obj,'',options); // second pass
    }
  
    return obj;
  }
  
   filterInt(value) {
    if (/^(\-|\+)?([0-9]+|Infinity)$/.test(value)) return Number(value);
    return NaN;
  }
  
   filterFloat(value) {
    if(/^(\-|\+)?([0-9]*(\.[0-9]+)?|Infinity)$/.test(value)) return Number(value);
    return NaN;
  }
  
   emit(token,coerceTypes) {
    if (coerceTypes) {
      let timestamp = Date.parse(token);
      if (!isNaN(timestamp) && (token.match('^[0-9]{4}\-[0-9]{2}\-[0-9]{2}.*$'))) {
        return token;
      }
      let num = this.filterFloat(token);
      if (!isNaN(num)) {
        return num;
      }
      num = this.filterInt(token); //parseInt
      if (!isNaN(num)) {
        return num;
      }
      if ((token === 'true') || (token === 'false')) {
        return token === 'true';
      }
      if ((Object.keys(token).length === 0) || (token == 'xsi:nil')) {
        return 'null';
      }
    }
    return token;
  }
  
   getString() {
    // deprecated
    return '';
  }


 postProcess(obj,parent,options) {

	for (let key in obj) {
		// skip loop if the property is from prototype
    if (!obj.hasOwnProperty(key))
     continue;

		let propArray = Array.isArray(obj[key]);
		if (propArray && obj[key].length == 1) {
			obj[key] = obj[key][0];
		}
		if ((typeof obj[key] == 'object') && (parent !== '')) {
			let firstKey = Object.keys(obj[key])[0];
			if ((firstKey == options.textName) || (firstKey == options.valName)) {
				if ((Object.keys(obj[key]).length == 1) && (typeof obj[key][firstKey] != 'object')) {
					obj[key] = obj[key][firstKey];
				}
			}
		}

		if (typeof obj[key] == 'object') {
			this.postProcess(obj[key],key,options);
		}
	}
	return obj;
}
}
