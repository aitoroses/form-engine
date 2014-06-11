Forms = require('./forms')

Forms.listener('onLoad', -> console.log("OnLoad method"))

Forms.action('save', -> console.log("Save something"))
Forms.action('cancel', -> console.log("Cancel"))
Forms.action('delete', -> console.log("Delete something"))

Forms.entity(
    definition: 'City, City'
    attributes: {
        name: 'Name, String'
        phone: 'Postal Code, String'
    }
)

Forms.entity(
    definition: 'Address, Address'
    attributes: {
        name: 'Name, String'
        phone: 'Phone, String'
        city: 'City, entity City'
    }
)

Forms.form(
    definition: 'adressForm, Address From'
    entity: 'Address'
    on_load: 'onLoad'
    actions: ['save', 'cancel', 'delete']
    vars: {
        id: "Number, optional"
        openable: "Boolean, default false"
        noName : "Boolean, default true"
        normalized: "Boolean, default true"
    }
    layout: {

    }

);