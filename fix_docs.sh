#!/bin/sh
sed -i -E 's/(<li><a href="#)([a-z]+)/\1$\2/g' docs/index.html