# Nixpkgs's Advanced Usage

Существует достаточно много программ, на поведение которых можно влиять во время сборки, но желаемое поведение для разных пользователей может сильно отличаться.
Nix решает эту проблему, позволяя влиять на сборку пакетов, используя `callPackage`, оверрайды и оверлеи.

Вот несколько случаев, когда [автору] это пригодилось:

1. [`fcitx5-rime.nix`](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix): Из коробки `fcitx5-rime` использует `rime-data` для `rimeDataPkgs`, это можно изменить, написав `override`.
2. [`vscode/with-extensions.nix`](https://github.com/NixOS/nixpkgs/blob/master/pkgs/applications/editors/vscode/with-extensions.nix): позволяет декларативно конфигурировать расширения путем изменения `vscodeExtensions`.
   - [`nix-vscode-extensions`](https://github.com/nix-community/nix-vscode-extensions): Менеджер плагинов для vscode, использующий оверрайды `vscodeExtensions` под капотом.
3. [`firefox/common.nix`](https://github.com/NixOS/nixpkgs/blob/416ffcd08f1f16211130cd9571f74322e98ecef6/pkgs/applications/networking/browsers/firefox/common.nix): Firefox имеет кучу кастомизируемых параметров.
4. ...
