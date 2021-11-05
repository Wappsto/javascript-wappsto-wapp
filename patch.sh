#!/bin/bash

sed -i 's|"./": "./"|"./*": "./"|g' node_modules/tsdx/node_modules/tslib/package.json
