# Wappsto Wapp API [![CI](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml/badge.svg)](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml) [![codecov](https://codecov.io/gh/Wappsto/javascript-wappsto-wapp/branch/main/graph/badge.svg?token=Y7SPYV4G97)](https://codecov.io/gh/Wappsto/javascript-wappsto-wapp)

This is a node/js library for easily creating wapps for [Wappsto](https://wappsto.com).

## Table of Contents
  * [Install](#install)
    + [Node](#node)
    + [Browser](#browser)
  * [Usage](#usage)
    + [Create a new IoT Device](#create-a-new-iot-device)
    + [To report a change in the value](#to-report-a-change-in-the-value)
    + [Listing for requests to refresh the value](#listing-for-requests-to-refresh-the-value)
    + [Reporting events for value](#reporting-events-for-value)
    + [To request access to an exsisting object from the user](#to-request-access-to-an-exsisting-object-from-the-user)
    + [To find a child from an exsisting object](#to-find-a-child-from-an-exsisting-object)
    + [Get retrive object by ID](#get-retrive-object-by-id)
    + [To change a value on a network created outside your wapp](#to-change-a-value-on-a-network-created-outside-your-wapp)
    + [Listing for changes on values](#listing-for-changes-on-values)
    + [Sending an update event to a device](#sending-an-update-event-to-a-device)
    + [Sending messages to and from the background](#sending-messages-to-and-from-the-background)
    + [Web Hook](#web-hook)
    + [Wapp Storage](#wapp-storage)
    + [OAuth](#oauth)
    + [Notification](#notification)
    + [Background logging](#background-logging)
    + [Raw requests](#raw-requests)
    + [Config](#config)
      - [Enable verbose responses from wappsto](#enable-verbose-responses-from-wappsto)
      - [Validation](#validation)
      - [Stream Reconnect Count](#stream-reconnect-count)

## Install

### Node

To install the node module in your project, run this command:

```shell
npm i --save wappsto-wapp
```

Or using `yarn`:

```shell
yarn add wappsto-wapp
```

And include it in your project like this:

```javascript
let Wappsto = require('wappsto-wapp');
```

### Browser

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

It is also possible to define a period for how often the library should poll your values for updates. In this way regulary reports will be send to the cloud. It is also possible to filter out small changes by setting the delta for number values. With the delta set, reported changes that are not bigger then the delta will be discarded.
In the example below, period is set to 3600 [sec.], i.e. 1 hour interval and delta to 2 [deg.]. So changes in value data will only apply if after one hour new temperature value is bigger than 2 [deg.] of previous temperature value.

```javascript
let value = device.createValue('Temperature', 'r', Wappsto.ValueTemplate.TEMPERATURE_CELSIUS, 3600, '2');
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

### To report a change in the value

To send a new data point to wappsto, just call the `report` function on the value.

```javascript
await value.report('1');
```

And to get the last reported data and timestamp.

```javascript
let data = value.getReportData();
let timestamp = value.getReportTimestamp();
```

### Listing for requests to refresh the value

To receive request to refresh the value, register a callback on `onRefresh`.

```javascript
value.onRefresh((value) => {
    value.report(1);
});
```

And you can cancel this callback by calling `cancelOnRefresh`.

```javascript
value.cancelOnRefresh();
```

### Reporting events for value

It is possible to save events in an event log for each value. Call
`addEvent` on a value to create an event entry.
The possible values for level is:
    * important
    * error
    ' success
    * warning
    * info
    * debug

```javascript
await value.addEvent('error', 'somthing wnt wrong');
```

### To request access to an exsisting object from the user

To request access to an exsisting object, a request have to be send. You can request a single object or multiple objects of the same type.


To request access to a network with a spefict name, use `findByName`.

```javascript
let networks = await Wappsto.Network.findByName('Network name');
```

To request access to a device with a spefict name, use `findByName`.

```javascript
let devices = await Wappsto.Device.findByName('Device name');
```

To request access to a device with a spefict product, use `findByProduct`.

```javascript
let devices = await Wappsto.Device.findByProduct('Product name');
```

To request access to a value with a spefict name, use `findByName`.

```javascript
let values = await Wappsto.Value.findByName('Value name');
```

To request access to a value with a spefict type, use `findByType`.

```javascript
let values = await Wappsto.Value.findByType('Type name');
```

### To find a child from an exsisting object

To find devices under a network, you can call `findDeviceByName` to search for all devices with the given name.

```javascript
let devices = network.findDeviceByName('Device name');
```

Or you can search for all devices with a given product.

```javascript
let devices = network.findDeviceByProduct('Device product');
```

To find all values under a network or device, you can call `findValueByName` to search for all values with the given name.

```javascript
let values = network.findValueByName('value name');
let values = device.findValueByName('value name');
```

Or you can find all values with a given type, by calling `findValueByType`.

```javascript
let values = network.findValueByType('value type');
let values = device.findValueByType('value type');
```

### Get retrive object by ID

If you already have access to some objects, you can retrive them directly by their ID.

```javascript
let network = Network.findByID('655937ac-c054-4cc0-80d7-400486b4ceb3');
let device = Device.findByID('066c65d7-6612-4826-9e23-e63a579fbe8b');
let value = Value.findByID('1157b4fa-2745-4940-9201-99eee5929eff');
```


### To change a value on a network created outside your wapp

To send a new data point to another value, just call the `control` function on the value.

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

And you can cancel these callbacks by calling `cancelOnReport` and
`cancelOnControl`.

```javascript
value.cancelOnReport();

value.cancelOnControl();
```

### Sending an update event to a device

To send an event to a device to get a new report data.

```javascript
await value.refresh();
```

### Changing the period and delta of a value

To change the delta and period of a value you can call `setDelta` or
`setPeriod`.

```javascript
value.setPeriod('300');

value.setDelta(2.2);
```

### Sending messages to and from the background

It is possible to send messages to and from the background and the foreground.
When you register a event handler, it will be called for each event send.
The return value of your event handler is send back to the sender of the event.

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

If you do not want to receive anymore messages, you can cancel the event handler.

```javascript
Wappsto.cancelFromBackground();
Wappsto.cancelFromForeground();
```

### Web Hook

If the Ext Sync is enabled for the Wapp, a event handler for WebHooks can be registered.

```javascript
wappsto.onWebHook((event) => {
  console.log("Web Hook event", event);
});
```

And if you want to cancel the web hook event handler, you can call `cancelWebHook`.

```javascript
wappsto.cancelOnWebHook(handler);
```

### Wapp Storage

It is possible to store configuration parameters and other information in the Wapp Storage.
This data is persisted on Wappsto and can be read from the foreground and background wapp.
The data can be reload from the server by calling `reload` function.
The data can be deleted by calling the `clear` function.
A callback can also be registered to be notified when the storage is updated.

```javascript
let storage = await Wappsto.wappStorage();
//Signal when storage is changed
storage.onChange(() => {
	console.log("Storage is updated");
});
await storage.set('key', 'item');
let data = storage.get('key');
// Reload the data from the server
await storage.reload();
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

### Notification

It is possible to send custom notification to the main Wappsto.com
dashboard.

```javascript
await wappsto.notifi('This is a custom notification from my Wapp');
```

### Background logging

The debug log from the background wapp can be turn on like this:

```javascript
Wappsto.startLogging();
```

And to turn it off again.

```javascript
Wappsto.stopLogging();
```

### Raw requests

It is possible to send your own requests to wappsto by using the `request` object in wappsto.

```javascript
let netwoks = await Wappsto.request.get('/network');
await Wappsto.request.post('/network', {name: 'Network Name'});
```

### Config

It is possible to change some of the behavior of the library using config.

#### Enable verbose responses from wappsto

To enable verbose mode in wappsto, the verbose mode needs to be set to true.

```javascript
Wappsto.config({
  verbose: true
});
```

#### Validation

It is possible to disable the validation of the input parameters, by changing it in the config. It can be 'none' or 'normal'.
The default validation is 'normal'.

```javascript
Wappsto.config({
  validation: 'none'
});
```

#### Stream Reconnect Count

It is possible to change from the default 10 times the stream will try to reconnect in case of connection errors.

```javascript
wappsto.config({
	reconnectCount: 3
});
```
