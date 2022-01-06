#!/bin/bash

OS_NAME=$(echo "$RUNNER_OS" | awk '{print tolower($0)}')
MANIFEST_BASE_URL="https://storage.googleapis.com/flutter_infra_release/releases"
MANIFEST_URL="${MANIFEST_BASE_URL}/releases_${OS_NAME}.json"

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
  if [[ $1 == any ]]; then
    jq --arg version "^$2" '.releases | map(select(.version | test($version))) | first'
  else
    jq --arg channel "$1" --arg version "^$2" '.releases | map(select(.channel==$channel) | select(.version | test($version))) | first'
  fi
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

download_archive() {
  archive_url="$MANIFEST_BASE_URL/$1"
  archive_name=$(basename $1)
  archive_local="$HOME/$archive_name"

  curl --connect-timeout 15 --retry 5 $archive_url >$archive_local

  if [[ $archive_name == *zip ]]; then
    unzip -o "$archive_local" -d "$2"
  else
    tar xf "$archive_local" -C "$2"
  fi

  rm $archive_local
}

CHANNEL="$1"
VERSION="$2"

if [[ $CHANNEL == master ]]; then
  git clone -b master https://github.com/flutter/flutter.git "$RUNNER_TOOL_CACHE/flutter"
else
  VERSION_MANIFEST=$(get_version_manifest $CHANNEL $VERSION)

  if [[ $VERSION_MANIFEST == null ]]; then
    echo "Unable to determine Flutter version for $CHANNEL $VERSION"
    exit 1
  fi

  ARCHIVE_PATH=$(echo $VERSION_MANIFEST | jq -r '.archive')
  download_archive "$ARCHIVE_PATH" "$RUNNER_TOOL_CACHE"
fi

if [[ $OS_NAME == windows ]]; then
  FLUTTER_ROOT="${RUNNER_TOOL_CACHE}\\flutter"
  PUBCACHE="${USERPROFILE}\\.pub-cache"
else
  FLUTTER_ROOT="${RUNNER_TOOL_CACHE}/flutter"
  PUBCACHE="${HOME}/.pub-cache"
fi

echo "FLUTTER_ROOT=${FLUTTER_ROOT}" >>$GITHUB_ENV
echo "PUB_CACHE=${PUBCACHE}" >>$GITHUB_ENV

echo "${FLUTTER_ROOT}/bin" >>$GITHUB_PATH
echo "${FLUTTER_ROOT}/bin/cache/dart-sdk/bin" >>$GITHUB_PATH
echo "${PUBCACHE}/bin" >>$GITHUB_PATH
