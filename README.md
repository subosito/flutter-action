# flutter-action

This action sets up a flutter environment for use in actions. It works on Linux, Windows, and macOS.

# Usage

```yaml
steps:
- uses: actions/checkout@master
- uses: actions/setup-java@v1
  with:
    java-version: '12.x'
- uses: subosito/flutter-action@v1.0.1
  with:
    version: '1.7.8+hotfix.4'
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
      - uses: actions/checkout@master
      - uses: actions/setup-java@v1
        with:
          java-version: '12.x'
      - uses: subosito/flutter-action@v1.0.1
        with:
          version: '1.7.8+hotfix.4'
      - run: flutter pub get
      - run: flutter test
      - run: flutter build apk
```

