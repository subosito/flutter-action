# flutter-action

Flutter environment for use in GitHub Actions. It works on Linux, Windows, and macOS.

## Usage

Use specific version and channel:

```yaml
steps:
- uses: actions/checkout@v3
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '2.8.0'
    channel: 'stable'
- run: flutter --version
```

Use latest release for particular channel:

```yaml
steps:
- uses: actions/checkout@v3
- uses: subosito/flutter-action@v2
  with:
    channel: 'stable' # or: 'beta' or 'master'
- run: flutter --version
```

Use latest release for particular version and/or channel:

```yaml
steps:
- uses: actions/checkout@v3
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '1.22.x' # or, you can use 1.22
    channel: 'dev'
- run: flutter --version
```

Use particular version on any channel:

```yaml
steps:
- uses: actions/checkout@v3
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '2.x'
    channel: 'any'
- run: flutter --version
```

Build Android APK and app bundle:

```yaml
steps:
- uses: actions/checkout@v3
- uses: actions/setup-java@v2
  with:
    distribution: 'zulu'
    java-version: '11'
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '2.10.4'
- run: flutter pub get
- run: flutter test
- run: flutter build apk
- run: flutter build appbundle
```

Build for iOS (macOS only):

```yaml
jobs:
  build:
    runs-on: macos-latest
    steps:
    - uses: actions/checkout@v3
    - uses: subosito/flutter-action@v2
      with:
        flutter-version: '2.10.4'
        architecture: x64
    - run: flutter pub get
    - run: flutter test
    - run: flutter build ios --release --no-codesign
```

Build for the web:

```yaml
steps:
- uses: actions/checkout@v3
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '2.10.4'
- run: flutter pub get
- run: flutter test
- run: flutter build web
```

Build for Windows:

```yaml
jobs:
 build:
   runs-on: windows-latest
   steps:
     - uses: actions/checkout@v3
     - uses: subosito/flutter-action@v2
       with:
         channel: 'beta'
     - run: flutter config --enable-windows-desktop
     - run: flutter build windows
```

Build for Linux desktop:

```yaml
jobs:
 build:
   runs-on: ubuntu-latest
   steps:
     - uses: actions/checkout@v3
     - uses: subosito/flutter-action@v2
       with:
         channel: 'beta'
     - run: |
        sudo apt-get update -y
        sudo apt-get install -y ninja-build libgtk-3-dev
     - run: flutter config --enable-linux-desktop
     - run: flutter build linux
```

Build for macOS desktop:

```yaml
jobs:
 build:
   runs-on: macos-latest
   steps:
     - uses: actions/checkout@v3
     - uses: subosito/flutter-action@v2
       with:
         channel: 'beta'
         architecture: x64
     - run: flutter config --enable-macos-desktop
     - run: flutter build macos
```

Integration with `actions/cache`:

```yaml
steps:
- uses: actions/checkout@v3
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '2.10.x'
    channel: 'stable'
    cache: true
    cache-key: 'flutter-:os:-:arch:-:channel:-:version:-:hash:' # optional, change this to force refresh cache
    cache-path: ${{ runner.tool_cache }}/flutter # optional, change this to specify the cache path
    architecture: x64 # optional, x64 or arm64
- run: flutter --version
```
