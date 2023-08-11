# Wappsto Wapp API
[![CI](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml/badge.svg)](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/Wappsto/javascript-wappsto-wapp/branch/main/graph/badge.svg?token=Y7SPYV4G97)](https://codecov.io/gh/Wappsto/javascript-wappsto-wapp)
[![DeepScan grade](https://deepscan.io/api/teams/18594/projects/21916/branches/639550/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=18594&pid=21916&bid=639550)
[![Depfu](https://badges.depfu.com/badges/f1e2997e207e0d62a4e7d9b87c8368c5/overview.svg)](https://depfu.com/github/Wappsto/javascript-wappsto-wapp?project_id=33978)
[![Seluxit A/S](https://img.shields.io/badge/Seluxit_A/S-1f324d.svg?logo=data:image/x-icon;base64,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)](https://seluxit.com)
[![Wappsto](https://img.shields.io/badge/Wappsto-1f324d.svg?logo=data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAEuAAABLgF7cRpNAAAEM0lEQVR4nO1bwY3bMBCcyysBEpw6sDo4P4LgflEHUQm6DlyCSrgOTiU43yAPpgOVoOtATh55bh6iHJm3uyJFOQxwGmCB2CR3h0tyuVxfbogIrxlvUhNIjc0BqQmkxuaA1ARSY3NAagKpsTkgNYHU2BwgfF8BOAIgRloABwD59el5I8fAqQXP+YhhTi9BRFPZE1FL/miIKHN0/EvJLAdftHaOZx3u5PsAZSN6V+k/klX4jsryhcqmqALIx0oVybWnYc5nB4RsIw0l/f+TH9EQEW6I6C2A30Jw+QqgAdDbz4UNJjuh/8n2af3jVxD2AAyAW6H9GQNfYz9nGPh+Efq/G7c/h1pZhaPi2WvFhLkzfyQ5INfCmBxEVAiNMVuxU8gskbkY5RN/OBQxiVAD4EFo29ltmEXoH5FhuMelbf9guSwDEd0L3vFdwUdlZY6RKw/S8xLtmE4lE8bfazEgJKI3Cslm4cTX1FsKOnLtfDwGkjUKWZ8z6spB0RfqVGmXQiPfBRrJSN+uRYCuStHTUniA7Rg9ZuoAydt5oKGc5Gjtez1q1123YPK5oOtAROfXoBFiZBEYUzs75sS03WKI5trNkEFOdE4ASvxNynxRCN8bABePIc7roWfNZwsbZdxaR2gqDaOrH9unHbnsrqdlRrVjRcQ7liM6oorgwS3s+Xr2WbWYtNZ3UmtG/Kns52x7B4sImdvWhdKuHZeYXZiPfdwB3RVIZCRH9V9E9FNoW3LduWIYvd20j/sWODLR8nNg1HXRQ74Z3gP4wHx/wvCMDY34LjjuF3N0HWAERWUkkbGQ6osK8TUFibO5+MRsGw6habEktaB/inolW2L6O5VF5yZSvimT/76iHa94xtUDuDiwwzq/A2QAPintH7FODSEHX7Z7MTfOAUZQWiymc6lbKmzAtkn2Q1Ao9i/AOaAFH7FjA2ED4M6j3x1iKjwDOK4ncIFVOD8Nc35i0uJKOfcSqgh73u8aqSZomO9uMZSlQ7EH8CS0/bDC4SnCHnfMDNc5xAFA+DEYn7ccnq2+0v5b4hEaFP3u/xHKNuJy+DZwK0rvALc4ohVB1rAp6tAUSYmEb37OxZER3PnW4gR7fhmRqr9iIqcpKwRlPtVibTJaVqmV2H2ComS3kMbMKeQwtxqS44j8XpZGGS9OhPRdJ46ZI8NViTql/xoFzYz4NJZovrDKjVN/nJn7aYyLnDvwmVaJdQqave0rFVYN+EhfgE9/jWptZjVyZSUONGzJmvRtS7QsqdHiCFmbteVwIHnn5ZodHyJzk5tD7WFDkjrS9mzM8SFRRBBoPPTPSRNhv5jTf00SaxVRQPr1KMHL+dcg0dF1/laoJPl2cOHt/FASOQ2edYn0NFw31RUm7kplbblBr7Pc8hB9N0Tbf5p61dgckJpAamwOSE0gNTYHpCaQGpsDUhNIjVfvgD9WFsGCdX/VsgAAAABJRU5ErkJggg==)](https://wappsto.com)

This is a node/js library for easily creating wapps for [Wappsto](https://wappsto.com).

In depth documentation can be found on [Github Pages](https://wappsto.github.io/javascript-wappsto-wapp/)

## Table of Contents

-   [Install](#install)
    -   [Node](#node)
    -   [Browser](#browser)
-   [Usage](#usage)
-   [Create a new IoT Device](#create-a-new-iot-device)
-   [To report a change in the value](#to-report-a-change-in-the-value)
-   [Listing for requests to refresh the value](#listing-for-requests-to-refresh-the-value)
-   [Reporting events for value](#reporting-events-for-value)
-   [To request access to an existing object from the user](#to-request-access-to-an-existing-object-from-the-user)
    -   [Using filters to request access to an existing object from the user](#using-filters-to-request-access-to-an-existing-object-from-the-user)
-   [To find a child from an existing object](#to-find-a-child-from-an-existing-object)
-   [Retrieve object by ID](#retrieve-object-by-id)
-   [To change a value on a network created outside your wapp](#to-change-a-value-on-a-network-created-outside-your-wapp)
-   [To reload a model from the server](#to-reload-a-model-from-the-server)
-   [Listing for changes on values](#listing-for-changes-on-values)
-   [Sending an update event to a device](#sending-an-update-event-to-a-device)
-   [Loading historical data](#loading-historical-data)
-   [Check if a device is online](#check-if-a-device-is-online)
-   [Changing the period and delta of a value](#changing-the-period-and-delta-of-a-value)
-   [Deleting an item that was created](#deleting-an-item-that-was-created)
-   [Analyzing historical data](#analyzing-historical-data)
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
an Network with the same name, the existing network will be returned.

```javascript
let network = await Wappsto.createNetwork({
    name: 'new network name',
});
```

Then you need to create a device. To create a new device under an
existing network, you should call createDevice. If a device exists
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
To create a new value under an existing device, you should call
createValue. If a value exists with the given name, the existing
value will be returned.
There will also be created the states needed based on the
permission. The only allowed values for permission is 'r', 'w' and
'rw'. The state will have 'NA' as the initial data. This can be changed by
setting the `initialState` when creating the value. You can also define the initial
timestamp by setting initialState as an object with data and timestamp.
The list of available value templates can be seen in the
[value_template.ts](https://github.com/Wappsto/javascript-wappsto-wapp/blob/main/src/util/value_template.ts) file.

```javascript
let value = await device.createValue({
    name: 'Temperature',
    permission: 'r',
    template: Wappsto.ValueTemplate.TEMPERATURE_CELSIUS
});
```

It is also possible to define a period for how often the library
should poll your values for updates. In this way regularly reports will
be send to the cloud. It is also possible to filter out small changes
by setting the delta for number values. With the delta set, reported
changes that are not bigger then the delta will be discarded. In the
example below, period is set to 3600 [sec.], i.e. 1 hour interval and
delta to 2 [deg.]. So changes in value data will only apply if after
one hour new temperature value is bigger than 2 [deg.] of previous
temperature value.

```javascript
let value = await device.createValue({
    name: 'Temperature',
    permission: 'r',
    template: Wappsto.ValueTemplate.TEMPERATURE_CELSIUS,
    period: 3600,
    delta: '2'
});
```

It is also possible to define a value where the data is not put into
the historical log. This is done by setting the `disableLog` to
`true`. This can be set on the `createValue` and the special versions
of the createValue function.

```javascript
let value = await device.createValue({
    name: 'Temperature',
    permission: 'r',
    template: Wappsto.ValueTemplate.TEMPERATURE_CELSIUS,
    disableLog: true
});
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
    initialState: {
        data: 0,
        timestamp: '2022-02-02T02:02:02Z',
    },
});
```

To create a custom string value:

```javascript
let value = await device.createStringValue({
    name: 'String Value Name',
    permission: 'rw',
    type: 'debug',
    max: 10,
    encoding: 'debug string',
});
```

To create a custom blob value:

```javascript
let value = await device.createBlobValue({
    name: 'Blob Value Name',
    permission: 'r',
    type: 'binary',
    max: 10,
    encoding: 'binary',
});
```

To create a custom xml value:

```javascript
let value = await device.createBlobValue({
    name: 'XML Value Name',
    permission: 'rw',
    type: 'config',
    namespace: 'seluxit'
    xsd: 'https://xsd.com/test.xsd',
});
```

### To report a change in the value

To send a new data point to wappsto, just call the `report` function
on the value. If you omit the timestamp, it will get the curren time as timestamp.
It is possible to send number, string, boolean and objects.

```javascript
await value.report(1);
await value.report('1', '2022-02-02T02:02:02Z');
await value.report(true);
await value.report({"my_data":"is updated"});
```

And to get the last reported data and timestamp.

```javascript
let data = value.getReportData();
let timestamp = value.getReportTimestamp();
```

If you need to report multiple historical data, you can specify an array of data, timestamp pairs.

```javascript
await value.report([
	{ data: 1, timestamp: '2022-02-02T02:02:01Z' },
	{ data: 2, timestamp: '2022-02-02T02:02:02Z' },
	{ data: 3, timestamp: '2022-02-02T02:02:03Z' },
]);
```

If you do not want the current report state to change, you can use the `sendLogReports` instead.

```javascript
await value.sendLogReports([
	{ data: 1, timestamp: '2022-02-02T02:02:01Z' },
	{ data: 2, timestamp: '2022-02-02T02:02:02Z' },
	{ data: 3, timestamp: '2022-02-02T02:02:03Z' },
]);
```


### Listing for requests to refresh the value

To receive request to refresh the value, register a callback on
`onRefresh`. This can be triggered by an user request or an 
automatic event from the library based on the period.

```javascript
value.onRefresh((value) => {
    value.report(1);
});
```

It is possible to get the type of the source of the refresh event.
But you should not use this information to not send an update on the value.
It is important to always send value updates on all refresh requests.

```javascript
value.onRefresh((value, type) => {
    console.log(`Got a refresh event from ${type}`);
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

### To request access to an existing object from the user

To request access to an existing object, a request have to be
send. You can request a single object or multiple objects of the same
type. To request access to multiple objects, you can specify the
amount after fx. the name `findByName('name', 3)`. You can also
request access to all the possible objects that matches the request by
calling `findAllByName`. If you only need read access to the data,
you can set the `readOnly` to true.

To request access to a network with a specific name, use
`findByName`.

```javascript
let oneNetwork = await Wappsto.Network.findByName('Network name');
let oneReadOnlyNetwork = await Wappsto.Network.findByName('Network name', 1, true);
let multipleNetworks = await Wappsto.Network.findByName('Network name', 3);
let allNetworks = await Wappsto.Network.findAllByName('Network name');
let allReadOnlyNetworks = await Wappsto.Network.findAllByName('Network name', true);
```

To request access to a device with a specific name, use `findByName`.

```javascript
let oneDevice = await Wappsto.Device.findByName('Device name');
let oneReadOnlyDevice = await Wappsto.Device.findByName('Device name', 1, true);
let multipleDevices = await Wappsto.Device.findByName('Device name', 3);
let allDevices = await Wappsto.Device.findAllByName('Device name');
let allReadOnlyDevices = await Wappsto.Device.findAllByName('Device name', true);
```

To request access to a device with a specific product, use `findByProduct`.

```javascript
let oneDevice = await Wappsto.Device.findByProduct('Product name');
let oneReadOnlyDevice = await Wappsto.Device.findByProduct('Product name', 1, true);
let multipleDevices = await Wappsto.Device.findByProduct('Product name', 3);
let allDevices = await Wappsto.Device.findAllByProduct('Product name');
let allReadOnlyDevices = await Wappsto.Device.findAllByProduct('Product name', true);
```

To request access to a value with a specific name, use `findByName`.

```javascript
let oneValue = await Wappsto.Value.findByName('Value name');
let oneReadOnlyValue = await Wappsto.Value.findByName('Value name', 1, true);
let multipleValues = await Wappsto.Value.findByName('Value name', 3);
let allValues = await Wappsto.Value.findAllByName('Value name');
let allReadOnlyValues = await Wappsto.Value.findAllByName('Value name', true);
```

To request access to a value with a specific type, use `findByType`.

```javascript
let oneValue = await Wappsto.Value.findByType('Type name');
let oneReadOnlyValue = await Wappsto.Value.findByType('Type name', 1, true);
let multipleValues = await Wappsto.Value.findByType('Type name', 3);
let allValues = await Wappsto.Value.findAllByType('Type name');
let allReadOnlyValues = await Wappsto.Value.findAllByType('Type name', true);
```

#### Using filters to request access to an existing object from the user

It is also possible to use more advanced filters to get more control
over the specific objects that are requested. It is possible to
combine any keys in the filter, to narrow down the returned objects.
If you need to find multiple of the same type, you can use an Array
with the values. A filter have 3 main entry points `network`, `device`
and `value`. You can see the possible filters below.

```javascript
const filter = {
    network: {
        name: '',
        description: ''
    },
    device: {
        name: '',
        product: ['',''],
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
        description: '',
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
let multipleReadOnlyValues = await Wappsto.Value.findByFilter(filter, omit_filter, 3, true);
let allValues = await Wappsto.Value.findAllByFilter(filter, omit_filter);
let allReadOnlyValues = await Wappsto.Value.findAllByFilter(filter, omit_filter, true);
```

### To find a child from an existing object

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

### Retrieve object by ID

If you already have access to some objects, you can retrieve them
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
`controlWithAck` to wait for the incoming report.

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

If you want to load the newsiest data from the server manually, you can
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

### Loading historical data

It is possible to load historical data for a value. Both report and
control data can be loaded using `getReportLog` and
`getControlLog`. Each function takes a `LogRequest` object, where you
can define the parameters for the log service.

```javascript
const historicalReportData = await value.getReportLog({});
const historicalControlData = await value.getControlLog({});
```

The `LogRequest` object is defined like this:

| **Key**          | **Type** | **Meaning**                                                        |
|------------------|----------|--------------------------------------------------------------------|
| start            | date     | The start time for the log request                                 |
| end              | date     | The end time for the log request                                   |
| limit            | number   | The maximum number of items in the result                          |
| offset           | number   | How many items that should be skipped before returning the result  |
| operation        | string   | What operation should be performed on the data before returning it |
| group_by         | string   | What time interval should the log data be grouped by               |
| timestamp_format | string   | The format the timestamp should be converted into                  |
| timezone         | string   | If the timestamp should be converted to a timezone instead of UTZ  |
| order            | string   | Should the result be ordered ascending or descending               |
| order_by         | string   | The field that should be used to order by                          |
| number           | boolean  | If only numbers should be returned in the log response             |

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
by calling `setConnectionStatus` on the device. This will automatic create
a `CONNECTION_STATUS` value if needed.

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

### Deleting an item that was created

It is possible to remove an item that you have created by calling `delete` on the item.
This will remove the item from the backend.

```javascript
await value.delete();
```

### Analyzing historical data

It is possible to use the Analytic Backend to analyze the historical
data of a value.

#### Energy Data

To convert the total energy value into a load curve value, call `analyzeEnergy` with a start and end time on the value that you want to analyze.

```javascript
const energy_data = await value.analyzeEnergy('2022-01-01T00:00:00Z', '2023-01-01T00:00:00Z');
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

If you need to communicate with the background, it is a good idea to
wait for the background to be ready and have registered the
`waitForBackground` handler. This can be do using the
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
can be registered. If you return something from your handler, it will be returned to the caller.

```javascript
Wappsto.onWebHook((event, method, uri, headers) => {
    console.log('Web Hook event', event);
    return { status: "ok" };
});
```

The webhook url is `https://wappsto.com/services/extsync/request/<wapp_token>`. 
You can get the token from the value `extSyncToken`.

```javascript
console.log(`WebHook URL: https://wappsto.com/services/extsync/request/${Wappsto.extSyncToken}`);
```

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
notified when the storage is updated. It is possible to set a single
or multiple data into the storage. In the same manner it is possible
to get and remove multiple keys at the same time.

```javascript
let storage = await Wappsto.wappStorage();

// Signal when storage is changed
storage.onChange(() => {
    console.log('Storage is updated');
});

// Set new data into the store
await storage.set('key', 'item');
await storage.set({key2: 'item 2', key3: 'item 3'});

// Get data from the store
let data = storage.get('key');
let data2 = storage.get(['key2', 'key3']);


// Reload the data from the server
await storage.reload();

// Remove data from the store
await store.remove('key1');
await store.remove(['key2', 'key3']);

// Delete all the saved data
await storage.reset();
```

It is possible to store secret information in the Storage from the background
part of the wapp. This information is only available for the background wapp
and can't be accessed from the frontend part of the wapp.

```javascript
await storage.setSecret('key', 'item');
const secret_data = storage.getSecret('key', 'item');
await storage.removeSecret('key', 'item');
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
follow. There are 3 special characters in the path, that have special
meaning. `.` is used to separate each element in the path. `*` is used
as matching any relationship. `|` is used as an 'or' between relationships.

```javascript
const leafs = node.transverse('*.contains|child.*');
```

When calling `transverse` the result is the leaf at the end of the
path. But if you want all the nodes that are found along the path, you
can set 'getAll' to true when calling `transverse`.

```javascript
const allNodes = node.transverse('*.contains|child.*', true);
```

To load all the ontology edges from an object, you can call `getAllEdges`.

```javascript
const edges = await node.getAllEdges();
```

To the models that the edge points to is available in the `models` attribute.

```javascript
edges.forEach((edge) => {
	edge.models.forEach((model) => {
		console.log(`The edge points to ${model.name}`);
	});
});
```

The edges are only loaded once, so if you need to refresh the edges from
the backend, you need to force an update by calling `getAllEdges` with true.

```javascript
const edges = await node.getAllEdges(true);
```

If not all models can be loaded that the edge points to, the failed models are
stored in `failedModels` on the edge.

```javascript
const edges = await node.getAllEdges();
console.log(edges[0].failedModels);
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
let networks = await Wappsto.request.get('/network');
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
