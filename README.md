# flutter-action

This action sets up a flutter environment for use in actions. It works on Linux, Windows, and macOS.

# Usage

```yaml
steps:
- uses: actions/checkout@v2
- uses: actions/setup-java@v2
  with:
    distribution: 'zulu'
    java-version: '11'
- uses: subosito/flutter-action@v1
  with:
    flutter-version: '2.0.5'
- run: flutter pub get
- run: flutter test
```

Use latest release for particular channel:

```yaml
steps:
- uses: actions/checkout@v2
- uses: actions/setup-java@v2
  with:
    distribution: 'zulu'
    java-version: '11'
- uses: subosito/flutter-action@v1
  with:
    channel: 'stable' # or: 'beta', 'dev' or 'master'
- run: flutter pub get
- run: flutter test
- run: flutter build apk
```

Use latest release for particular version and/or channel:

```yaml
steps:
- uses: actions/checkout@v2
- uses: actions/setup-java@v2
  with:
    distribution: 'zulu'
    java-version: '11'
- uses: subosito/flutter-action@v1
  with:
    flutter-version: '1.22.x' # or, you can use 1.22
    channel: 'dev'
- run: flutter pub get
- run: flutter test
```

Use particular version on any channel:

```yaml
steps:
- uses: actions/checkout@v2
- uses: actions/setup-java@v2
  with:
    distribution: 'zulu'
    java-version: '11'
- uses: subosito/flutter-action@v1
  with:
    flutter-version: '2.x'
    channel: 'any'
- run: flutter pub get
- run: flutter test
```

Build Android APK and app bundle:

```yaml
steps:
- uses: actions/checkout@v2
- uses: actions/setup-java@v2
  with:
    distribution: 'zulu'
    java-version: '11'
- uses: subosito/flutter-action@v1
  with:
    flutter-version: '2.0.5'
- run: flutter pub get
- run: flutter test
- run: flutter build apk
- run: flutter build appbundle
```

Build for iOS too (macOS only):

```yaml
jobs:
  build:
    runs-on: macos-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-java@v2
      with:
        distribution: 'zulu'
        java-version: '11'
    - uses: subosito/flutter-action@v1
      with:
        flutter-version: '2.0.5'
    - run: flutter pub get
    - run: flutter test
    - run: flutter build apk
    - run: flutter build ios --release --no-codesign
```

Build for the web:

```yaml
steps:
- uses: actions/checkout@v2
- uses: subosito/flutter-action@v1
  with:
    flutter-version: '2.0.5'
- run: flutter pub get
- run: flutter test
- run: flutter build web
```

Build for Windows:

```yaml
  windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - uses: subosito/flutter-action@v1
        with:
          channel: beta
      - run: flutter config --enable-windows-desktop
      - run: flutter build windows
```

Matrix Testing:

```yaml
jobs:
  test:
    name: Test on ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-java@v2
        with:
          distribution: 'zulu'
          java-version: '11'
      - uses: subosito/flutter-action@v1
        with:
          flutter-version: '1.20.2'
          channel: 'beta'
      - run: dart --version
      - run: flutter --version
```
