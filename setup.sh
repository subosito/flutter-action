#!/bin/bash
set -eu

check_command() {
	command -v "$1" >/dev/null 2>&1
}

if ! check_command jq; then
	echo "jq not found. Install it from https://stedolan.github.io/jq"
	exit 1
fi

OS_NAME=$(echo "$RUNNER_OS" | awk '{print tolower($0)}')
ARCH_NAME=$(echo "$RUNNER_ARCH" | awk '{print tolower($0)}')
MANIFEST_BASE_URL="${FLUTTER_STORAGE_BASE_URL:-https://storage.googleapis.com}/flutter_infra_release/releases"
MANIFEST_JSON_PATH="releases_$OS_NAME.json"
MANIFEST_URL="$MANIFEST_BASE_URL/$MANIFEST_JSON_PATH"

filter_by_channel() {
	jq --arg channel "$1" '[.releases[] | select($channel == "any" or .channel == $channel)]'
}

filter_by_arch() {
	jq --arg arch "$1" '[.[] | select(.dart_sdk_arch == $arch or ($arch == "x64" and (has("dart_sdk_arch") | not)))]'
}

filter_by_version() {
	jq --arg version "$1" '.[].version |= gsub("^v"; "") | (if $version == "any" then .[0] else (map(select(.version == $version or (.version | startswith(($version | sub("\\.x$"; "")) + ".")) and .version != $version)) | .[0]) end)'
}

not_found_error() {
	echo "Unable to determine Flutter version for channel: $1 version: $2 architecture: $3"
}

transform_path() {
	if [ "$OS_NAME" = windows ]; then
		echo "$1" | sed -e 's/^\///' -e 's/\//\\/g'
	else
		echo "$1"
	fi
}

download_archive() {
	archive_url="$MANIFEST_BASE_URL/$1"
	archive_name=$(basename "$1")
	archive_local="$RUNNER_TEMP/$archive_name"

	curl --connect-timeout 15 --retry 5 "$archive_url" >"$archive_local"

	mkdir -p "$2"

	case "$archive_name" in
	*.zip)
		EXTRACT_PATH="$RUNNER_TEMP/_unzip_temp"
		unzip -q -o "$archive_local" -d "$EXTRACT_PATH"
		# Remove the folder again so that the move command can do a simple rename
		# instead of moving the content into the target folder.
		# This is a little bit of a hack since the "mv --no-target-directory"
		# linux option is not available here
		rm -r "$2"
		mv "$EXTRACT_PATH"/flutter "$2"
		rm -r "$EXTRACT_PATH"
		;;
	*)
		tar xf "$archive_local" -C "$2" --strip-components=1
		;;
	esac

	rm "$archive_local"
}

CACHE_PATH=""
CACHE_KEY=""
PUB_CACHE_PATH=""
PUB_CACHE_KEY=""
PRINT_ONLY=""
TEST_MODE=false
ARCH=""
VERSION=""
VERSION_FILE=""
GIT_SOURCE=""

while getopts 'tc:k:d:l:pa:n:f:g:' flag; do
	case "$flag" in
	c) CACHE_PATH="$OPTARG" ;;
	k) CACHE_KEY="$OPTARG" ;;
	d) PUB_CACHE_PATH="$OPTARG" ;;
	l) PUB_CACHE_KEY="$OPTARG" ;;
	p) PRINT_ONLY=true ;;
	t) TEST_MODE=true ;;
	a) ARCH="$(echo "$OPTARG" | awk '{print tolower($0)}')" ;;
	n) VERSION="$OPTARG" ;;
	f)
		VERSION_FILE="$OPTARG"
		if [ -n "$VERSION_FILE" ] && ! check_command yq; then
			echo "yq not found. Install it from https://mikefarah.gitbook.io/yq"
			exit 1
		fi
		;;
	g) GIT_SOURCE="$OPTARG" ;;
	?) exit 2 ;;
	esac
done

[ -z "$ARCH" ] && ARCH="$ARCH_NAME"

if [ -n "$VERSION_FILE" ]; then
	if [ -n "$VERSION" ]; then
		echo "Cannot specify both a version and a version file"
		exit 1
	fi

	VERSION="$(yq eval '.environment.flutter' "$VERSION_FILE")"
fi

ARR_CHANNEL=("${@:$OPTIND:1}")
CHANNEL="${ARR_CHANNEL[0]:-}"

[ -z "$CHANNEL" ] && CHANNEL=stable
[ -z "$VERSION" ] && VERSION=any
[ -z "$ARCH" ] && ARCH=x64
[ -z "$CACHE_PATH" ] && CACHE_PATH="$RUNNER_TOOL_CACHE/flutter/:channel:-:version:-:arch:"
[ -z "$CACHE_KEY" ] && CACHE_KEY="flutter-:os:-:channel:-:version:-:arch:-:hash:"
[ -z "$PUB_CACHE_KEY" ] && PUB_CACHE_KEY="flutter-pub-:os:-:channel:-:version:-:arch:-:hash:"
[ -z "$PUB_CACHE_PATH" ] && PUB_CACHE_PATH="default"
[ -z "$GIT_SOURCE" ] && GIT_SOURCE="https://github.com/flutter/flutter.git"

# `PUB_CACHE` is what Dart and Flutter looks for in the environment, while
# `PUB_CACHE_PATH` is passed in from the action.
#
# If `PUB_CACHE` is set already, then it should continue to be used. Otherwise, satisfy it
# if the action requests a custom path, or set to the Dart default values depending
# on the operating system.
if [ -z "${PUB_CACHE:-}" ]; then
	if [ "$PUB_CACHE_PATH" != "default" ]; then
		PUB_CACHE="$PUB_CACHE_PATH"
	elif [ "$OS_NAME" = "windows" ]; then
		PUB_CACHE="$LOCALAPPDATA\\Pub\\Cache"
	else
		PUB_CACHE="$HOME/.pub-cache"
	fi
fi

if [ "$TEST_MODE" = true ]; then
	RELEASE_MANIFEST=$(cat "$(dirname -- "${BASH_SOURCE[0]}")/test/$MANIFEST_JSON_PATH")
else
	RELEASE_MANIFEST=$(curl --silent --connect-timeout 15 --retry 5 "$MANIFEST_URL")
fi

if [ "$CHANNEL" = "master" ] || [ "$CHANNEL" = "main" ]; then
	VERSION_MANIFEST="{\"channel\":\"$CHANNEL\",\"version\":\"$VERSION\",\"dart_sdk_arch\":\"$ARCH\",\"hash\":\"$CHANNEL\",\"sha256\":\"$CHANNEL\"}"
else
	VERSION_MANIFEST=$(echo "$RELEASE_MANIFEST" | filter_by_channel "$CHANNEL" | filter_by_arch "$ARCH" | filter_by_version "$VERSION")
fi

case "$VERSION_MANIFEST" in
*null*)
	not_found_error "$CHANNEL" "$VERSION" "$ARCH"
	exit 1
	;;
esac

expand_key() {
	version_channel=$(echo "$VERSION_MANIFEST" | jq -r '.channel')
	version_version=$(echo "$VERSION_MANIFEST" | jq -r '.version')
	version_arch=$(echo "$VERSION_MANIFEST" | jq -r '.dart_sdk_arch // "x64"')
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

CACHE_KEY=$(expand_key "$CACHE_KEY")
PUB_CACHE_KEY=$(expand_key "$PUB_CACHE_KEY")
CACHE_PATH=$(expand_key "$(transform_path "$CACHE_PATH")")
PUB_CACHE=$(expand_key "$(transform_path "$PUB_CACHE")")

if [ "$PRINT_ONLY" = true ]; then
	version_info=$(echo "$VERSION_MANIFEST" | jq -j '.channel,":",.version,":",.dart_sdk_arch // "x64"')

	info_channel=$(echo "$version_info" | awk -F ':' '{print $1}')
	info_version=$(echo "$version_info" | awk -F ':' '{print $2}')
	info_architecture=$(echo "$version_info" | awk -F ':' '{print $3}')

	if [ "$TEST_MODE" = true ]; then
		echo "CHANNEL=$info_channel"
		echo "VERSION=$info_version"
		# VERSION_FILE is not printed, because it is essentially same as VERSION
		echo "ARCHITECTURE=$info_architecture"
		echo "CACHE-KEY=$CACHE_KEY"
		echo "CACHE-PATH=$CACHE_PATH"
		echo "PUB-CACHE-KEY=$PUB_CACHE_KEY"
		echo "PUB-CACHE-PATH=$PUB_CACHE"
		exit 0
	fi

	{
		echo "CHANNEL=$info_channel"
		echo "VERSION=$info_version"
		# VERSION_FILE is not printed, because it is essentially same as VERSION
		echo "ARCHITECTURE=$info_architecture"
		echo "CACHE-KEY=$CACHE_KEY"
		echo "CACHE-PATH=$CACHE_PATH"
		echo "PUB-CACHE-KEY=$PUB_CACHE_KEY"
		echo "PUB-CACHE-PATH=$PUB_CACHE"
	} >>"${GITHUB_OUTPUT:-/dev/null}"

	exit 0
fi

if [ ! -x "$CACHE_PATH/bin/flutter" ]; then
	if [ "$CHANNEL" = "master" ] || [ "$CHANNEL" = "main" ]; then
		git clone -b "$CHANNEL" "$GIT_SOURCE" "$CACHE_PATH"
		if [ "$VERSION" != "any" ]; then
			git config --global --add safe.directory "$CACHE_PATH"
			(cd "$CACHE_PATH" && git checkout "$VERSION")
		fi
	else
		archive_url=$(echo "$VERSION_MANIFEST" | jq -r '.archive')
		download_archive "$archive_url" "$CACHE_PATH"
	fi
fi

{
	echo "FLUTTER_ROOT=$CACHE_PATH"
	echo "PUB_CACHE=$PUB_CACHE"
} >>"${GITHUB_ENV:-/dev/null}"

{
	echo "$CACHE_PATH/bin"
	echo "$CACHE_PATH/bin/cache/dart-sdk/bin"
	echo "$PUB_CACHE/bin"
} >>"${GITHUB_PATH:-/dev/null}"
