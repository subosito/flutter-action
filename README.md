# flutter-action

This action sets up a flutter environment for use in actions.

# Usage

```yaml
steps:
- uses: actions/checkout@latest
- uses: actions/setup-java@v1
  with:
    version: '8.x'
- uses: subosito/flutter-action@master
  with:
    version: '1.7.8+hotfix.4'
- run: flutter build apk
```
