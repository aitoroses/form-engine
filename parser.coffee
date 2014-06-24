fs = require 'fs'
input = fs.readFileSync('./AddressForm.f').toString()

lex = (input) ->
	tokens = []
	i = 0
	c = null
	advance = -> c = input[++i]
	addToken = (type, value) ->
		tokens.push 
			type: type
			value: value

	while i < input.length
		c = input[i]

		# whitespace
		if isWhiteSpace(c) then advance()
		# operator
		else if isOperator(c)
			addToken('operator', c)
			advance()
		# openbrace
		else if isOpenbrace(c)
			addToken('openbrace', c)
			advance()
		# closing
		else if isClosingbrace(c)
			addToken('closingbrace', c)
			advance()
		# semicolon
		else if isSemicolon(c)
			addToken('semicolon', c)
			advance()
		# digit
		else if isDigit(c)
			num = c
			while isDigit(advance()) then num += c
			if c is '.'
				loop
					num += c
					break if isDigit(advance())
			num = parseFloat(num)
			if !isFinite(num) then throw "Number is too large or too small for a 64-bit double."
			addToken('number', num)
		# colon
		else if isColon(c)
			str = ""
			while !isColon(advance()) then str += c
			addToken('string', str)
			advance()

		# identifier
		else if isIdentifier(c)
			idn = c
			while isIdentifier(advance()) then idn += c
			addToken('identifier', idn)
	return tokens

isOperator = (c) -> /[+\-*\/\^%=(),:]/.test(c)
isColon = (c) -> /["']/.test(c) 
isDigit = (c) -> /[0-9]/.test(c)
isWhiteSpace = (c) -> /[\s\r\t\n]/.test(c)
isIdentifier = (c) -> 
	typeof c is "string" && 
		!isOperator(c) && 
		!isDigit(c) && 
		!isWhiteSpace(c) &&
		!isKeyWord(c) &&
		!isOpenbrace(c) &&
		!isClosingbrace(c) &&
		!isColon(c) &&
		!isSemicolon(c)
isKeyWord = (c) ->
	keywords = [
		'entity'
	]
	for keyword in keywords
		if c is keyword 
			return true 
		else return false
isSemicolon = (c) -> /[;]/.test(c)
isOpenbrace = (c) -> /[{]/.test(c)
isClosingbrace = (c) -> /[}]/.test(c)


parse = (tokens) ->
	i = 0
	types = ['entity', 'form', 'listener', 'action']
	token = -> tokens[i]
	val = -> token().value
	nextVal = (num) -> (tokens[i + num]).value
	isNext = (num, tokenVal) -> (tokens[i + num]).value is tokenVal
	move = (num) -> i += num; return token()
	expect = (num, expectation) -> if (tokens[i + num]).value isnt expectation then "Expected #{expectation} but #{(tokens[i + num]).value} was found." else true
	advance = -> ++i; token()

	# Parse entity
	parseEntity = () ->
		attributes = {}
		# parsing functions
		isAction = () -> val() is 'action'
		isAttribute = () -> !isAction(val())
		# entity name
		t = advance()
		if t.value == '{' then throw "Unexpected {, expecting entity name."
		name = token().value
		advance()
		# Parse body
		if val() != '{' then throw "Expecting {, attributes definition."
		advance()
		while val() isnt '}'
			# attribute
			if isAttribute()
				# attr name
				attr = val()
				while advance().value isnt '=' then attr += ' ' + val()
				# attr options
				options = {}
				advance()
				while val() isnt ';'
					switch val().toLowerCase()
						when "optional" then options.optional = true
						when "signed" then options.signed = true
						when "default" then options.default = advance().value
						when ',' then
						else options.type = val()
					advance()
				attributes[attr] = options
				advance()
		return {id: name, attributes: attributes}

	parseForm = () ->
		form = {events: {}, actions: [], vars: {}}
		keywords = {
			'entity': ->
				if form.entity? then throw "An entity it's already defined for form #{form.id}"
				form.entity = advance().value
				loop then break if advance().value is ';'
				advance()
			'event': ->
				form.events[advance().value] = advance().value
				loop then break if advance().value is ';'
				advance()
			'action': ->
				form.actions.push advance().value
				loop then break if advance().value is ';'
				advance()
			'layout': ->
				layout = []
				layoutTypes = ['vertical', 'horizontal']
				parseLayout = () ->
					# check if it's layout
					debugger
					isBody = -> nextVal(1) isnt '}' and !isLayout()
					isLayout = -> expect(1, '{') and layoutTypes.indexOf(val()) != -1
					parseBody = ->
						# parse the fields in an array
						debugger
						fields = []
						loop
							field = ""
							loop
								field += ' ' + val()
								break if isNext(1, ';')
								move(1)
							# Move to the next field or to the end of the body
							move(2)
							fields.push field.trim()
							break if val() == '}'
						move(1)
						# position in '}' body end
						return fields

					nodes = []
					type = val()
					expect(1, '{')
					move(2)
					# Now that we are inside
					loop
						if isLayout() then nodes.push parseLayout()
						else if isBody() then nodes.push parseBody()
						else break # at this point we should be on '}'
					#move(1)
					return new LayoutNode(type, nodes)

				class LayoutNode
					constructor: (@type, @def) ->

				if advance().value isnt '{' then throw "expected { in layout definition."

				advance()					
				form.layout = new LayoutNode(val(), parseLayout())
				debugger

			'else': ->
				# attr name
				attr = val()
				while advance().value isnt '=' then attr += ' ' + val()
				# attr options
				options = {}
				advance()
				while val() isnt ';'
					switch val().toLowerCase()
						when "optional" then options.optional = true
						when "signed" then options.signed = true
						when "default" then options.default = advance().value
						when ',' then
						else options.type = val()
					advance()
				form.vars[attr] = options
				advance()
		}
		# name
		form.id = ""
		advance()
		while val() isnt '{'
			form.id += ' ' + val()
			advance()
		advance()
		while val() isnt '}'
			if keywords.hasOwnProperty(val())
				keywords[val()]()
			else 
				keywords.else()
		return form

	parseListener = ->
		name = advance().value
		advance()
		body = ""
		while advance().value isnt '}'
			if token().type is 'string' then body += '"' + val() + '"'
			else body += val()
		return {event: name, callback: String(new Function(body))}

	parseAction = ->
		name = advance().value
		advance()
		body = ""
		while advance().value isnt '}'
			if token().type is 'string' then body += '"' + val() + '"'
			else body += val()
		return {action: name, callback: String(new Function(body))}



	# INIT
	listener = []
	action = []
	entity = []
	form = []
	# Main loop
	while (i < tokens.length-1)
		t = token()
		for type in types
			if t.value.toLowerCase() is type
				eval(type).push eval('parse' + type.charAt(0).toUpperCase() + type.slice(1) + '()')
				advance()

	return {
		entities: entity
		forms: form
		actions: action
		listeners: listener
	}



# output
lexems = lex(input); #console.log(lexems)
parseTree = parse(lexems); #console.log(parseTree)
console.log JSON.stringify(parseTree, null, '   ')