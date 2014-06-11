Forms = require('./forms')

Forms.listener('onLoad', -> console.log("OnLoad method"))

Forms.action('save', -> console.log("Save something"))
Forms.action('cancel', -> console.log("Cancel"))
Forms.action('delete', -> console.log("Delete something"))

Forms.entity(
    definition: 'City, City'
    attributes:
        zipCode: "Zip Code, String, optional"
        subdivision: "Department/County, String, default ''"
        name: "Name, String"
        englishName: "English Name, String, optional"
        latitude: "Latitude, Number, signed, optional"
        longitude: "Longitude, Number, signed, optional"
        areaCode: "Phone area code, Number, optional"
   
)

Forms.entity(
    definition: 'Address, Address'
    attributes:
        name: 'Name, String'
        streetName: 'Street name, String, optional'
        streetBetween1: 'Between Street, String, optional'
        streetNumber: 'Street number, String, optional'
        buildingFloor: 'Building floor, String, optional'
        buildingRoom: 'Building room, String, optional'
        extensionLine: 'Address Details, String, optional'
        observations: 'Observations, String, optional'
        phone: 'Phone, String, optional'
        city: 'City, entity City'
        zipCode: 'Zip Code, String, optional'
        normalized: 'Normalized address, Boolean, default false'
        latitude: 'Latitud, Number, signed, optional'
        longitude: 'Longitud, Number, signed, optional'
        notes: 'Notes, String, optional'
)

Forms.form(
    definition: 'adressForm, Address From'
    entity: 'Address'
    onLoad: 'onLoad'
    actions: ['save', 'cancel', 'delete']
    vars: 
        id: "Number, optional"
        openable: "Boolean, default false"
        noName : "Boolean, default true"
        normalized: "Boolean, default true"
);