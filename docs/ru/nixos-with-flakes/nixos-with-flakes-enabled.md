# Enabling NixOS with Flakes

## Включаем флейки

Поскольку фича все еще эксперименальная, включать ее надо руками. Для этого меняем `/etc/nixos/configuration.nix` примерно следующим образом:

```nix{15,18-19}
{ config, pkgs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  # ... бла-бла-бла ...

  # Включаем никсокоманды и флейки
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  environment.systemPackages = with pkgs; [
    # Флейкам нужен гит, так что его стоит поставить заранее
    git
    vim
    wget
    curl
  ];

  # ... бла-бла-бла ...
}
```

Запускаем `sudo nixos-rebuild switch`, и можно начинать писать новый конфиг.

## Switching to `flake.nix` for System Configuration

После включения флейков `sudo nixos-rebuild switch` будет сначала искать `/etc/nixos/flake.nix` и лишь потом - `/etc/nixos/configuration.nix`.

Для начала можно посмотреть, какие шаблоны флейков предлагает сам Nix:

```bash
nix flake show templates
```

Из перечисленных, шаблон `templates#full` содержит примеры, покрывающие кучу юзкейсов. Посмотреть самому можно так:

```bash
mkdir full_template
cd full_template
nix flake init -t templates#full
cat flake.nix
```

Однако эти примеры нельзя просто взять и развернуть без изменений. Вот более рабочий пример:

```nix
{
  description = "Отличный флейк, зуб даю!";

  # В секции `inputs` лежат инпуты, a.k.a. зависимости флейка,
  # в то время как функция `outputs` возвращает результат его выполнения.
  # Во время деплоя элементы их `inputs` будут нагло выдернуты с гита,
  # собраны и переданы в `outputs`.
  inputs = {
    # Из кучи способов, которыми можно референсить инпуты (см. templates#full)
    # чаще всего встречаются `github:owner/name/reference` и 
    # `github:owner/name`. В общем-то URL типичного репозитория на гитхабе
    # плюс, в первом случае, ветка/id коммита/тэг.

    # Так, например, подрубается репозиторий nixos-unstable
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    # home-manager для декларативной конфигурации пользовательских хотелок
    home-manager = {
      url = "github:nix-community/home-manager";
      # или `url = "github:nix-community/home-manager/release-23.05";`,
      # если позарез нужен конкретный релиз.
      # Кейворд `follows` позволяет манипулировать инпутами других флейков
      # Тут `inputs.nixpkgs`home-manager'а станет таким же, как и у остальной
      # системы, чтобы не тащить 100500 разных версий одного репозитория и
      # избежать потенциальных проблем, связанных с этим.
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  # `outputs` представляют из себя результат выполнения флейка.
  # С учетом того, что у самих флейков множество юзкейсов, аутпуты также различаются.
  # Аргументы аутпутов крайне неожиданно задаются в инпутах.
  # Почти к каждому из них, за исключением `self`, указывающего на
  # сами `outputs`, можно обращаться по имени.
  # Использование `@` должно быть понятно из одностраничника, но на всякий
  # случай повторю: штука дает имя прилетевшему в аргументы аттрсету, 
  # так что обращаться к его содержимому можно через `input.attribute`
  # (более удобный/понятный вариант)
  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations = {
      # Функция `nixpkgs.lib.nixosSystem` разворачивает конфиг (аттрсет),
      # прилетающий ей в качестве параметра.

      "nixos-test" = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        # В дальнейшем будет показано, как использовать систему модулей
        # чтобы разбить конфиг на несколько файлов.

        # Каждый из параметов в списке `modules` - Nix-модуль,
        # информацию по ним можно почитать в 
        #  <https://nixos.org/manual/nixpkgs/unstable/#module-system-introduction>
        #
        # Модуль может представлять из себя аттрсет или функцию, 
        # возвращающую аттрсет. Чаще всего встречается последний случай,
        причем по дефолту модуль принимает только следующие параметры: 
        #
        #  lib:     библиотека функций из nixpkgs, см.
        #             https://nixos.org/manual/nixpkgs/stable/#id-1.4
        #  config:  all config options of the current flake
        #  options: all options defined in all NixOS Modules
        #             in the current flake
        #  pkgs:   аттрсет пакетов, определенных в nixpkgs.
        #            на текущий момент можно считать, что там лежит
        #            `nixpkgs.legacyPackages."${system}"`,
        #            на деле можно поменять, используя опцию `nixpkgs.pkgs`
        #  modulesPath: путь до модулей, лежащих в директории nixpkgs,
        #               позволяет импортировать ряд дополнительных модулей.
        #               Используется нечасто, пока замнем для ясности.
        #
        # Если требуется передать что-то еще, используют `specialArgs`:
        # specialArgs = {...}
        modules = [
          # Подтягиваем configuration.nix, в котором лежит конфиг,
          # созданный до перехода на flakes
          ./configuration.nix #да, это тоже nix-модуль
        ];
      };
    };
  };
}
```

По дефолту NixOS ищет в флейке `nixosConfigurations.имяХоста`, так что при запуске `sudo nixos-rebuild switch` на машине с хостнеймом nixos-test будет развернут импортированный ранее `config.nix`. Если же хост величают иначе, того же эффекта можно добиться, запустив `sudo nixos-rebuild switch --flake /path/to/flakes/directory#nixos-test` путь может быть как абсолютным, так и относительным.


В данном конкретном случае состояние системы не изменится, т.к. импортирован использовавшийся ранее `config.nix`.

## Пользуем систему на флейках

Операционка на флейках - эт, конечно, здорово, но неплохо бы разобраться с установкой софта. Для программ из `nixpkgs` установка не изменилась: положил название в `environment.systemPackages` - и в путь.

Установка из других источников уже интереснее. Для примера поставим [Helix](https://github.com/helix-editor/helix) из его гит-репозитория:

This provides greater flexibility, particularly when it comes to specifying software versions. 

First, we need to add Helix as an input in `flake.nix`:

```nix{10,20}
{
  description = "Отличный флейк, зуб даю!";

  # .. бла-бла-бла ...

  inputs = {
    # .. бла-бла-бла ...

    # Helix версии 23.05
    helix.url = "github:helix-editor/helix/23.05";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations = {
      nixos-test = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        # Кладем инпуты в specialArgs, что дает возможность
        # использовать инпут `helix` в сабмодулях
        specialArgs = inputs;
        modules = [
          ./configuration.nix
        ];
      };
    };
  };
}
```

Заползаем в `configuration.nix` и ставим `helix` из одноименного инпута:

```nix{3,14-15}
# `helix`, предеданный ранее через specialArgs, автоматом встанет
# в третий аргумент модуля (nix сопоставит одинаковые имена)
{ config, pkgs, helix, ... }:

{
  # Omit other configurations...

  environment.systemPackages = with pkgs; [
    git
    vim
    wget
    curl

    # собсна, инстоллим
    helix.packages."${pkgs.system}".helix
  ];

  # ... бла-бла-бла ...
}
```

Обязательный `sudo nixos-rebuild switch`, и `hx` можно запускать.

## Используем уже собранные пакеты (кэш сборки)

> Если нужный пакет не предоставляет такой опции или собирается досаточно быстро, на этот шаг можно забить.

Чтобы пользователям не приходилось тратить время на сборку всего с нуля, Nix предоставляет <https://cache.nixos.org>, где лежат результаты сборки различных пакетов.

Добавить сторонние провайдеры кэша можно используя параметр `nixConfig` в `flake.nix`:

```nix{4-19}
{
  description = "Отличный флейк, зуб даю!";

  nixConfig = {
    experimental-features = [ "nix-command" "flakes" ];
    substituters = [
      # Можно, например, добавить китайские зеркала (хотя я бы не советовал)
      "https://mirrors.ustc.edu.cn/nix-channels/store"
      "https://cache.nixos.org/"
    ];

    extra-substituters = [
      # Или сервера сообщества
      "https://nix-community.cachix.org"
    ];
    extra-trusted-public-keys = [
      # этим ребятам можно верить
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    # ... бла-бла-бла ...
  };

  outputs = {
    # ... бла-бла-бла ...
  };
}
```

И снова без `sudo nixos-rebuild switch` никуда.
