{
   "entities": [
      {
         "id": "City",
         "attributes": {
            "Zip Code": {
               "type": "String",
               "optional": true
            },
            "Subdivision": {
               "type": "String",
               "default": "null"
            },
            "Name": {
               "type": "String"
            },
            "English Name": {
               "type": "String",
               "optional": true
            },
            "Latitude": {
               "type": "Number",
               "signed": true,
               "optional": true
            },
            "Longitude": {
               "type": "Number",
               "signed": true,
               "optional": true
            },
            "Phone area code": {
               "type": "Number",
               "optional": true
            }
         }
      },
      {
         "id": "Address",
         "attributes": {
            "Name": {
               "type": "String"
            },
            "Street name": {
               "type": "String",
               "optional": true
            },
            "Between Street": {
               "type": "String",
               "optional": true
            },
            "Street number": {
               "type": "String",
               "optional": true
            },
            "Building floor": {
               "type": "String",
               "optional": true
            },
            "Building room": {
               "type": "String",
               "optional": true
            },
            "Address Details": {
               "type": "String",
               "optional": true
            },
            "Observations": {
               "type": "String",
               "optional": true
            },
            "Phone": {
               "type": "String",
               "optional": true
            },
            "City": {
               "type": "City"
            },
            "Zip Code": {
               "type": "String",
               "optional": true
            },
            "Normalized address": {
               "type": "Boolean",
               "default": "false"
            },
            "Latitude": {
               "type": "Number",
               "signed": true,
               "optional": true
            },
            "Notes": {
               "type": "String",
               "optional": true
            }
         }
      }
   ],
   "forms": [
      {
         "events": {
            "on_load": "onLoad"
         },
         "actions": [
            "save",
            "cancel",
            "delete"
         ],
         "vars": {
            "id": {
               "type": "Number",
               "optional": true
            },
            "openable": {
               "type": "Boolean",
               "default": "false"
            },
            "noName": {
               "type": "Boolean",
               "default": "true"
            },
            "normalized": {
               "type": "Boolean",
               "default": "true"
            }
         },
         "id": " Address From",
         "entity": "Address",
         "layout": [
            {
               "0": "Name",
               "1": "Street name",
               "2": "Between Street",
               "3": "Street number",
               "4": "Building floor",
               "5": "Building room",
               "6": "Address Details",
               "layout": "horizontal",
               "length": 7
            },
            {
               "0": [
                  {
                     "0": "Observations",
                     "1": "Phone",
                     "2": "City",
                     "layout": "vertical",
                     "length": 3
                  }
               ],
               "layout": "horizontal",
               "length": 1
            }
         ]
      }
   ],
   "actions": [
      {
         "action": "save",
         "callback": "function anonymous() {\nconsole.log(\"Save something\")\n}"
      },
      {
         "action": "cancel",
         "callback": "function anonymous() {\nconsole.log(\"Cancel\")\n}"
      },
      {
         "action": "delete",
         "callback": "function anonymous() {\nconsole.log(\"Delete something.\")\n}"
      }
   ],
   "listeners": [
      {
         "event": "onLoad",
         "callback": "function anonymous() {\nconsole.log(\"Onload method\")\n}"
      }
   ]
}