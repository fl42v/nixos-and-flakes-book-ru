# Оверлеи

В отличие от рассмотренных в предыдущей главе оверрайдов, создающих новый локальный derivation, оверлеи позволяют изменить `pkgs`, меняя один derivation на другой.

В классическом Nix оверлеи можно задать в `~/.config/nixpkgs/overlays.nix` или `~/.config/nixpkgs/overlays/*.nix`, однако во флейках такой подход неприменим, поскольку они не могут полагаться на конфиги, лежащие вне гит-репозиториев. Вместо этого Home Manager и NixOS предоставляют опцию `nixpkgs.overlays`:

- [Документация Home Manager - `nixpkgs.overlays`](https://nix-community.github.io/home-manager/options.html#opt-nixpkgs.overlays)
- [Исходники Nixpkgs - `nixpkgs.overlays`](https://github.com/NixOS/nixpkgs/blob/30d7dd7e7f2cba9c105a6906ae2c9ed419e02f17/nixos/modules/misc/nixpkgs.nix#L169)

Так фичи используются на примере модуля, который можно подгрузить в NixOS или Home Manager (т.к. названия функций/опций те же, работать будет и там, и там):

```nix
{ config, pkgs, lib, ... }:

{
  nixpkgs.overlays = [
    # Overlay 1: используем `self` и `super`, косим под наследование
    (self: super: {
      google-chrome = super.google-chrome.override {
        commandLineArgs =
          "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
      };
    })

    # Overlay 2: Используем `final` и `prev` для обозначения "нового" (измененного) и старого derivation-ов
    (final: prev: {
      steam = prev.steam.override {
        extraPkgs = pkgs: with pkgs; [
          keyutils
          libkrb5
          libpng
          libpulseaudio
          libvorbis
          stdenv.cc.cc.lib
          xorg.libXcursor
          xorg.libXi
          xorg.libXinerama
          xorg.libXScrnSaver
        ];
        extraProfile = "export GDK_SCALE=2";
      };
    })

    # Overlay 3: спрятался в файл.
    # Содержимое файла выглядит как первый или второй пример:
    # `(final: prev: { xxx = prev.xxx.override { ... }; })`
    (import ./overlays/overlay3.nix)
  ];
}
```

Первый оверлей меняет `google-chrome`, добавляя параметр командной строки, задающий прокси-сервер. Второй - добавляет к derivation-у стима ряд доплнительных зависимостей и экспортирует переменную окнужения. Третий оверлей лежит в отдельном файле.

По аналогии несложно писать кастомные оверлеи.

## Modular overlays

В предыдущем примере все оверлеи лежали в одном файле (или импортировались руками), неудобство такого подхода растет пропорционально количеству оверлеев. Вместо этого можно класть каждый оверлей в отдельный файл и импортировать их автоматичеси.

Для начала создаем директорию `overlays` там же, где лежит основной конфиг. Туда кладем `default.nix` с таким содержимым:

```nix
# Импортируем все .nix-файлы в текущей директории, выполняем, передавая на вход args
# На выходе имеем список (list) результатов их выполнения, т.е. оверлеев

args:
builtins.map
  (f: (import (./. + "/${f}") args))  # импортируем и выполняем файлы с оверлеями
  (builtins.filter          # ищем все файлы с оверлеями в текущей директории
    (f: f != "default.nix") # пропускаем сам `default.nix` во избежание бесконечной рекурсии
    (builtins.attrNames (builtins.readDir ./.)))
```

`default.nix` импортирует и выполняет все `.nix`-файлы, лежащие в директории с ним (кроме самого `default.nix`) с переданными ему на вход аргументами и возвращает список оверлеев.

Теперь в директорию `overlays` можно закидывать файлы с оверлеями, обернув их в лямбду, что принимает нужные парметры. Для примера сделаем `overlays/fcitx5/default.nix` с таким содержимым:

```nix
{ pkgs, config, lib, ... }:

(self: super: {
  rime-data = ./rime-data-flypy;  # Кладем кастомный пакет в rime-data
  fcitx5-rime = super.fcitx5-rime.override { rimeDataPkgs = [ ./rime-data-flypy ]; };
})
```

Пример выше оверрайдит пакет `rime-data` на лежащу в директории с оверлеем кастомную версию и меняет `rimeDataPkgs` у `fcitx5-rime` на ранее положенный в `rime-data` пакет.

Чтобы подгрузить овелеи, возвращаемые написанным `overlays/default.nix`, добавляем следующее в любой NixOS-модуль:

```nix
{ config, pkgs, lib, ... } @ args:

{
  # ...

  nixpkgs.overlays = import /путь/до/директории/с/оверлеями;

  # ...
}
```

Например, это можно сделать сразу в `flake.nix`:

```nix
{
  description = "NixOS configuration of Ryan Yin";

  # ...

  inputs = {
    # ...
  };

  outputs = inputs@{ self, nixpkgs, ... }:
    {
      nixosConfigurations = {
        nixos-test = nixpkgs.lib.nixosSystem {
          system = "x86_64-linux";
          specialArgs = inputs;
          modules = [
            ./hosts/nixos-test

            # описываем inline-модуль;
            #  то, что приходит на вход модулю, передается оверлеям
            (args: { nixpkgs.overlays = import ./overlays args; })

            # ...
          ];
        };
      };
    };
}
```

Такой подход позволяет упорядочить оверлеи, а так же сильно упрощает добавление новых и удаление более не нужных оверлеев. В данном примере директория `overlays` выглядит слеюующим образом:

```txt
.
├── flake.lock
├── flake.nix
├── home
├── hosts
├── modules
├── ...
├── overlays
│   ├── default.nix            # автоматически подтягивает оверлеи
│   └── fcitx5                 # оверлей с fcitx5
│       ├── default.nix
│       ├── README.md
│       └── rime-data-flypy    # кастомный rime-data
│           └── share
│               └── rime-data
│                   ├── ...
└── README.md
```
