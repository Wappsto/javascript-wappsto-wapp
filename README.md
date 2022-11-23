# Wappsto Wapp API
[![CI](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml/badge.svg)](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/Wappsto/javascript-wappsto-wapp/branch/main/graph/badge.svg?token=Y7SPYV4G97)](https://codecov.io/gh/Wappsto/javascript-wappsto-wapp)
[![DeepScan grade](https://deepscan.io/api/teams/18594/projects/21916/branches/639550/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=18594&pid=21916&bid=639550)
[![Depfu](https://badges.depfu.com/badges/f1e2997e207e0d62a4e7d9b87c8368c5/overview.svg)](https://depfu.com/github/Wappsto/javascript-wappsto-wapp?project_id=33978)

This is a node/js library for easily creating wapps for [Wappsto](https://wappsto.com).

## Table of Contents

-   [Install](#install)
    -   [Node](#node)
    -   [Browser](#browser)
-   [Usage](#usage)
    -   [Create a new IoT Device](#create-a-new-iot-device)
    -   [To report a change in the value](#to-report-a-change-in-the-value)
    -   [Listing for requests to refresh the value](#listing-for-requests-to-refresh-the-value)
    -   [Reporting events for value](#reporting-events-for-value)
    -   [To request access to an exsisting object from the user](#to-request-access-to-an-exsisting-object-from-the-user)
    	- 	[Using filters to request access to an exsisting object from the user](#using-filters-to-request-access-to-an-exsisting-object-from-the-user)
    -   [To find a child from an exsisting object](#to-find-a-child-from-an-exsisting-object)
    -   [Retrive object by ID](#retrive-object-by-id)
    -   [To change a value on a network created outside your wapp](#to-change-a-value-on-a-network-created-outside-your-wapp)
    -   [To reload a model from the server](#to-reload-a-model-from-the-server)
    -   [Listing for changes on values](#listing-for-changes-on-values)
    -   [Sending an update event to a device](#sending-an-update-event-to-a-device)
    -   [Check if a device is online](#check-if-a-device-is-online)
    -   [Sending messages to and from the background](#sending-messages-to-and-from-the-background)
    -   [Waiting for the background to be ready](#waiting-for-the-background-to-be-ready)
    -   [Web Hook](#web-hook)
    -   [Wapp Storage](#wapp-storage)
    -   [OAuth](#oauth)
    -   [Notification](#notification)
    -   [Ontology](#ontology)
    -   [Background logging](#background-logging)
    -   [Raw requests](#raw-requests)
    -   [Config](#config)
        -   [Enable verbose responses from wappsto](#enable-verbose-responses-from-wappsto)
        -   [Validation](#validation)
        -   [Stream Reconnect Count](#stream-reconnect-count)

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

or

```javascript
import Wappsto from 'wappsto-wapp';
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
To create a new network you need to call 'createNetwork'. If there is
an Network with the same name, the exsisting network will be returned.

```javascript
let network = await Wappsto.createNetwork({
	name: 'new network name',
});
```

Then you need to create a device. To create a new device under an
existing network, you should call createDevice. If a device exsists
with the given name, the existing device will be returned.

```javascript
let device = await network.createDevice({
	name: 'Device Name',
	product: 'Great Product',
	serial: 'SG123456',
	description: 'My great new device',
	protocol: 'WAPP-JS',
	communication: 'wapp',
	version: '1.0.0',
	manufacturer: 'My Self',
});
```

Then you need to create new values.
To create a new value under an exsisting device, you should call
createValue. If a value exsists with the given name, the existing
value will be returned.
There will also be created the states nedded based on the
permission. The only allowed values for permission is 'r', 'w' and
'rw'.
The list of avaible value templates can be seen in the
[value_template.ts](../main/src/util/value_template.ts) file.

```javascript
let value = await device.createValue(
	'Temperature',
	'r',
	Wappsto.ValueTemplate.TEMPERATURE_CELSIUS
);
```

It is also possible to define a period for how often the library
should poll your values for updates. In this way regulary reports will
be send to the cloud. It is also possible to filter out small changes
by setting the delta for number values. With the delta set, reported
changes that are not bigger then the delta will be discarded. In the
example below, period is set to 3600 [sec.], i.e. 1 hour interval and
delta to 2 [deg.]. So changes in value data will only apply if after
one hour new temperature value is bigger than 2 [deg.] of previous
temperature value.

```javascript
let value = await device.createValue(
	'Temperature',
	'r',
	Wappsto.ValueTemplate.TEMPERATURE_CELSIUS,
	3600,
	'2'
);
```

It is also possible to define a value where the data is not put into
the historical log. This is done by setting the `disableLog` to
`true`. This can be set on the `createValue` and the special versions
of the createValue funciton.

```javascript
let value = await device.createValue(
	'Temperature',
	'r',
	Wappsto.ValueTemplate.TEMPERATURE_CELSIUS,
	3600,
	'2',
	true
);
```

There are some helper functions to create custom number, string, blob
and xml values. To create a custom number value:

```javascript
let value = await device.createNumberValue({
	name: 'Value Name',
	permission: 'rw',
	type: 'Counter',
	period: '1h',
	delta: '1',
	min: 0,
	max: 10,
	step: 1,
	unit: 'count',
	si_conversion: 'c',
	disableLog: false,
});
```

To create a custom string value:

```javascript
let value = await device.createStringValue({
	name: 'Value Name',
	permission: 'rw',
	type: 'debug',
	max: 10,
	encoding: 'debug string',
});
```

### To report a change in the value

To send a new data point to wappsto, just call the `report` function
on the value.

```javascript
await value.report('1');
```

And to get the last reported data and timestamp.

```javascript
let data = value.getReportData();
let timestamp = value.getReportTimestamp();
```

### Listing for requests to refresh the value

To receive request to refresh the value, register a callback on
`onRefresh`.

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

-   important
-   error
-   success
-   warning
-   info
-   debug

```javascript
await value.addEvent('error', 'something went wrong');
```

### To request access to an exsisting object from the user

To request access to an exsisting object, a request have to be
send. You can request a single object or multiple objects of the same
type. To request access to multiple objects, you can specify the
amount after fx. the name `findByName('name', 3)`. You can also
request access to all the possible objects that matches the request by
calling `findAllByName`.

To request access to a network with a spefict name, use
`findByName`.

```javascript
let oneNetwork = await Wappsto.Network.findByName('Network name');
let multipleNetworks = await Wappsto.Network.findByName('Network name', 3);
let allNetworks = await Wappsto.Network.findAllByName('Network name');
```

To request access to a device with a spefict name, use `findByName`.

```javascript
let oneDevice = await Wappsto.Device.findByName('Device name');
let multipleDevices = await Wappsto.Device.findByName('Device name', 3);
let allDevices = await Wappsto.Device.findAllByName('Device name');
```

To request access to a device with a spefict product, use `findByProduct`.

```javascript
let oneDevice = await Wappsto.Device.findByProduct('Product name');
let multipleDevices = await Wappsto.Device.findByProduct('Product name', 3);
let allDevices = await Wappsto.Device.findAllByProduct('Product name');
```

To request access to a value with a spefict name, use `findByName`.

```javascript
let oneValue = await Wappsto.Value.findByName('Value name');
let multipleValues = await Wappsto.Value.findByName('Value name', 3);
let allValues = await Wappsto.Value.findAllByName('Value name');
```

To request access to a value with a spefict type, use `findByType`.

```javascript
let oneValue = await Wappsto.Value.findByType('Type name');
let multipleValues = await Wappsto.Value.findByType('Type name', 3);
let allValues = await Wappsto.Value.findAllByType('Type name');
```

#### Using filters to request access to an exsisting object from the user

It is also possible to use more advanced filters to get more control
over the specific objects that are requested. It is possible to
combine any keys in the filter, to narrow down the returned objects. A
filter have 3 main entry points `network`, `device` and `value`. You
can see the posible filters below.

```javascript
const filter = {
	network: {
		name: '',
		description: ''
	},
	device: {
		name: '',
	    product: '',
	    serial: '',
	    description: '',
	    protocol: '',
	    communication: '',
	    version: '',
	    manufacturer: ''
	},
	value: {
		name: '',
    	permission: '',
    	type: '',
    	description: ''
    	period: '',
    	delta: '',
    	number: {
    		min: '',
		    max: '',
		    step: '',
		    unit: '',
		    si_conversion: ''
		},
		string: {
			max: '',
		    encoding: '',
		},
		blob: {
			max: '',
		    encoding: '',
		},
		xml: {
			xsd: '',
    		namespace: ''
		}
	}
}
```

When you have defined the filter, you can use it in the function
`findByFilter` and `findAllByFilter` on `Network`, `Device` and
`Value`.

```javascript
const filter = { value: { type: 'energy' }};
let oneValue = await Wappsto.Value.findByFilter(filter);
let allValues = await Wappsto.Value.findAllByFilter(filter);
```

It is also possible to use the filter to omit objects by giving a second filter to the `findByFilter` and `findAllByFilter`.

```javascript
const filter = { value: { type: 'energy' }};
const omit_filter = { device: { name: 'Wrong' }};
let oneValue = await Wappsto.Device.findByFilter(filter, omit_filter);
let multipleValues = await Wappsto.Value.findByFilter(filter, omit_filter, 3);
let allValues = await Wappsto.Value.findAllByFilter(filter, omit_filter);
```

### To find a child from an exsisting object

To find devices under a network, you can call `findDeviceByName` to
search for all devices with the given name.

```javascript
let devices = network.findDeviceByName('Device name');
```

Or you can search for all devices with a given product.

```javascript
let devices = network.findDeviceByProduct('Device product');
```

To find all values under a network or device, you can call
`findValueByName` to search for all values with the given name.

```javascript
let values = network.findValueByName('value name');
let values = device.findValueByName('value name');
```

Or you can find all values with a given type, by calling
`findValueByType`.

```javascript
let values = network.findValueByType('value type');
let values = device.findValueByType('value type');
```

### Retrive object by ID

If you already have access to some objects, you can retrive them
directly by their ID.

```javascript
let network = Wappsto.Network.findById('655937ac-c054-4cc0-80d7-400486b4ceb3');
let device = Wappsto.Device.findById('066c65d7-6612-4826-9e23-e63a579fbe8b');
let value = Wappsto.Value.findById('1157b4fa-2745-4940-9201-99eee5929eff');
```

### To change a value on a network created outside your wapp

To send a new data point to another value, just call the `control`
function on the value.

```javascript
const result = await value.control('1');
if (!result) {
	console.warn('Failed to send control to device');
}
```

If you need to verify that the device send back a report, you can use
`controlWithAck` to wait for the incomming report.

```javascript
const result = await value.controlWithAck('1');
if (!result || value.getReportData() !== '1') {
	console.warn('Device failed to verify the control');
}
```

And to get the last controlled data and timestamp.

```javascript
let data = value.getControlData();
let timestamp = value.getControlTimestamp();
```

### Listing for changes on values

You can register onControl and onReport to receive events when the
value changes.

```javascript
value.onReport((value, data, timestamp) => {
	console.log(`${value.name} changed it's report value to ${data}`);
});

value.onControl((value, data, timestamp) => {
	console.log(`Request to change ${value.name} to ${data}`);
});
```

If you want the onReport callback to be called with the current data,
then you can set the ´callOnInit´ to `true` when registering your
`onReport` callback.

```javascript
value.onReport(reportCallback, true);
```

And you can cancel these callbacks by calling `cancelOnReport` and
`cancelOnControl`.

```javascript
value.cancelOnReport();

value.cancelOnControl();
```

### To reload a model from the server

If you want to load the newiest data from the server manually, you can
call `reload` on the model, to get the latest data for that model.

```javascript
await device.reload();
```

If you want to also load all the children data, you should call
`reload` with `true`.

```javascript
await device.reload(true);
```

### Sending an update event to a device

To send an event to a device to get a new report data.

```javascript
await value.refresh();
```

### Check if a device is online

It is possible to check if a network or device is online by calling
`isOnline`.

```javascript
if (network.isOnline()) {
	console.log('Network is online');
}
if (device.isOnline()) {
	console.log('Device is online');
}
```

You can also register a callback that are called every time the
connection status changes.

```javascript
network.onConnectionChange((network, status) => {
	console.log(
		`Network ${network.name} is now ${status ? 'online' : 'offline'}`
	);
});
```

If you have a created your own device, you can set it online/offline
by calling `setConnectionStatus` on the device, if you have added a
`CONNECTION_STATUS` value before hand.

```javascript
await device.setConnectionStatus(true);
```

### Changing the period and delta of a value

To change the delta and period of a value you can call `setDelta` or
`setPeriod`.

```javascript
value.setPeriod('300');

value.setDelta(2.2);
```

### Sending messages to and from the background

It is possible to send messages to and from the background and the
foreground. When you register a event handler, it will be called for
each event send. The return value of your event handler is send back
to the sender of the event.

```javascript
Wappsto.fromBackground((msg) => {
	console.log('Message from the background: ' + msg);
	return 'Hello back';
});

Wappsto.fromForeground((msg) => {
	console.log('Message from the foreground: ' + msg);
	return 'Hello front';
});

let backgroundResult = await Wappsto.sendToBackground('hello');
console.log('Result from background: ' + backgroundResult);
let foregroundResult = await Wappsto.sendToForeground('hello');
console.log('Result from foreground: ' + foregroundResult);
```

If you want to send a message, but do not want a reply, you can use
`signalBackground`.

```javascript
await Wappsto.signalBackground('start');
await Wappsto.signalForeground('started');
```

If you do not want to receive anymore messages, you can cancel the
event handler.

```javascript
Wappsto.cancelFromBackground();
Wappsto.cancelFromForeground();
```

### Waiting for the background to be ready

If you need to comunitate with the background, it is a good idea to
wait for the background to be ready and have registered the
`waitForForground` handler. This can be do using the
`waitForBackground` function.

```javascript
const result = await Wappsto.waitForBackground();
if (result) {
	console.log('The background is now ready');
}
```

It waits for 10 seconds, but this can be changed by giving it a new
timeout. And `-1` to wait for ever.

```javascript
const result = await Wappsto.waitForBackground(20);
```

### Web Hook

If the Ext Sync is enabled for the Wapp, a event handler for WebHooks
can be registered.

```javascript
Wappsto.onWebHook((event) => {
	console.log('Web Hook event', event);
});
```

The webhook url is `https://wappsto.com/services/extsync/request/<wapp
token>`. The token can be obtained from the settings page of your wapp
on `wappsto.com`.

And if you want to cancel the web hook event handler, you can call
`cancelWebHook`.

```javascript
Wappsto.cancelOnWebHook(handler);
```

You can turn on `Ext Sync` support using the `wappsto-cli` using the
`npx wapp configure` command.

### Wapp Storage

It is possible to store configuration parameters and other information
in the Wapp Storage. This data is persisted on Wappsto and can be read
from the foreground and background wapp. The data can be reload from
the server by calling `reload` function. The data can be deleted by
calling the `reset` function. A callback can also be registered to be
notified when the storage is updated.

```javascript
let storage = await Wappsto.wappStorage();
//Signal when storage is changed
storage.onChange(() => {
	console.log('Storage is updated');
});
await storage.set('key', 'item');
let data = storage.get('key');
// Reload the data from the server
await storage.reload();
// Delete all the saved data
await storage.reset();
```

### OAuth

To get an already created OAuth token, call the getToken with the name
of the oauth. If there is no token generated yet, a `Request Handler`
needs to be supplied, so that the library can call it with the url
that the user needs to visit, in order to generate the OAuth Token.

```javascript
try {
	let token = await Wappsto.OAuth.getToken('oauth name', (url) => {
		console.log(`Please visit ${url} to generate the OAuth token`);
	});
	console.log('OAuth Token', token);
} catch (e) {
	console.log('Failed to get OAuth token', e);
}
```

### Notification

It is possible to send custom notification to the main Wappsto.com
dashboard.

```javascript
await Wappsto.notify('This is a custom notification from my Wapp');
```

You can also send an email to your self by calling `sendMail`.

```javascript
await Wappsto.sendMail({
	subject: 'Mail with information',
	body: '<h1>Hello from the Wapp</h1><p>Here is some more information</p>',
	from: 'My New Wapp',
});
```

It is also possible to send a SMS to your self, if your phone number
is verified.

```javascript
await Wappsto.sendSMS('Simple SMS from your Wapp');
```

### Ontology

To build a relationship graph of your data, you need to define the
ontology.

To add a relationship between two objects, you call `createEdge` with
the relationship that you want to define.

```javascript
const edge = await startNode.createEdge({ relationship: 'child', to: endNode });
```

You can also supply more information about the edge.

```javascript
const fullEdge = await startNode.createEdge({
	relationship: 'child',
	to: endNode,
	name: 'My Edge',
	description: 'This is my first edge',
	data: { msg: 'My own data for this edge' },
});
```

If you need a virtual object to create an edge to or from, you can
create a new node. To create a node in the graph, you call the `createNode`
function.

```javascript
const startNode = await Wappsto.createNode('start node');
```

When you have created your ontology, you can `transverse` the graph
and find 'leafs' in the graph. You need to define a path to
follow. There are 3 special charaters in the path, that have special
meaning. `.` is used to separate each element in the path. `*` is used
as matching any relationship. `|` is used as an 'or' between relationships.

```javascript
const leafs = node.transverse('*.contains|child.*');
```

When calling `transverse` the result is the leaf at the end of the
path. But if you want all the nodes that are found along the path, you
can set 'getAll' to true when callling `transverse`.

```javascript
const allNodes = node.transverse('*.contains|child.*', true);
```

To load all the ontology edges from an object, you can call `getAllEdges`.

```javascript
const edges = await node.getAllEdges();
```

The edges are only loaded once, so if you need to refresh the edges from
the backend, you need to force an update by calling `getAllEdges` with true.

```javascript
const edges = await node.getAllEdges(true);
```

To remove an edge, you can just call `delete` on the edge, but if you
 want to remove the whole branch, you can call `deleteBranch`.
This will remove all edges and nodes under this node or edge.

```javascript
await startNode.deleteBranch();
```

### Background logging

The debug log from the background wapp is enabled by default, but can
be turned off by calling `stopLogging`.

```javascript
Wappsto.stopLogging();
```

### Raw requests

It is possible to send your own requests to wappsto by using the
`request` object in wappsto.

```javascript
let netwoks = await Wappsto.request.get('/network');
await Wappsto.request.post('/network', { name: 'Network Name' });
```

### Config

It is possible to change some of the behavior of the library using config.

#### Validation

It is possible to disable the validation of the input parameters, by
changing it in the config. It can be 'none' or 'normal'.
The default validation is 'normal'.

```javascript
Wappsto.config({
	validation: 'none',
});
```

#### Stream Reconnect Count

It is possible to change from the default 10 times the stream will try
to reconnect in case of connection errors.

```javascript
Wappsto.config({
	reconnectCount: 3,
});
```

#### Debug information

It is possible to get a lot of extra debug information about when the
library is doing by enabling debug options.

```javascript
Wappsto.config({
	debug: true,
	requests: true,
	stream: true,
});
```
