Forms = exports;

_entities = {}
_forms = {}
_listeners = {}
_actions = {}

# Data from identifier
processDefinition = (def) -> 
	if typeof def != "string" then throw Error("Not valid form definition.")
	split = def.split(',')
	if split.length != 2 then throw Error("Form has not identifier or title.")
	return {
		id: split[0].trim()
		title: split[1].trim()
	}


processFormVars = (vars) ->
	iterateOverObjectString vars, (arg, index) ->
		# Type: index 0
		if index is 0 then this.type = arg.toLowerCase()
		# Default value
		if arg.match('default')
			defaultSplit = arg.split(' ')
			if defaultSplit.length != 2 then throw Error(
				"Invalid default attribute for #{id}.#{k}"
			)
			this.default = arg.split(' ')[1].trim()
		# Optional
		if arg.match('optional') then this.optional = true


processEntityAttributes = (attrs) ->
	iterateOverObjectString attrs, (arg, index) ->
		# Name
		original = arg
		arg = arg.split(' ')
		switch index
			# Default name
			when 0 then this.defaultName = original
			# Type
			when 1
				switch arg[0].toLowerCase()
					when "entity"
						if arg.length isnt 2 then throw Error("Invalid entity definition.")
						for k, entity of _entities 
							if entity.id is arg[1] then this.type = entity.attributes
						# Check existance
						if not this.type? then this.type = "N/A"
		
					else this.type = arg[0].toLowerCase()
		if arg[0].match('optional') then this.optional = true

lookupEntity = (entityName) ->
	for k, entity of _entities 
		if entity.id is entityName then type = entity.attributes
	# Check existance
	if not type? then return "N/A"
	return {
		id: entityName
		entity: type
	}



# Helper function that iterates over an object with a string arg list
iterateOverObjectString = (iterable, processingFn) ->
	processed = {}
	((k,v) ->
		formVar = {}
		split = v.split(',')
		split.map (arg, index) ->
			# Trim the arg
			arg = arg.trim()
			processingFn.call(formVar, arg, index)
		processed[k] = formVar
	)(k,v) for k,v of iterable
	return processed




### FORMS ###

# Form
Forms.form = (formDef) ->
	# Process definition
	form = processDefinition(formDef.definition);
	# Entity
	form.entity = lookupEntity(formDef.entity)
	# Onload handler
	form.onLoad = _listeners[formDef.onLoad]
	# vars
	form.vars = processFormVars(formDef.vars)
	# actions
	form.actions = formDef.actions.map (action) -> _actions[action]

	_forms[form.id] = form

	# Write to file
	fs = require 'fs'
	fs.writeFile("./form_#{form.id}.json", JSON.stringify(form, null, '  '));

	return form;


# Entity
Forms.entity = (entityDef) ->

	entity = processDefinition(entityDef.definition)
	entity.attributes = processEntityAttributes(entityDef.attributes)

	_entities[entity.id] = entity

	return entity


# listeners
Forms.listener = (listener, fn) ->
	_listeners[listener] = String(fn)


# Actions
Forms.action = (action, fn) ->
	_actions[action] = String(fn)
