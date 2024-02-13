# flutter-action

Flutter environment for use in GitHub Actions. It works on Linux, Windows, and macOS.

## Usage

Use specific version and channel:

```yaml
steps:
- uses: actions/checkout@v4
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '3.16.9'
    channel: 'stable'
- run: flutter --version
```

Use latest release for particular channel:

```yaml
steps:
- uses: actions/checkout@v4
- uses: subosito/flutter-action@v2
  with:
    channel: 'stable' # or: 'beta', 'dev', 'master' (or 'main')
- run: flutter --version
```

Use latest release for particular version and/or channel:

```yaml
steps:
- uses: actions/checkout@v4
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '1.22.x'
    channel: 'dev'
- run: flutter --version
```

Use particular version on any channel:

```yaml
steps:
- uses: actions/checkout@v4
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '3.x'
    channel: 'any'
- run: flutter --version
```

Use particular git reference on master channel:

```yaml
steps:
- uses: actions/checkout@v4
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '5b12b74' # tag, commit or branch
    channel: 'master'
- run: flutter --version
```

Build Android APK and app bundle:

```yaml
steps:
- uses: actions/checkout@v4
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '3.16.9'
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
    - uses: actions/checkout@v4
    - uses: subosito/flutter-action@v2
      with:
        channel: 'stable'
    - run: flutter pub get
    - run: flutter test
    - run: flutter build ios --release --no-codesign
```

Build for the web:

```yaml
steps:
- uses: actions/checkout@v4
- uses: subosito/flutter-action@v2
  with:
    channel: 'stable'
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
     - uses: actions/checkout@v4
     - uses: subosito/flutter-action@v2
       with:
         channel: 'stable'
     - run: flutter build windows
```

Build for Linux desktop:

```yaml
jobs:
 build:
   runs-on: ubuntu-latest
   steps:
     - uses: actions/checkout@v4
     - uses: subosito/flutter-action@v2
       with:
         channel: 'stable'
     - run: |
        sudo apt-get update -y
        sudo apt-get install -y ninja-build libgtk-3-dev
     - run: flutter build linux
```

Build for macOS desktop:

```yaml
jobs:
 build:
   runs-on: macos-latest
   steps:
     - uses: actions/checkout@v4
     - uses: subosito/flutter-action@v2
       with:
         channel: 'stable'
     - run: flutter build macos
```

Integration with `actions/cache`:

```yaml
steps:
- uses: actions/checkout@v4
- uses: subosito/flutter-action@v2
  with:
    channel: 'stable'
    cache: true
    cache-key: 'flutter-:os:-:channel:-:version:-:arch:-:hash:' # optional, change this to force refresh cache
    cache-path: '${{ runner.tool_cache }}/flutter/:channel:-:version:-:arch:' # optional, change this to specify the cache path
    pub-cache-key: 'flutter-pub:os:-:channel:-:version:-:arch:-:hash:' # optional, change this to force refresh cache of dart pub get dependencies
    pub-cache-path: '${{ runner.tool_cache }}/flutter/:channel:-:version:-:arch:' # optional, change this to specify the cache path
- run: flutter --version
```

Note: `cache-key`, `pub-cache-key`, and `cache-path` has support for several dynamic values:

- `:os:`
- `:channel:`
- `:version:`
- `:arch:`
- `:hash:`
- `:sha256:`

Use outputs from `flutter-action`:

```yaml
steps:
- uses: actions/checkout@v4
- id: flutter-action
  uses: subosito/flutter-action@v2
  with:
    channel: 'stable'
- run: |
    echo CACHE-PATH=${{ steps.flutter-action.outputs.CACHE-PATH }}
    echo CACHE-KEY=${{ steps.flutter-action.outputs.CACHE-KEY }}
    echo CHANNEL=${{ steps.flutter-action.outputs.CHANNEL }}
    echo VERSION=${{ steps.flutter-action.outputs.VERSION }}
    echo ARCHITECTURE=${{ steps.flutter-action.outputs.ARCHITECTURE }}
    echo PUB-CACHE-PATH=${{ steps.flutter-action.outputs.PUB-CACHE-PATH }}
    echo PUB-CACHE-KEY=${{ steps.flutter-action.outputs.PUB-CACHE-KEY }}
  shell: bash
```
