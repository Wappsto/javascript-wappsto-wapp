# Wappsto Wapp API [![CI](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml/badge.svg)](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml) [![codecov](https://codecov.io/gh/Wappsto/javascript-wappsto-wapp/branch/main/graph/badge.svg?token=Y7SPYV4G97)](https://codecov.io/gh/Wappsto/javascript-wappsto-wapp)

This is a node/js library for easily creating wapps for [Wappsto](https://wappsto.com)

## Install

To install the node module in your project, run this command:

```shell
npm i --save wappsto-wapp
```

To use it in a webpage, include this script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/wappsto-wapp@latest/dist/wappsto-wapp.min.js"></script>
```

## Usage

Here are some examples on how to use the library.


### Create a new IoT Device

First you need to create a IoT network.
To create a new network you need to call 'createNetwork'. If there is an Network with the same name, the exsisting network will be returned.

```javascript
let network = await Wappsto.createNetwork({
	name: 'new network name'
});
```

Then you need to create a device.
To create a new device under an existing network, you should call createDevice. If a device exsists with the given name, the existing device will be returned.

```javascript
let device = network.createDevice({
	name. 'Device Name',
	product: 'Great Product',
	serial: 'SG123456',
	description: 'My great new device',
	protocol: 'WAPP-JS',
	communication: 'wapp',
	version: '1.0.0',
	manufacturer: 'My Self'
});
```

Then you need to create new values.
To create a new value under an exsisting device, you should call createValue. If a value exsists with the given name, the existing value will be returned.
There will also be created the states nedded based on the permission. The only allowed values for permission is 'r', 'w' and 'rw'.
The list of avaible value templates can be seen in the [value_template.ts](../main/src/util/value_template.ts) file.


```javascript
let value = device.createValue('Temperature', 'r', Wappsto.ValueTemplate.TEMPERATURE_CELSIUS);
```

There are some helper functions to create custom number, string, blob and xml values.
To create a custom number value:

```javascript
let value = device.createNumberValue({
	name: 'Value Name',
	permission: 'rw',
	type: 'Counter',
	period: '1h',
	delta: '1',
	min: 0,
	max: 10,
	step: 1,
	unit: 'count',
	si_conversion: 'c'
});
```

To create a custom string value:

```javascript
let value = device.createStringValue({
	name: 'Value Name',
	permission: 'rw',
	type: 'debug',
	max: 10,
	encoding: 'debug string'
});
```


### To request access to an exsisting object from the user

To request access to an exsisting object, a request have to be send. You can request a single object or multiple objects of the same type.


To request access to a network with a spefict name, use 'findByName'.

```javascript
let networks = await Wappsto.Network.findByName('Network name');
```


To request access to a device with a spefict name, use 'findByName'.

```javascript
let devices = await Wappsto.Device.findByName('Device name');
```


To request access to a device with a spefict product, use 'findByProduct'.

```javascript
let devices = await Wappsto.Device.findByProduct('Product name');
```

To request access to a value with a spefict name, use 'findByName'.

```javascript
let values = await Wappsto.Value.findByName('Value name');
```

To request access to a value with a spefict type, use 'findByType'.

```javascript
let values = await Wappsto.Value.findByType('Type name');
```


### To find a child from an exsisting object

To find devices under a network, you can call 'findDeviceByName' to search for all devices with the given name.

```javascript
let devices = network.findDeviceByName('Device name');
```

Or you can search for all devices with a given product.

```javascript
let devices = network.findDeviceByProduct('Device product');
```

To find all values under a network or device, you can call 'findValueByName' to search for all values with the given name.

```javascript
let values = network.findValueByName('value name');
let values = device.findValueByName('value name');
```

Or you can find all values with a given type, by calling 'findValueByType'.

```javascript
let values = network.findValueByType('value type');
let values = device.findValueByType('value type');
```

### To report a change in the value

To send a new data point to wappsto, just call the 'report' function on the value.

```javascript
await value.report('1');
```

And to get the last reported data and timestamp.

```javascript
let data = value.getReportData();
let timestamp = value.getReportTimestamp();
```

### To change a value on another networks value

To send a new data point to another value, just call the 'control' function on the value.

```javascript
await value.control('1');
```

And to get the last controlled data and timestamp.

```javascript
let data = value.getControlData();
let timestamp = value.getControlTimestamp();
```

### Listing for changes on values

You can register onControl and onReport to receive events when the value changes.

```javascript
value.onReport((value, data, timestamp) => {
	console.log(`${value.name} changed it's report value to ${data}`);
});

value.onControl((value, data, timestamp) => {
	console.log(`Request to change ${value.name} to ${data}`);
});
```

### Sending messages to and from the background

It is possible to send messages to and from the background and the foreground.

```javascript
Wappsto.fromBackground((msg) => {
	console.log("Message from the background: "+msg);
	return "Hello back";
});

Wappsto.fromForeground((msg) => {
	console.log("Message from the foreground: "+msg);
	return "Hello front";
});

let backgroundResult = await Wappsto.sendToBackground("hello");
console.log("Result from background: "+backgroundResult);
let foregroundResult = await Wappsto.sendToForeground("hello");
console.log("Result from foreground: "+foregroundResult);
```

### Wapp Storage

It is possible to store configuration parameters and other information in the Wapp Storage.
This data is persisted on Wappsto and can be read from the foreground and background wapp.
The data can be deleted by calling the `clear` function.

```javascript
let storage = await Wappsto.wappStorage();
await storage.set('key', 'item');
let data = storage.get('key');
// Delete all the saved data
await storage.clear();
```

### OAuth

To get an already created OAuth token, call the getToken with the name of the oauth.
If there is no token generated yet, a `Request Handler` needs to be supplied,
so that the library can call it with the url that the user needs to visit, in order to generate the OAuth Token.

```javascript
try {
  let token = await Wappsto.OAuth.getToken('oauth name', (url) => {
	console.log("Please visit " + url + " to generate the OAuth token");
  });
  console.log("OAuth Token", token);
} catch(e) {
  console.log("Failed to get OAuth token", e);
}
```

### Background loggering

The debug log from the background wapp can be turn on like this:

```javascript
Wappsto.startLogging();
```

And to turn it off again.

```javascript
Wappsto.stopLogging();
```

### Enable verbose responses from wappsto

To enable verbose mode in wappsto, the verbose mode needs to be set to true.

```javascript
Wappsto.config({
  verbose: true
});
```

### Validation

It is possible to change the validation of the input parameters, by changing it in the config. It can be 'none', 'normal' or 'strict'.
The default validation is 'normal'.

```javascript
Wappsto.config({
  validation: 'strict'
});
```

### Raw requests

It is possible to send your own requests to wappsto by using the 'request' object in wappsto.

```javascript
let netwoks = await Wappsto.request.get('/network');
await Wappsto.request.post('/network', {name: 'Network Name'});
```
