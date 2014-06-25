entity City {
	Zip Code = String, optional;
	Subdivision = String, default null;
	Name = String;
	English Name = String, optional;
	Latitude = Number, signed, optional;
	Longitude = Number, signed, optional;
	Phone area code = Number, optional;
}

entity Address {
	Name = String;
	Street name = String, optional;
	Between Street = String, optional;
	Street number = String, optional;
	Building floor = String, optional;
	Building room = String, optional;
	Address Details = String, optional;
	Observations = String, optional;
	Phone = String, optional;
	City = City;
	Zip Code = String, optional;
	Normalized address = Boolean, default false;
	Latitude = Number, signed, optional;
	Notes = String, optional;
}

form Address From {

	entity Address;

	layout {
		horizontal {
			Name;
			Street name;
			Between Street;
			Street number;
			Building floor;
			Building room;
			Address Details;
		}
		horizontal {
			
			Observations;
			Phone;
			City;
		}
	}

	event on_load onLoad;

	action save;
	action cancel;
	action delete;

	id = Number, optional;
	openable = Boolean, default false;
	noName = Boolean, default true;
	normalized = Boolean, default true;
}

listener onLoad { console.log("Onload method") }

action save { console.log('Save something') }
action cancel { console.log('Cancel')}
action delete { console.log('Delete something.') }
