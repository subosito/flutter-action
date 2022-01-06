#!/bin/bash

OS_NAME=$(echo "$RUNNER_OS" | awk '{print tolower($0)}')
MANIFEST_URL="https://storage.googleapis.com/flutter_infra_release/releases/releases_$OS_NAME.json"

# convert version like 2.5.x to 2.5
normalize_version() {
  if [[ $1 == *x ]]; then
    echo ${1::-2}
  else
    echo $1
  fi
}

latest_version() {
  jq --arg channel "$1" '.releases | map(select(.channel==$channel)) | first'
}

wildcard_version() {
  jq --arg channel "$1" --arg version "^$2" '.releases | map(select(.channel==$channel) | select(.version | test($version))) | first'
}

get_version() {
  if [[ -z $2 ]]; then
    latest_version $1
  else
    wildcard_version $1 $2
  fi
}

get_version_manifest() {
  releases_manifest=$(curl --silent --connect-timeout 15 --retry 5 $MANIFEST_URL)
  version_manifest=$(echo $releases_manifest | get_version $1 $(normalize_version $2))

  if [[ $version_manifest == null ]]; then
    # fallback through legacy version format
    echo $releases_manifest | wildcard_version $1 "v$(normalize_version $2)"
  else
    echo $version_manifest
  fi
}

CHANNEL="$1"
VERSION="$2"
VERSION_MANIFEST=$(get_version_manifest $CHANNEL $VERSION)

echo $OS_NAME
echo $MANIFEST_URL
echo $CHANNEL
echo $VERSION
echo $VERSION_MANIFEST

