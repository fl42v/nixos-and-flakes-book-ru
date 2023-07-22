# Development Environments on NixOS

Возможность NixOS гарантировать одинаковые результаты сборки делает ее идеальной для разработки ПО, однако стоит учитывать ряд отличий от более традиционных дистрибутивов.

На NixOS глобально/системно рекомендуется ставить тулзы "общего назначения", вроде `git`, `vim`, `emacs`, `tmux` или `zsh`, в то время как софт, нужный для разработки конктетных проектов на конкретных ЯП должен жить в соответствующих development environment-ах, изолированных от основной системы и друг от друга.

В следующих частях статьи будут описана работа с development environment-ами под NixOS.

## Создаем Development Environment

Development environment создается с помощью `pkgs.mkShell { ... }`, после чего можно открыть изолированный для проекта bash через `nix develop`.

Посмотрим на [сырцы](https://github.com/NixOS/nixpkgs/blob/master/pkgs/build-support/mkshell/default.nix) `pkgs.mkShell`, чтобы разобраться в его работе:

```nix
{ lib, stdenv, buildEnv }:

# особый derivation, работающий только с nix-shell.
{ name ? "nix-shell"
, # список пакетов, нужных для конкретного проекта
  packages ? [ ]
, # propagate all the inputs from the given derivations
  inputsFrom ? [ ]
, buildInputs ? [ ]
, nativeBuildInputs ? [ ]
, propagatedBuildInputs ? [ ]
, propagatedNativeBuildInputs ? [ ]
, ...
}@attrs:
let
  mergeInputs = name:
    (attrs.${name} or [ ]) ++
    (lib.subtractLists inputsFrom (lib.flatten (lib.catAttrs name inputsFrom)));

  rest = builtins.removeAttrs attrs [
    "name"
    "packages"
    "inputsFrom"
    "buildInputs"
    "nativeBuildInputs"
    "propagatedBuildInputs"
    "propagatedNativeBuildInputs"
    "shellHook"
  ];
in

stdenv.mkDerivation ({
  inherit name;

  buildInputs = mergeInputs "buildInputs";
  nativeBuildInputs = packages ++ (mergeInputs "nativeBuildInputs");
  propagatedBuildInputs = mergeInputs "propagatedBuildInputs";
  propagatedNativeBuildInputs = mergeInputs "propagatedNativeBuildInputs";

  shellHook = lib.concatStringsSep "\n" (lib.catAttrs "shellHook"
    (lib.reverseList inputsFrom ++ [ attrs ]));

  phases = [ "buildPhase" ];

  # ......

  # если включена распределенная сборка (на нескольких машинах), предпочитаем билдить локально
  preferLocalBuild = true;
} // rest)
```

`pkgs.mkShell { ... }` - особый тип derivation. `name`, `buildInputs` и т.д. - изменяемые пользователем параметры, а в `shellHook` пишется то, что будет запущено при входе в окружение через `nix develop`.

Небольшой `flake.nix`, в котором описан development environment с Node.js 18:

```nix
{
  description = "Development environment под Node.js на флейках";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # system должен соответствовать архитектуре исопльзуемой машины
    # system = "x86_64-darwin";
    system = "x86_64-linux";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs {
        inherit system;
        overlays = [
          (self: super: rec {
            nodejs = super.nodejs-18_x;
            pnpm = super.nodePackages.pnpm;
            yarn = (super.yarn.override { inherit nodejs; });
          })
        ];
      };
    in pkgs.mkShell {
      # создаем environment c nodejs-18_x, pnpm и yarn
      packages = with pkgs; [
        node2nix
        nodejs
        pnpm
        yarn
      ];

      shellHook = ''
        echo "node `${pkgs.nodejs}/bin/node --version`"
      '';
    };
  };
}
```

Кладем `flake.nix` в новую директорию, запускаем `nix develop` (так же сработает `nix develop .#default`, см 13 строку примера), оказываемся в development environment с nodejs 18 и пакетниками `npm`, `pnpm`, `yarn`. Также благодаря команде в `shellHook` выводится инфа о версии nodejs.


## Используем zsh/fish/... вместо bash

По дефолту `pkgs.mkShell` открывает `bash`, однако это недоразумение можно исправить, закинув `exec <твой-шелл>` в `shellHook`:

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # system должен соответствовать архитектуре исопльзуемой машины
    # system = "x86_64-darwin";
    system = "x86_64-linux";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs {
        inherit system;
        overlays = [
          (self: super: rec {
            nodejs = super.nodejs-18_x;
            pnpm = super.nodePackages.pnpm;
            yarn = (super.yarn.override { inherit nodejs; });
          })
        ];
      };
    in pkgs.mkShell {
      # создаем environment c nodejs-18_x, pnpm и yarn
      packages = with pkgs; [
        node2nix
        nodejs
        pnpm
        yarn
        nushell # также хотим нюшелл
      ];

      shellHook = ''
        echo "node `${pkgs.nodejs}/bin/node --version`"
        exec nu # запускаем нюшелл
      '';
    };
  };
}
```

Вуаля, при запуске `nix develop` попадаем в REPL nushell.


## Заходим в сборочный environment любого Nix-пакета 

А теперь можно взглянуть на описание `nix develop`, `nix develop --help`:

```
Name
    nix develop - запускает bash с окрежением сборки derivation-а

Synopsis
    nix develop [option...] installable
# ......
```

`installable` тут означает, что `nix develop` может зайти не только в результат `pkgs.mkShell`, но в окружение для сборки любого пакета, который можно установить.

По дефолту `nix develop` ищет что-то из следующих атрибутов в `outputs` флейка (лежащего в текущей директории):

> примечание: `system` = архитектура текущей системы, например `x86_64-linux`

- `devShells.<system>.default`
- `packages.<system>.default`

Если указать путь к флейку и имя аутпута через `nix develop /path/to/flake#<имя>`, список станет таким:

- `devShells.<system>.<имя>`
- `packages.<system>.<имя>`
- `legacyPackages.<system>.<имя>`

Проверяем. Сейчас у нас нет доступа к `c++`/`g++`:

```shell
ryan in 🌐 aquamarine in ~
› c++
c++: command not found

ryan in 🌐 aquamarine in ~
› g++
g++: command not found
```

Теперь с помощью `nix develop` сходим в сборочный цех проги `hello` из `nixpkgs`:

```shell
# login to the build environment of the package `hello`
ryan in 🌐 aquamarine in ~
› nix develop nixpkgs#hello

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› env | grep CXX
CXX=g++

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› c++ --version
g++ (GCC) 12.3.0
Copyright (C) 2022 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› g++ --version
g++ (GCC) 12.3.0
Copyright (C) 2022 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

Видим установленную переменную окружения `CXX` и наличие `c++` и `g++`.

Плюсом можно пройтись по разным стадиям сборки `hello`:

> Пакеты в Nix проходят следующие старии сборки (в этом порядке): `$prePhases unpackPhase patchPhase $preConfigurePhases configurePhase $preBuildPhases buildPhase checkPhase $preInstallPhases installPhase fixupPhase installCheckPhase $preDistPhases distPhase $postPhases`

```shell
# распаковываем исходники проги
ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› unpackPhase
unpacking source archive /nix/store/pa10z4ngm0g83kx9mssrqzz30s84vq7k-hello-2.12.1.tar.gz
source root is hello-2.12.1
setting SOURCE_DATE_EPOCH to timestamp 1653865426 of file hello-2.12.1/ChangeLog

ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› ls
hello-2.12.1

ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› cd hello-2.12.1/

# генерируем Makefile
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via ❄️  impure (hello-2.12.1-env)
› configurePhase
configure flags: --prefix=/tmp/xxx/outputs/out --prefix=/tmp/xxx/outputs/out
checking for a BSD-compatible install... /nix/store/02dr9ymdqpkb75vf0v1z2l91z2q3izy9-coreutils-9.3/bin/install -c
checking whether build environment is sane... yes
checking for a thread-safe mkdir -p... /nix/store/02dr9ymdqpkb75vf0v1z2l91z2q3izy9-coreutils-9.3/bin/mkdir -p
checking for gawk... gawk
checking whether make sets $(MAKE)... yes
checking whether make supports nested variables... yes
checking for gcc... gcc
# ......
checking that generated files are newer than configure... done
configure: creating ./config.status
config.status: creating Makefile
config.status: creating po/Makefile.in
config.status: creating config.h
config.status: config.h is unchanged
config.status: executing depfiles commands
config.status: executing po-directories commands
config.status: creating po/POTFILES
config.status: creating po/Makefile

# собираем
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via C v12.3.0-gcc via ❄️  impure (hello-2.12.1-env) took 2s
› buildPhase
build flags: SHELL=/run/current-system/sw/bin/bash
make  all-recursive
make[1]: Entering directory '/tmp/xxx/hello-2.12.1'
# ......
ranlib lib/libhello.a
gcc  -g -O2   -o hello src/hello.o  ./lib/libhello.a
make[2]: Leaving directory '/tmp/xxx/hello-2.12.1'
make[1]: Leaving directory '/tmp/xxx/hello-2.12.1'

# запускаем собранную программу
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via C v12.3.0-gcc via ❄️  impure (hello-2.12.1-env)
› ./hello
Hello, world!
```

Таким образом можно, например, дебажить сборку пакетов или вносить какие-нибудь изменения в процесс.

## `nix build`

`nix build` собирает пакет и делает симлинк `result` из `/nix/store/куда-там-собрался-пакет` в текущую директорию:

```bash
# собираем 'ponysay' из 'nixpkgs'
nix build "nixpkgs#ponysay"
# пользуем собранный 'ponysay'
› ./result/bin/ponysay 'hey buddy!'
 ____________ 
< hey buddy! >
 ------------ 
     \                                  
      \                                 
       \                                
       ▄▄  ▄▄ ▄ ▄                       
    ▀▄▄▄█▄▄▄▄▄█▄▄▄                      
   ▀▄███▄▄██▄██▄▄██                     
  ▄██▄███▄▄██▄▄▄█▄██                    
 █▄█▄██▄█████████▄██                    
  ▄▄█▄█▄▄▄▄▄████████                    
 ▀▀▀▄█▄█▄█▄▄▄▄▄█████         ▄   ▄      
    ▀▄████▄▄▄█▄█▄▄██       ▄▄▄▄▄█▄▄▄    
    █▄██▄▄▄▄███▄▄▄██    ▄▄▄▄▄▄▄▄▄█▄▄    
    ▀▄▄██████▄▄▄████    █████████████   
       ▀▀▀▀▀█████▄▄ ▄▄▄▄▄▄▄▄▄▄██▄█▄▄▀   
            ██▄███▄▄▄▄█▄▄▀  ███▄█▄▄▄█▀  
            █▄██▄▄▄▄▄████   ███████▄██  
            █▄███▄▄█████    ▀███▄█████▄ 
            ██████▀▄▄▄█▄█    █▄██▄▄█▄█▄ 
           ███████ ███████   ▀████▄████ 
           ▀▀█▄▄▄▀ ▀▀█▄▄▄▀     ▀██▄▄██▀█
                                ▀  ▀▀█  
```

## Другие команды

О других командах nix, вроде `nix flake init`, можно подробнее узнать из [New Nix Commands][New Nix Commands] или соответствующей документации.

## Ссылки

- [pkgs.mkShell - nixpkgs manual](https://nixos.org/manual/nixpkgs/stable/#sec-pkgs-mkShell)
- [A minimal nix-shell](https://fzakaria.com/2021/08/02/a-minimal-nix-shell.html)
- [One too many shell, Clearing up with nix' shells nix shell and nix-shell - Yannik Sander](https://blog.ysndr.de/posts/guides/2021-12-01-nix-shells/)

[New Nix Commands]: https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html

