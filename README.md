# flutter-action

This action sets up a flutter environment for use in actions. It works on Linux, Windows, and macOS.

# Usage

```yaml
steps:
- uses: actions/checkout@v1
- uses: actions/setup-java@v1
  with:
    java-version: '12.x'
- uses: subosito/flutter-action@v1
  with:
    flutter-version: '1.9.1+hotfix.6'
- run: flutter pub get
- run: flutter test
- run: flutter build apk
```

Build for iOS too (macOS only):

```yaml
jobs:
  build:
    runs-on: macos-latest
    steps:
    - uses: actions/checkout@v1
    - uses: actions/setup-java@v1
      with:
        java-version: '12.x'
    - uses: subosito/flutter-action@v1
      with:
        flutter-version: '1.9.1+hotfix.6'
    - run: flutter pub get
    - run: flutter test
    - run: flutter build apk
    - run: flutter build ios --release --no-codesign
```

Use app bundle, instead of APK:

```yaml
steps:
- uses: actions/checkout@v1
- uses: actions/setup-java@v1
  with:
    java-version: '12.x'
- uses: subosito/flutter-action@v1
  with:
    flutter-version: '1.9.1+hotfix.6'
- run: flutter pub get
- run: flutter test
- run: flutter build appbundle
```

Build for the web:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v1
    - uses: subosito/flutter-action@v1
      with:
        channel: beta
    - run: flutter config --enable-web
    - run: flutter pub get
    - run: flutter test
    - run: flutter build web
```

Use latest release for particular channel:

```yaml
steps:
- uses: actions/checkout@v1
- uses: actions/setup-java@v1
  with:
    java-version: '12.x'
- uses: subosito/flutter-action@v1
  with:
    channel: 'stable' # or: 'dev' or 'beta'
- run: flutter pub get
- run: flutter test
- run: flutter build apk
```

Use latest release for particular version and/or channel:

```yaml
steps:
- uses: actions/checkout@v1
- uses: actions/setup-java@v1
  with:
    java-version: '12.x'
- uses: subosito/flutter-action@v1
  with:
    flutter-version: '1.12.x' # you can use 1.12
    channel: 'dev' # optional, default to: 'stable'
- run: flutter pub get
- run: flutter test
- run: flutter build apk
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
      - uses: actions/checkout@v1
      - uses: actions/setup-java@v1
        with:
          java-version: '12.x'
      - uses: subosito/flutter-action@v1
        with:
          flutter-version: '1.11.0'
          channel: 'beta'
      - run: dart --version
      - run: flutter --version
      - run: flutter pub get
      - run: flutter test
      - run: flutter build apk
```

