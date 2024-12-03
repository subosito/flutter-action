# flutter-action

Flutter environment for use in GitHub Actions. It works on Linux, Windows, and
macOS.

Originally created by [Alif Rachmawadi]. Maintained by [Bartek Pacia].

The following sections show how to configure this action.

## Specifying Flutter version

### Use specific version and channel

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

### Use version from pubspec.yaml

This is inspired by [`actions/setup-go`](https://github.com/actions/setup-go).

```yaml
steps:
  - name: Clone repository
    uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    with:
      channel: stable
      flutter-version-file: pubspec.yaml # path to pubspec.yaml
  - run: flutter --version
```

> [!IMPORTANT]
>
> For `flutter-version-file` to work, you need to have the exact Flutter version
> defined in your pubspec.yaml:
>
> **Good**
>
> ```yaml
> environment:
>   sdk: ">=3.3.0 <4.0.0"
>   flutter: 3.19.0
> ```
>
> **Bad**
>
> ```yaml
> environment:
>   sdk: ">=3.3.0 <4.0.0"
>   flutter: ">= 3.19.0 <4.0.0"
> ```

> [!NOTE]
>
> Using `flutter-version-file` requires [`yq`](https://github.com/mikefarah/yq),
> which is not pre-installed in `windows` runners. Fortunately, since version
> 2.18.0, this action installs `yq` automatically, so no action is required from
> you.

### Use latest release for particular channel

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

### Use latest release for particular version and/or channel

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

### Use particular version on any channel

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

### Use particular git reference on master channel

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

### Use alternative Flutter repository

This action supports "alternative Flutters" in addition to the official
[`flutter/flutter`](https://github.com/flutter/flutter), for example:
- [Flock](https://github.com/Flutter-Foundation/flutter.git)
- [a Flutter fork that supports
  HarmonyOS](https://gitee.com/harmonycommando_flutter/flutter.git)

```yaml
steps:
  - name: Clone repository
    uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    with:
      channel: master
      flutter-version: 3.24.0
      git-source: https://github.com/Flutter-Foundation/flutter.git
  - run: flutter --version
```

> [!NOTE]
>
> This feature was implemented in
> [#344](https://github.com/subosito/flutter-action/pull/334) and is available
> since v2.18.0.

### Apply a patch

Sometimes you find a bug in Flutter and you fix it yourself (you're a
rockstar!), and then submit a patch/PR to Flutter repository. However, everyone
knows that code review takes time, but your app needs the fix _now_.

You can apply your patch like this:

```yaml
steps:
- name: Clone repository
  uses: actions/checkout@v4
- uses: subosito/flutter-action@v2
  with:
    flutter-version: 3.22.2
    channel: stable
- run: |
    flutter --version
    cd ${{ env.FLUTTER_ROOT }}
    curl https://patch-diff.githubusercontent.com/raw/flutter/flutter/pull/137874.patch | git apply
    git status
```

> [!NOTE]
>
> This was first discussed in [this issue](https://github.com/subosito/flutter-action/issues/310).

## Build targets

Build **Android** APK and app bundle:

```yaml
steps:
  - name: Clone repository
    uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    with:
      flutter-version: 3.24.0
  - run: flutter pub get
  - run: flutter test
  - run: flutter build apk
  - run: flutter build appbundle
```

### Build for iOS

> [!NOTE]
>
> Building for iOS requires a macOS runner.

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

### Build for the web

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

### Build for Windows

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

### Build for Linux desktop

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

### Build for macOS desktop

> [!NOTE]
>
> Building for macOS requires a macOS runner.

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

If you don't need to install Flutter and just want the outputs, you can use the
`dry-run` option:

```yaml
steps:
  - name: Clone repository
  - uses: actions/checkout@v4
  - name: Set up Flutter
    uses: subosito/flutter-action@v2
    id: flutter-action
    with:
      channel: stable
      dry-run: true
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
[Alif Rachmawadi]: https://github.com/subosito
[Bartek Pacia]: https://github.com/bartekpacia
