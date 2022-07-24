#!/bin/bash

OS_NAME=$(echo "$RUNNER_OS" | awk '{print tolower($0)}')
MANIFEST_BASE_URL="https://storage.googleapis.com/flutter_infra_release/releases"
MANIFEST_URL="$MANIFEST_BASE_URL/releases_$OS_NAME.json"
MANIFEST_TEST_PATH="test/releases_$OS_NAME.json"
RELEASE_MANIFEST=""
VERSION_MANIFEST=null

# convert version like 2.5.x to 2.5
normalize_version() {
	if [[ $1 == *.x ]]; then
		echo "${1/.x/}"
	else
		echo "$1"
	fi
}

latest_version() {
	jq --arg arch "$ARCH" '.releases | map(select(.dart_sdk_arch == null or .dart_sdk_arch == $arch)) | first'
}

latest_channel_version() {
	jq --arg channel "$1" --arg arch "$ARCH" '.releases | map(select(.channel==$channel) | select(.dart_sdk_arch == null or .dart_sdk_arch == $arch)) | first'
}

wildcard_version() {
	if [[ $2 == *"v"* ]]; then # is legacy version format
		if [[ $1 == any ]]; then
			jq --arg version "$2" '.releases | map(select(.version | startswith($version) )) | first'
		else
			jq --arg channel "$1" --arg version "$2" '.releases | map(select(.channel==$channel) | select(.version | startswith($version) )) | first'
		fi
	elif [[ $1 == any ]]; then
		jq --arg version "$2" --arg arch "$ARCH" '.releases | map(select(.version | startswith($version)) | select(.dart_sdk_arch == null or .dart_sdk_arch == $arch)) | first'
	else
		jq --arg channel "$1" --arg version "$2" --arg arch "$ARCH" '.releases | map(select(.channel==$channel) | select(.version | startswith($version) ) | select(.dart_sdk_arch == null or .dart_sdk_arch == $arch)) | first'
	fi
}

get_version() {
	if [[ $1 == any && $2 == any ]]; then
		latest_version
	elif [[ $2 == any ]]; then
		latest_channel_version "$1"
	else
		wildcard_version "$1" "$2"
	fi
}

get_version_manifest() {
	version_manifest=$(echo "$RELEASE_MANIFEST" | get_version "$1" "$(normalize_version "$2")")

	if [[ $version_manifest == null ]]; then
		# fallback through legacy version format
		version_manifest=$(echo "$RELEASE_MANIFEST" | wildcard_version "$1" "v$(normalize_version "$2")")
	fi

	version_arch=$(echo "$version_manifest" | jq -r '.dart_sdk_arch')

	if [[ "$version_arch" == null ]]; then
		echo "$version_manifest" | jq --arg dart_sdk_arch x64 '.+={dart_sdk_arch:$dart_sdk_arch}'
	else
		echo "$version_manifest"
	fi
}

download_archive() {
	archive_url="$MANIFEST_BASE_URL/$1"
	archive_name=$(basename "$1")
	archive_local="$RUNNER_TEMP/$archive_name"

	curl --connect-timeout 15 --retry 5 "$archive_url" >"$archive_local"

	# Create the target folder
	mkdir -p "$2"

	if [[ $archive_name == *zip ]]; then
		unzip -q -o "$archive_local" -d "$RUNNER_TEMP"
		# Remove the folder again so that the move command can do a simple rename
		# instead of moving the content into the target folder.
		# This is a little bit of a hack since the "mv --no-target-directory"
		# linux option is not available here
		rm -r "$2"
		mv "$RUNNER_TEMP"/flutter "$2"
	else
		tar xf "$archive_local" -C "$2" --strip-components=1
	fi

	rm "$archive_local"
}

transform_path() {
	if [[ $OS_NAME == windows ]]; then
		echo "$1" | sed -e 's/^\///' -e 's/\//\\/g'
	else
		echo "$1"
	fi
}

expand_key() {
	version_channel=$(echo "$VERSION_MANIFEST" | jq -r '.channel')
	version_version=$(echo "$VERSION_MANIFEST" | jq -r '.version')
	version_arch=$(echo "$VERSION_MANIFEST" | jq -r '.dart_sdk_arch')
	version_hash=$(echo "$VERSION_MANIFEST" | jq -r '.hash')
	version_sha_256=$(echo "$VERSION_MANIFEST" | jq -r '.sha256')

	expanded_key="${1/:channel:/$version_channel}"
	expanded_key="${expanded_key/:version:/$version_version}"
	expanded_key="${expanded_key/:arch:/$version_arch}"
	expanded_key="${expanded_key/:hash:/$version_hash}"
	expanded_key="${expanded_key/:sha256:/$version_sha_256}"
	expanded_key="${expanded_key/:os:/$OS_NAME}"

	echo "$expanded_key"
}

not_found_error() {
	echo "Unable to determine Flutter version for channel: $1 version: $2 architecture: $3"
}

check_command() {
	command -v "$1" >/dev/null 2>&1
}

if ! check_command jq; then
	echo "jq not found, please install it, https://stedolan.github.io/jq/download/"
	exit 1
fi

CACHE_PATH=""
CACHE_KEY=""
PRINT_MODE=""

while getopts 'c:k:p:' flag; do
	case "$flag" in
	c) CACHE_PATH="$OPTARG" ;;
	k) CACHE_KEY="$OPTARG" ;;
	p) PRINT_MODE="$OPTARG" ;;
	?) exit 2 ;;
	esac
done

ARR_CHANNEL=("${@:$OPTIND:1}")
ARR_VERSION=("${@:$OPTIND+1:1}")
ARR_ARCH=("${@:$OPTIND+2:1}")

CHANNEL="${ARR_CHANNEL[0]}"
VERSION="${ARR_VERSION[0]}"
ARCH=$(echo "${ARR_ARCH[0]}" | awk '{print tolower($0)}')

# default values
[[ -z $CHANNEL ]] && CHANNEL=stable
[[ -z $VERSION ]] && VERSION=any
[[ -z $ARCH ]] && ARCH=x64
[[ -z $CACHE_PATH ]] && CACHE_PATH=/tmp
[[ -z $CACHE_KEY ]] && CACHE_KEY="flutter-:os:-:arch:-:channel:-:version:-:hash:"

if [[ -n "$PRINT_MODE" ]]; then
	if [[ "$CHANNEL" == master ]]; then
		if [[ "$PRINT_MODE" == version ]]; then
			echo "master:master:$ARCH|master:master:$ARCH"
			exit 0
		fi

		if [[ "$PRINT_MODE" == cache-key ]]; then
			VERSION_MANIFEST="{\"channel\":\"$CHANNEL\",\"version\":\"$CHANNEL\",\"dart_sdk_arch\":\"$ARCH\",\"hash\":\"$CHANNEL\",\"sha256\":\"$CHANNEL\"}"
			EXPANDED_KEY=$(expand_key "$CACHE_KEY")

			echo "$EXPANDED_KEY"
			exit 0
		fi

		exit 1
	fi

	RELEASE_MANIFEST=$(cat "$MANIFEST_TEST_PATH")
	VERSION_MANIFEST=$(get_version_manifest "$CHANNEL" "$VERSION")

	if [[ $VERSION_MANIFEST == null ]]; then
		not_found_error "$CHANNEL" "$VERSION" "$ARCH"
		exit 1
	fi

	if [[ "$PRINT_MODE" == version ]]; then
		VERSION_DEBUG=$(echo "$VERSION_MANIFEST" | jq -j '.channel,":",.version,":",.dart_sdk_arch')

		echo "$CHANNEL:$VERSION:$ARCH|$VERSION_DEBUG"
		exit $?
	fi

	if [[ "$PRINT_MODE" == cache-key ]]; then
		EXPANDED_KEY=$(expand_key "$CACHE_KEY")

		echo "$EXPANDED_KEY"
		exit 0
	fi

	exit 1
fi

CACHE_PATH=$(transform_path "$CACHE_PATH")
SDK_CACHE=$(expand_key "$CACHE_PATH")
PUB_CACHE=$(expand_key "$SDK_CACHE/.pub-cache")

if [[ ! -x "$SDK_CACHE/bin/flutter" ]]; then
	if [[ $CHANNEL == master ]]; then
		git clone -b master https://github.com/flutter/flutter.git "$SDK_CACHE"
	else
		RELEASE_MANIFEST=$(curl --silent --connect-timeout 15 --retry 5 "$MANIFEST_URL")
		VERSION_MANIFEST=$(get_version_manifest "$CHANNEL" "$VERSION")
		if [[ $VERSION_MANIFEST == null ]]; then
			not_found_error "$CHANNEL" "$VERSION" "$ARCH"
			exit 1
		fi
		ARCHIVE_PATH=$(echo "$VERSION_MANIFEST" | jq -r '.archive')
		download_archive "$ARCHIVE_PATH" "$SDK_CACHE"
	fi
fi

{
	echo "FLUTTER_ROOT=$SDK_CACHE"
	echo "PUB_CACHE=$PUB_CACHE"
} >>"$GITHUB_ENV"

{
	echo "$SDK_CACHE/bin"
	echo "$SDK_CACHE/bin/cache/dart-sdk/bin"
	echo "$PUB_CACHE/bin"
} >>"$GITHUB_PATH"
