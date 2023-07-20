# Оверрайды

Nix позволяет ползователю вносить изменения в процесс сборки пакетов с помощью функции `override`, выдающей на выходе новый derivation.

Так, например, можно добавить пакет `rime-data-flypy` в `rimeDataPkgs` пакета  `fcitx5-rime`. На выходе получаем derivation, в котором `rimeDataPkgs` изменен, в то время как остальные параметры - нет:


```nix
pkgs.fcitx5-rime.override { rimeDataPkgs = [ ./rime-data-flypy ]; }
```

Есть несколько способов определить, какие параметры конкретных пакетов можно оверрайдить:

1. Посмотреть Nix expression пакета в репозитории Nixpkgs на гитхабе: [`fcitx5-rime.nix`](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix). Главное не забыть выбрать корректную ветку (например, `nixos-unstable`).
2. Ввести в терминале `nix repl '<nixpkgs>'` и ввести там `:e pkgs.fcitx5-rime`. После этого исходники пакета откроются в дефолтном текстовом редакторе. Кстати, у репла есть свой мануал, он откроется при вводе `:?`.

Для примера глянем исходники `pkgs.hello`:

```nix
# https://github.com/NixOS/nixpkgs/blob/nixos-unstable/pkgs/applications/misc/hello/default.nix
{ callPackage
, lib
, stdenv
, fetchurl
, nixos
, testers
, hello
}:

stdenv.mkDerivation (finalAttrs: {
  pname = "hello";
  version = "2.12.1";

  src = fetchurl {
    url = "mirror://gnu/hello/hello-${finalAttrs.version}.tar.gz";
    sha256 = "sha256-jZkUKv2SV28wsM18tCqNxoCZmLxdYH2Idh9RLibH2yA=";
  };

  doCheck = true;

  # ...
})
```

Видим аттрибуты `pname`, `version`, `src` и `doCheck`, которые можно переписать, используя `overrideAttrs`. Вот так можно изменить `doCheck` (пропускает фазу тестирования при сборке):

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  doCheck = false;
});
```

Так же можно менять ряд дефолтных аттрибутов, определенных в `stdenv.mkDerivation` (а не экспрешне пакета). Для примера возьмем `separateDebugInfo`:

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  separateDebugInfo = true;
});
```
Список таких аттрибутов можно посмотреть, введя `:e stdenv.mkDerivation` в `nix repl '<nixpkgs>'`.
