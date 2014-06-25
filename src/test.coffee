compile = require('./parser').compile

fs = require 'fs'
input = fs.readFileSync('./AddressForm.f').toString()

# output
compiled = compile(input)

console.log JSON.stringify(compiled, null, '   ')