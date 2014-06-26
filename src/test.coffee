compile = require('./parser').compile

fs = require 'fs'
input = fs.readFileSync('./AddressFrom.fl').toString()

# output
compiled = compile(input)

console.log JSON.stringify(compiled, null, '   ')