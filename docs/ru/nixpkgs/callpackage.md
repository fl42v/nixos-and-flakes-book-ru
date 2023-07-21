# `pkgs.callPackage`

Ранее мы использовали `import xxx.nix` для импорта файлов. Эта функция просто возвращает результат выполнения файла без дальнейшей обработки.

Другой способ добиться того же результата - использовать `pkgs.callPackage xxx.nix { ... }`. В отличие от `import`, файл, импортируемый с помощью `pkgs.callPackage` должен представлять derivation или содержать функцию, которая его возвращает, результатом вызова так же является derivation. Ряд перечисленных ранее модулей, которые можно импортировать с помощью `callPackage` - `hello.nix`, `fcitx5-rime.nix`, `vscode/with-extensions.nix` и `firefox/common.nix`.

Если `xxx.nix`, вызываемый через `pkgs.callPackage xxx.nix {...}` является лямбдой (что характерно для большинства пакетов), при выполнении происходит следующее:

1. `pkgs.callPackage xxx.nix {...}` импортирует `xxx.nix`, чтобы получить доступ к лежащей там функции. Чаще всего там можно найти `lib`, `stdenv`, `fetchurl` и, время от времени, кастомные параметры с дефолтными значениями;

2. Далее `pkgs.callPackage` ищет нужные параметры (`lib`, `stdenv` и `fetchurl` лежат в nixpkgs и будут найдены на этом шаге);

3. После этого `pkgs.callPackage` объединяет прилетевший ей на вход параметр `{...}` c аттрсетом, полученном на предыдущем шаге, и передает его в качестве параметра для функции из `xxx.nix`;

4. Функция выполняется, получаем derivation.

Чаще всего `pkgs.callPackage` применяют для импорта модифицированных пакетов и их использования в модулях.

Скажем, мы хотим подгрузить в NixOS кастомное ядро linux, сконфигурированное в `kernel.nix`, который принимает на вход имя SBC и исходники ярра:

```nix
{
  lib,
  stdenv,
  linuxManualConfig,

  src,
  boardName,
  ...
}:
(linuxManualConfig {
  version = "5.10.113-thead-1520";
  modDirVersion = "5.10.113";

  inherit src lib stdenv;

  # Путь до конфига ядра (`.config`, полученный после выполнения make menuconfig)
  #
  # превращаем строку в путь
  configfile = ./. + "${boardName}_config";

  allowImportFromDerivation = true;
})
```

Теперь в любом понравившемся модуле флейка можно использовать `pkgs.callPackage ./kernel.nix {}`:

```nix
{ lib, pkgs, pkgsKernel, kernel-src, ... }:

{
  # ......

  boot = {
    # ......
    kernelPackages = pkgs.linuxPackagesFor (pkgs.callPackage ./pkgs/kernel {
        src = kernel-src;  # исходники ядра переданы в модуль через `specialArgs`.
        boardName = "licheepi4a";  # название одноплатника, использующееся для генерации пути до конфига ядра
    });

  # ......
}
```

<!--In the example above, we use `pkgs.callPackage` to pass different `src` and `boardName` parameters to the function defined in `kernel.nix`. This allows us to generate different kernel packages. By changing the parameters passed to `pkgs.callPackage`, `kernel.nix` can adapt to different kernel sources and development boards.-->

## Литература

- [Chapter 13. Callpackage Design Pattern - Nix Pills](https://nixos.org/guides/nix-pills/callpackage-design-pattern.html)
