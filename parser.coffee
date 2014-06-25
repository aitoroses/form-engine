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
				isLayout = (layout) -> if layoutTypes.indexOf(layout) != -1 then return true else false
				if advance().value isnt '{' then throw "expected { in layout definition."

				
				# # Data Structures
				# class LayoutContainer extends Array
				# 	constructor: (@type) ->
				# 	addLayout: (layout) -> this.push layout
				# class Layout
				# 	constructor: (@type, @fields, @container = new LayoutContainer()) ->
				# 	getContainer: -> this.container
				# 	setFields: (fields) -> this.fields
				# # parse code
				# parent = new Layout('layout')
				# layouts = [parent]
				# lastLayout = -> return if layouts.length > 0 then layouts[layouts.length - 1] else null
				# parseLayout = ->
				# 	preprocess = ->
				# 		# Analize the structure levels
				# 		j = 0
				# 		k = 0
				# 		getVal = () -> nextVal(j + k)
				# 		resetJ = -> j = 0
				# 		resetK = -> k = 0
				# 		# Get the max level structure
				# 		maxLevels = (->
				# 			levels = 0
				# 			open = 0
				# 			close = 0
				# 			while open - close > 0 or open is 0
				# 				if getVal() is '{' then open++;
				# 				if getVal() is '}' then close++;
				# 				levels = Math.max(levels, open - close)
				# 				j++
				# 			return levels
				# 		)()
				# 		resetJ()
				# 		basicStructure = (->
				# 			levels = (0 for level in [0...maxLevels])
				# 			(-> 
				# 				checkLevel = ->
				# 					open = 0
				# 					close = 0
				# 					getLevel = () -> open-close
				# 					while getLevel() < level
				# 						if getVal() is '{' then open++;
				# 						j++
				# 					openTokens = 0
				# 					closedOnce = 
				# 					childs = 0
				# 					while openTokens > 0 or not closedOnce
				# 						if getVal() is '{'
				# 							openTokens++
				# 							# only in the first level
				# 							if openTokens is 1 then childs++
				# 						if getVal() is '}' 
				# 							openTokens--
				# 							closedOnce = true
				# 						k++
				# 					# Now that we are positioned at the start of the level
				# 					resetK()
				# 					return childs
				# 				childCount = checkLevel()
				# 				return childCount
				# 			)() for num, level in levels
				# 			return levels
				# 		)()

				# 		debugger
				# 		return
				# 	a = preprocess()
				# 	loop
				# 		# At the start of the loop, we should have the type
				# 		type = val()
				# 		# advance to body
				# 		advance()
				# 		if val() is '{'
				# 			parentLayout = lastLayout()
				# 			# create a new Layout object
				# 			newLayout = new Layout(type)
				# 			# store a reference
				# 			layouts.push newLayout
				# 			# add to parent
				# 			parentLayout.getContainer().addLayout newLayout
				# 			# keep parsing
				# 			advance()
				# 			if isLayout(type) then parseLayout()
				# 		else
				# 			fields = []
				# 			move(-1)
				# 			while val() isnt '}'
				# 				# parse the body
				# 				field = ""
				# 				while val() isnt ';'
				# 					field += ' ' + val()
				# 					advance()
				# 				fields.push field.trim()
				# 				advance()
				# 			lastLayout().setFields(fields)
				# 			advance()
				# 		if val() is '}'
				# 			layouts.pop()
				# 			break
				# 	return parent

				parseLayout = () ->
					maxLevel = 0
					getTokens = ->
						layoutTokens = []
						level = 0
						closedOnce = false
						while level > 0 or not closedOnce
							if val() is '{' then level++
							if val() is '}' then closedOnce = true; level--
							layoutTokens.push advance()
							maxLevel = Math.max(level, maxLevel)
						layoutTokens
					layoutTokens = getTokens()
					spliceLevel = (targetLevel) ->
						j = 0
						getVal = -> layoutTokens[j].value
						level = 0
						start = 0
						end = 0
						while level isnt targetLevel
							if getVal() is '{' then level++
							if getVal() is '}' then level--
							j++
						# save the start token
						start = j-2
						# finish token
						while not (level is targetLevel and getVal() is '}')
							if getVal() is '{' then level++
							if getVal() is '}' then level--
							j++
						# save the finish token
						end = j

						# splice the tokens
						levelTokens = layoutTokens.splice(start, end - start + 1)
						debugger
						layoutTokens.splice(start, 0, levelTokens)

					spliceLevel(3)
					debugger

				advance()			
				form.layout = parseLayout()

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