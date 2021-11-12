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

### Share an object with an other user in wappsto

To share an object in wappsto with an other user, you should call 'shareWith' on the object.

```javascript
let networks = Wappsto.network.fetch();
networks[0].shareWith('my_friend@mail.test');
```

### Raw requests

It is possible to send your own requests to wappsto by using the 'request' object in wappsto.

```javascript
let netwoks = await Wappsto.request.get('/network');
```