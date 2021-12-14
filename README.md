# Wappsto Wapp API [![CI](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml/badge.svg)](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml) [![codecov](https://codecov.io/gh/Wappsto/javascript-wappsto-wapp/branch/main/graph/badge.svg?token=Y7SPYV4G97)](https://codecov.io/gh/Wappsto/javascript-wappsto-wapp)

This is a node/js library for easily creating wapps for [Wappsto](https://wappsto.com)

## Usage

Here are some examlples on how to use the library.

### Create a new Network

To create a new network you need to call 'createNetwork'. If there is an Network with the same name, the exsisting network will be returned.

```javascript
let network = await Wappsto.createNetwork({
	name: 'new network name'
});
```

### Create a new device

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

### Create a new value

To create a new value under an exsisting device, you should call createValue. If a value exsists with the given name, the existing value will be returned. There are some helper functions to create number, string, blob and xml values.
There will also be created the states nedded based on the permission. The only allowed values for permission is 'r', 'w' and 'rw'.

To create a number value:

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

To create a string value:

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

#### Find a network by name

To request access to a network with a spefict name, use 'findByName'.

```javascript
let networks = await Wappsto.Network.findByName('Network name');
```

### Find a device by name

To request access to a device with a spefict name, use 'findByName'.

```javascript
let devices = await Wappsto.Device.findByName('Device name');
```

### Find a device by product

To request access to a device with a spefict product, use 'findByProduct'.

```javascript
let devices = await Wappsto.Device.findByProduct('Product name');
```

### Find a value by name

To request access to a value with a spefict name, use 'findByName'.

```javascript
let values = await Wappsto.Value.findByName('Value name');
```

### Find a value by type

To request access to a value with a spefict type, use 'findByType'.

```javascript
let values = await Wappsto.Value.findByType('Type name');
```

### To report a change in the value

To send a new data point to wappsto, just call the 'report' function on the value.

```javascript
value.report('1');
```

### To change a value on another networks value

To send a new data point to another value, just call the 'control' function on the value.

```javascript
value.control('1');
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

### Background loggering

The debug log from the background wapp can be turn on like this:

```javascript
Wappsto.startLogging();
```

### Enable verbose responses from wappsto

To enable verbose mode in wappsto, the verbose mode needs to be set to true.

```javascript
Wappsto.verbose(true);
```

### Raw requests

It is possible to send your own requests to wappsto by using the 'request' object in wappsto.

```javascript
let netwoks = await Wappsto.request.get('/network');
```

### Find a model by ID

It is possible to find a spefic model using it ID.

```javascript
let network = await Wappsto.Network.findById('b23b41c1-0859-46de-9b11-128c6d44df72');
```
