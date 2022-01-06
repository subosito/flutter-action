# flutter-action

This action sets up a flutter environment for use in actions. It works on Linux, Windows, and macOS.

# Usage

Use specific version and channel:

```yaml
steps:
- uses: actions/checkout@v2
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '2.8.0'
    channel: 'stable'
- run: flutter --version
```

Use latest release for particular channel:

```yaml
steps:
- uses: actions/checkout@v2
- uses: subosito/flutter-action@v2
  with:
    channel: 'stable' # or: 'beta', 'dev' or 'master'
- run: flutter --version
```

Use latest release for particular version and/or channel:

```yaml
steps:
- uses: actions/checkout@v2
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '1.22.x' # or, you can use 1.22
    channel: 'dev'
- run: flutter --version
```

Use particular version on any channel:

```yaml
steps:
- uses: actions/checkout@v2
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '2.x'
    channel: 'any'
- run: flutter --version
```

Build Android APK and app bundle:

```yaml
steps:
- uses: actions/checkout@v2
- uses: actions/setup-java@v2
  with:
    distribution: 'zulu'
    java-version: '11'
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '2.5.3'
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
    - uses: actions/checkout@v2
    - uses: subosito/flutter-action@v2
      with:
        flutter-version: '2.5.3'
    - run: flutter pub get
    - run: flutter test
    - run: flutter build ios --release --no-codesign
```

Build for the web:

```yaml
steps:
- uses: actions/checkout@v2
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '2.5.3'
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
     - uses: actions/checkout@v2
     - uses: subosito/flutter-action@v2
       with:
         channel: beta
     - run: flutter config --enable-windows-desktop
     - run: flutter build windows
```

