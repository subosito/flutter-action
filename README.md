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
    flutter-version: '1.7.8+hotfix.4'
- run: flutter pub get
- run: flutter test
- run: flutter build apk
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
    flutter-version: '1.7.x' # you can use 1.7
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
          flutter-version: '1.7.8+hotfix.4'
          channel: 'beta'
      - run: flutter pub get
      - run: flutter test
      - run: flutter build apk
```

## Articles

- [Continuous Integration for Flutter with GitHub Actions](https://admcpr.com/continuous-integration-for-flutter-with-github-actions/)
- [CI/CD for Flutter Apps Using GitHub Actions](https://medium.com/better-programming/ci-cd-for-flutter-apps-using-github-actions-b833f8f7aac)
- [Guard your open-sourced Flutter app with GitHub Actions](https://medium.com/@jacksonz666/guard-your-open-sourced-flutter-app-with-github-actions-824cc4d9844)
- [Run Flutter Driver tests on GitHub Actions](https://medium.com/flutter-community/run-flutter-driver-tests-on-github-actions-13c639c7e4ab)
