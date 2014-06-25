define("parser",["require","exports","module"],function(require,exports,module){var isClosingbrace,isColon,isDigit,isIdentifier,isKeyWord,isOpenbrace,isOperator,isSemicolon,isWhiteSpace,lang,__hasProp={}.hasOwnProperty,__extends=function(e,t){function r(){this.constructor=e}for(var n in t)__hasProp.call(t,n)&&(e[n]=t[n]);return r.prototype=t.prototype,e.prototype=new r,e.__super__=t.prototype,e};lang={},lang.lex=function(e){var t,n,r,i,s,o,u,a;a=[],i=0,r=null,n=function(){return r=e[++i]},t=function(e,t){return a.push({type:e,value:t})};while(i<e.length){r=e[i];if(isWhiteSpace(r))n();else if(isOperator(r))t("operator",r),n();else if(isOpenbrace(r))t("openbrace",r),n();else if(isClosingbrace(r))t("closingbrace",r),n();else if(isSemicolon(r))t("semicolon",r),n();else if(isDigit(r)){o=r;while(isDigit(n()))o+=r;if(r===".")for(;;){o+=r;if(isDigit(n()))break}o=parseFloat(o);if(!isFinite(o))throw"Number is too large or too small for a 64-bit double.";t("number",o)}else if(isColon(r)){u="";while(!isColon(n()))u+=r;t("string",u),n()}else if(isIdentifier(r)){s=r;while(isIdentifier(n()))s+=r;t("identifier",s)}}return a},isOperator=function(e){return/[+\-*\/\^%=(),:]/.test(e)},isColon=function(e){return/["']/.test(e)},isDigit=function(e){return/[0-9]/.test(e)},isWhiteSpace=function(e){return/[\s\r\t\n]/.test(e)},isIdentifier=function(e){return typeof e=="string"&&!isOperator(e)&&!isDigit(e)&&!isWhiteSpace(e)&&!isKeyWord(e)&&!isOpenbrace(e)&&!isClosingbrace(e)&&!isColon(e)&&!isSemicolon(e)},isKeyWord=function(e){var t,n,r,i;n=["entity"];for(r=0,i=n.length;r<i;r++)return t=n[r],e===t?!0:!1},isSemicolon=function(e){return/[;]/.test(e)},isOpenbrace=function(e){return/[{]/.test(e)},isClosingbrace=function(e){return/[}]/.test(e)},lang.parse=function(tokens){var action,advance,entity,expect,form,i,isNext,listener,move,nextVal,parseAction,parseEntity,parseForm,parseListener,t,token,type,types,val,_i,_len;i=0,types=["entity","form","listener","action"],token=function(){return tokens[i]},val=function(){return token().value},nextVal=function(e){return tokens[i+e].value},isNext=function(e,t){return tokens[i+e].value===t},move=function(e){return i+=e,token()},expect=function(e,t){return tokens[i+e].value!==t?"Expected "+t+" but "+tokens[i+e].value+" was found.":!0},advance=function(){return++i,token()},parseEntity=function(){var e,t,n,r,i,s,o;t={},n=function(){return val()==="action"},r=function(){return!n(val())},o=advance();if(o.value==="{")throw"Unexpected {, expecting entity name.";i=token().value,advance();if(val()!=="{")throw"Expecting {, attributes definition.";advance();while(val()!=="}")if(r()){e=val();while(advance().value!=="=")e+=" "+val();s={},advance();while(val()!==";"){switch(val().toLowerCase()){case"optional":s.optional=!0;break;case"signed":s.signed=!0;break;case"default":s["default"]=advance().value;break;case",":break;default:s.type=val()}advance()}t[e]=s,advance()}return{id:i,attributes:t}},parseForm=function(){var e,t;e={events:{},actions:[],vars:{}},t={entity:function(){if(e.entity!=null)throw"An entity it's already defined for form "+e.id;e.entity=advance().value;for(;;)if(advance().value===";")break;return advance()},event:function(){e.events[advance().value]=advance().value;for(;;)if(advance().value===";")break;return advance()},action:function(){e.actions.push(advance().value);for(;;)if(advance().value===";")break;return advance()},layout:function(){var t,n,r,i;n=[],r=["vertical","horizontal"],t=function(e){return r.indexOf(e)!==-1?!0:!1};if(advance().value!=="{")throw"expected { in layout definition.";return i=function(){var e,n,i,s,o,u,a;return o=function(){return r.indexOf(nextVal(2))===-1},t=function(){return!o()},s=function(e){var t,n,r;n=[],r=2+e||0;while(nextVal(2+r)!=="}"){t="";for(;;){t+=" "+nextVal(2+r),r++;if(nextVal(2+r)===";"){r++,n.push(t.trim());break}}}return n},e=function(e){function t(e){this.layout=e}return __extends(t,e),t.prototype.add=function(e){return this.push(e)},t}(Array),i=null,n=function(){var t;return t=new e(val()),i=t},a=[],u=function(){var e,t,r,i,a,f,l,c;f=[],a=["{"],i=-1,r=function(){return f[i]},c=function(e){return f[i]=e},t=function(){while(val()!=="}")advance();return advance(),a.pop()};while(a.length!==0)e=r(),nextVal(1)==="{"?(i++,c(n()),a.push("{"),move(2),a.length>2&&(f.pop(),move(-2),e.add(u()))):(move(-2),o()&&s().forEach(function(t){return e.add(t)}),t());t(),l=f.map(function(e){var t;return t={},t[e.layout]=e.map(function(e){return e}),t});debugger;return l},u()},advance(),e.layout=i(),advance()},"else":function(){var t,n;t=val();while(advance().value!=="=")t+=" "+val();n={},advance();while(val()!==";"){switch(val().toLowerCase()){case"optional":n.optional=!0;break;case"signed":n.signed=!0;break;case"default":n["default"]=advance().value;break;case",":break;default:n.type=val()}advance()}return e.vars[t]=n,advance()}},e.id="",advance();while(val()!=="{")e.id+=" "+val(),advance();advance();while(val()!=="}")t.hasOwnProperty(val())?t[val()]():t["else"]();return e},parseListener=function(){var e,t;t=advance().value,advance(),e="";while(advance().value!=="}")token().type==="string"?e+='"'+val()+'"':e+=val();return{event:t,callback:String(new Function(e))}},parseAction=function(){var e,t;t=advance().value,advance(),e="";while(advance().value!=="}")token().type==="string"?e+='"'+val()+'"':e+=val();return{action:t,callback:String(new Function(e))}},listener=[],action=[],entity=[],form=[];while(i<tokens.length-1){t=token();for(_i=0,_len=types.length;_i<_len;_i++)type=types[_i],t.value.toLowerCase()===type&&(eval(type).push(eval("parse"+type.charAt(0).toUpperCase()+type.slice(1)+"()")),advance())}return{entities:entity,forms:form,actions:action,listeners:listener}},lang.compile=function(e){return lang.parse(lang.lex(e))},module.exports=lang.compile});