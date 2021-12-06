# Wappsto Wapp API [![CI](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml/badge.svg)](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml)

This is a node/js library for easily creating wapps for [Wappsto](https://wappsto.com)

## Usage

Here are some examlples on how to use the library.

### Create a new Network

To create a new network you need to call 'createNetwork'. If there is an Network with the same name, the exsisting network will be returned.

```javascript
let network = await Wappsto.createNetwork('new network name');
```

### Create a new device

To create a new device under an existing network, you should call createDevice. If a device exsists with the given name, the existing device will be returned,

```javascript
let device = network.createDevice('name', 'product', 'serial', 'description', 'protocol', 'communication', 'version', 'manufacturer');
```

### Create a new value

To create a new value under an exsisting device, you should call createValue. There are some helper functions to create number, string, bloc and xml values.
There will also be created the states nedded based on the permission. The only allowed values for permission is 'r', 'w' and 'rw'.

To create a number value:

```javascript
let value = device.createNumberValue('name', 'rw', 'type', 'period', 'delta', 0, 10, 1, 'unit', 'si_conversion');
```

To create a string value:

```javascript
let value = device.createStringValue('name', 'rw', 'type', 'period', 'delta', 10, 'encoding');
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
