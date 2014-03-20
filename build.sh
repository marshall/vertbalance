#!/bin/bash

set -e
mkdir build || echo -n ''

VERSION=$(python -c "import json; print json.load(open('chrome/manifest.json'))['version']")

cd chrome
zip -r ../build/vertbalance-chrome-v$VERSION.zip *
