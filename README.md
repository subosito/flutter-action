# flutter-action

Flutter environment for use in GitHub Actions. It works on Linux, Windows, and
macOS.

The following sections show how to configure this action.

## Flutter version

Use specific version and channel:

```yaml
steps:
  - name: Clone repository
    uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    with:
      channel: stable
      flutter-version: 3.19.0
  - run: flutter --version
```

Use latest release for particular channel:

```yaml
steps:
  - name: Clone repository
    uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    with:
      channel: stable # or: beta, master (or main)
  - run: flutter --version
```

Use latest release for particular version and/or channel:

```yaml
steps:
  - name: Clone repository
    uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    with:
      channel: dev
      flutter-version: 1.22.x
  - run: flutter --version
```

Use particular version on any channel:

```yaml
steps:
  - name: Clone repository
    uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    with:
      channel: any
      flutter-version: 3.x
  - run: flutter --version
```

Use particular git reference on master channel:

```yaml
steps:
  - name: Clone repository
    uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    with:
      channel: master
      flutter-version: 5b12b74 # tag, commit or branch
  - run: flutter --version
```

## Build Target

Build **Android** APK and app bundle:

```yaml
steps:
  - name: Clone repository
    uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    with:
      flutter-version: 3.19.0
  - run: flutter pub get
  - run: flutter test
  - run: flutter build apk
  - run: flutter build appbundle
```

Build for **iOS** (macOS runners only):

```yaml
jobs:
  main:
    runs-on: macos-latest
    steps:
      - name: Clone repository
        uses: actions/checkout@v4
      - name: Set up Flutter
        uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter pub get
      - run: flutter test
      - run: flutter build ios --release --no-codesign
```

Build for the **web**:

```yaml
steps:
  - name: Clone repository
    uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    with:
      channel: stable
  - run: flutter pub get
  - run: flutter test
  - run: flutter build web
```

Build for **Windows**:

```yaml
jobs:
  main:
    runs-on: windows-latest
    steps:
      - name: Clone repository
        uses: actions/checkout@v4
      - name: Set up Flutter
        uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter build windows
```

Build for **Linux** desktop:

```yaml
jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - name: Clone repository
        uses: actions/checkout@v4
      - name: Set up Flutter
        uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: |
          sudo apt-get update -y
          sudo apt-get install -y ninja-build libgtk-3-dev
      - run: flutter build linux
```

Build for **macOS** desktop:

```yaml
jobs:
  main:
    runs-on: macos-latest
    steps:
      - name: Clone repository
        uses: actions/checkout@v4
      - name: Set up Flutter
        uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter build macos
```

## Caching

Integration with [`actions/cache`](https://github.com/actions/cache):

```yaml
steps:
  - name: Clone repository
    uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    with:
      channel: stable
      cache: true
      # optional parameters follow
      cache-key: "flutter-:os:-:channel:-:version:-:arch:-:hash:" # optional, change this to force refresh cache
      cache-path: "${{ runner.tool_cache }}/flutter/:channel:-:version:-:arch:" # optional, change this to specify the cache path
      pub-cache-key: "flutter-pub:os:-:channel:-:version:-:arch:-:hash:" # optional, change this to force refresh cache of dart pub get dependencies
      pub-cache-path: "${{ runner.tool_cache }}/flutter/:channel:-:version:-:arch:" # optional, change this to specify the cache path
  - run: flutter --version
```

Note: `cache-key`, `pub-cache-key`, and `cache-path` have support for several
dynamic values:

- `:os:`
- `:channel:`
- `:version:`
- `:arch:`
- `:hash:`
- `:sha256:`

Use outputs from `flutter-action`:

```yaml
steps:
  - name: Clone repository
  - uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    id: flutter-action
    with:
      channel: stable
  - name: Print outputs
    shell: bash
    run: |
      echo CACHE-PATH=${{ steps.flutter-action.outputs.CACHE-PATH }}
      echo CACHE-KEY=${{ steps.flutter-action.outputs.CACHE-KEY }}
      echo CHANNEL=${{ steps.flutter-action.outputs.CHANNEL }}
      echo VERSION=${{ steps.flutter-action.outputs.VERSION }}
      echo ARCHITECTURE=${{ steps.flutter-action.outputs.ARCHITECTURE }}
      echo PUB-CACHE-PATH=${{ steps.flutter-action.outputs.PUB-CACHE-PATH }}
      echo PUB-CACHE-KEY=${{ steps.flutter-action.outputs.PUB-CACHE-KEY }}
```
