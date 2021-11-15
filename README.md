# Wappsto Wapp API [![CI](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml/badge.svg)](https://github.com/Wappsto/wappsto-wapp/actions/workflows/main.yml)

This is a node/js library for easily creating wapps for [Wappsto](https://wappsto.com)

## Usage

Here are some examlples on how to use the library.

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
