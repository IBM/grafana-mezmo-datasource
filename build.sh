#!/bin/bash

set -xe

rm -rf dist sdague-mezmo-datasource

npm run build
npx @grafana/sign-plugin@latest --rootUrls $ROOT_URL
cp -a dist/ sdague-mezmo-datasource/

VERSION=$(cat package.json | jq '.version' -r)

zip sdague-mezmo-datasource-$VERSION.zip sdague-mezmo-datasource -r
sha1sum sdague-mezmo-datasource-$VERSION.zip > sdague-mezmo-datasource-$VERSION.zip.sha1
