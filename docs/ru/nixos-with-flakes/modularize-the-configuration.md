# Делим конфиг NixOS на модули

К этому моменту у нас есть скелет системы, а текущая структура `/etc/nixos` выглядит так:

```
$ tree
.
├── flake.lock
├── flake.nix
├── home.nix
└── configuration.nix
```

Роли четырех перечисленных файлов:

- `flake.lock`: автоматически сгенерированыый version-lock, хранящий используемые во флейке инпуты, их хэши и версии (обеспечивает "повторяемость" системы).
- `flake.nix`: Условно, заголовок флейка, его ищет `sudo nixos-rebuild switch`. С доступными там опциями можно ознакомиться в [Flakes - NixOS Wiki](https://nixos.wiki/wiki/Flakes).
- `configuration.nix`: Nix-модуль, который мы импортируем в flake.nix, пока что там конфигурируется весь "системный" софт. См. [Configuration - NixOS Manual](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration) для определения доступных опций.
- `home.nix`: Импортируется через Home-Manager, устанавливает и конфигурирует софт для пользователя `ryan`. Опции: [Appendix A. Configuration Options - Home-Manager](https://nix-community.github.io/home-manager/options.html).

Модификация `configuration.nix` и `home.nix` меняет состояние системы и домашней директории пользователя соответственно.

Однако с увеличением количества установленного софта `configuration.nix` и `home.nix` запросто могут стать огромными кусками трудночитаемого кода. Более удобный вариант - использовать систему модулей Nix, чтобы удобно разложить конфиги программ в отдельные файлы.

Для упрощения этой задачи в системе модулей Nix есть атрибут `imports`. Он берет на вход список `.nix`-файлов и импортирует их в текущий модуль. Стоит заметить, что `imports` не переписывает повторяющиеся опции в конфиге. Например, если пользователь прописал `program.packages = [...]` в нескольких модулях, `imports` соединит все `program.packages` в один список, с attrset-ами ситуация та же.

> I only found a description of `imports` in [Nixpkgs-Unstable Official Manual - evalModules Parameters](https://nixos.org/manual/nixpkgs/unstable/#module-system-lib-evalModules-parameters): `A list of modules. These are merged together to form the final configuration.` It's a bit ambiguous...

Ожидаемо, с помощью `imports`, можно разделить `home.nix` и `configuration.nix` на несколько модулей, лежащих в своих `.nix`-файлах.

Например, в [ryan4yin/nix-config/v0.0.2](https://github.com/ryan4yin/nix-config/tree/v0.0.2) можно найти конфиг NixOS [автора книги], в котором используется оконник i3. Структура конфига такая:

```shell
├── flake.lock
├── flake.nix
├── home
│   ├── default.nix         # тут используется imports = [...] для импорта других модулей
│   ├── fcitx5              # конфигурация fcitx5 (см. главу про оверрайды/оверлеи)
│   │   ├── default.nix
│   │   └── rime-data-flypy
│   ├── i3                  # конфиги оконника
│   │   ├── config
│   │   ├── default.nix
│   │   ├── i3blocks.conf
│   │   ├── keybindings
│   │   └── scripts
│   ├── programs
│   │   ├── browsers.nix
│   │   ├── common.nix
│   │   ├── default.nix   # Снова используется imports = [...]
│   │   ├── git.nix
│   │   ├── media.nix
│   │   ├── vscode.nix
│   │   └── xdg.nix
│   ├── rofi              # рофленые конфиги rofi
│   │   ├── configs
│   │   │   ├── arc_dark_colors.rasi
│   │   │   ├── arc_dark_transparent_colors.rasi
│   │   │   ├── power-profiles.rasi
│   │   │   ├── powermenu.rasi
│   │   │   ├── rofidmenu.rasi
│   │   │   └── rofikeyhint.rasi
│   │   └── default.nix
│   └── shell             # конфиги шелла/терминала
│       ├── common.nix
│       ├── default.nix
│       ├── nushell
│       │   ├── config.nu
│       │   ├── default.nix
│       │   └── env.nu
│       ├── starship.nix
│       └── terminals.nix
├── hosts
│   ├── msi-rtx4090      # Конфиги рабочей машины
│   │   ├── default.nix  # когда-то был `configuration.nix`-ом, но потом сбросил вес и поделился на модули.
│   │   └── hardware-configuration.nix  # результат хардварного скана, автоматически сгенерированный
│   └── nixos-test       # тестовый конфиг
│       ├── default.nix
│       └── hardware-configuration.nix
├── modules          # модули, пригодные к многократному использованию
│   ├── i3.nix
│   └── system.nix
└── wallpaper.jpg    # обоина
```

Всем желающим посмотреть реализацию конфига в деталях предлагается пройти в упомянутую репу.

## `lib.mkOverride`, `lib.mkDefault` и `lib.mkForce`

В ряде конфигов встречается использование `lib.mkDefault` и `lib.mkForce` для работы с дефолтными значениями параметров. Первая функция задает такое значение, вторая - форсирует его изменение.

Исходники этих функций можно посмотреть, запустив `nix repl -f '<nixpkgs>'` и введя туда `:e lib.mkDefault`, а если в `nix repl` ввести `:?`, он покажет свой мануал.

Итак, сырцы:

```nix
  # ......

  mkOverride = priority: content:
    { _type = "override";
      inherit priority content;
    };

  mkOptionDefault = mkOverride 1500; # priority of option defaults
  mkDefault = mkOverride 1000; # used in config sections of non-user modules to set a default
  mkImageMediaOverride = mkOverride 60; # image media profiles can be derived by inclusion into host config, hence needing to override host config, but do allow user to mkForce
  mkForce = mkOverride 50;
  mkVMOverride = mkOverride 10; # used by ‘nixos-rebuild build-vm’

  # ......
```

Понимаем, что `lib.mkDefault` ставит опции приоритет 1000, а `lib.mkForce` - 50. Если ввести значение атрибута руками, оно будет иметь тот же приоритет, что и с `lib.mkDefault` (1000).

Чем ниже значение приоритета, тем "важнее" на самом деле значение. Соответственно, значение, установленное через `lib.mkForce` перепишет установленное через `lib.mkDefault`, а попытка несколько раз задать атрибуту значения с одним и тем же приоритетом приведут к ошибке.

При делении конфига на модули использование этих функций позволяет задать ряд дефолтных значений в базовом модуле и переписать их на что-то другое в модулях, основанных на нем.

Например, в конфигурации [автора] [ryan4yin/nix-config/blob/main/modules/nixos/core-server.nix#L30](https://github.com/ryan4yin/nix-config/blob/main/modules/nixos/core-server.nix#L30) есть такой дефолт:

```nix{6}
{ lib, pkgs, ... }:

{
  # ......

  nixpkgs.config.allowUnfree = lib.mkDefault false;

  # ......
}
```

В дальнейшем в конфиге десктопа [ryan4yin/nix-config/blob/main/modules/nixos/core-desktop.nix#L15](https://github.com/ryan4yin/nix-config/blob/main/modules/nixos/core-desktop.nix#L15) оно меняется на `true`:

```nix{10}
{ lib, pkgs, ... }:

{
  # import the base module
  imports = [
    ./core-server.nix
  ];

  # override the default value defined in the base module
  nixpkgs.config.allowUnfree = lib.mkForce true;

  # ......
}
```

## `lib.mkOrder`, `lib.mkBefore` и `lib.mkAfter`

Помимо `lib.mkDefault` и `lib.mkForce`, существуют `lib.mkBefore` и `lib.mkAfter`, определяющие приоритет объединения списков, что также полезно в задачах модуляризации.

Также `lib.mkOrder`, `lib.mkBefore` и `lib.mkAfter` позволяют указать порядок объединения атрибутов с одинаковым приоритетом и не получить ошибку.

Посмотрим на исходники `lib.mkBefore`: `nix repl -f '<nixpkgs>'`, затем `:e lib.mkBefore`:

```nix
  # ......

  mkOrder = priority: content:
    { _type = "order";
      inherit priority content;
    };

  mkBefore = mkOrder 500;
  mkAfter = mkOrder 1500;

  # The default priority for things that don't have a priority specified.
  defaultPriority = 100;

  # ......
```

Понимаем, что `lib.mkBefore` эквивалентен `lib.mkOrder 500`, а `lib.mkAfter` -- `lib.mkOrder 1500`.

Для демонстрации использования `lib.mkBefore` и `lib.mkAfter` создадим небольшой флейк:

```shell{16-29}
› cat <<EOF | sudo tee flake.nix
{
  description = "Ryan's NixOS Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations = {
      "nixos-test" = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        modules = [
          # Demo module 1: вставляем гит в начало списка
          ({lib, pkgs, ...}: {
            environment.systemPackages = lib.mkBefore [pkgs.git];
          })

          # Demo module 2: вставляем 'vim' в конец списка
          ({lib, pkgs, ...}: {
            environment.systemPackages = lib.mkAfter [pkgs.vim];
          })

          # Demo module 3: (просто) добавляем curl
          ({lib, pkgs, ...}: {
            environment.systemPackages = with pkgs; [curl];
          })
        ];
      };
    };
  };
}
EOF

# создаем flake.lock
› nix flake update

› nix repl
Welcome to Nix 2.13.3. Type :? for help.

# загружаем созданный ранее флейк
nix-repl> :lf .
Added 9 variables.

# смотрим systemPackages
nix-repl> outputs.nixosConfigurations.nixos-test.config.environment.systemPackages
[ «derivation /nix/store/0xvn7ssrwa0ax646gl4hwn8cpi05zl9j-git-2.40.1.drv»
  «derivation /nix/store/7x8qmbvfai68sf73zq9szs5q78mc0kny-curl-8.1.1.drv»
  «derivation /nix/store/bly81l03kh0dfly9ix2ysps6kyn1hrjl-nixos-container.drv»
  ......
  ......
  «derivation /nix/store/qpmpv

q5azka70lvamsca4g4sf55j8994-vim-9.0.1441.drv» ]
```

Видим, что порядок `systemPackages` следующий: `git -> curl -> дефолтные пакеты -> vim`, что соответствует порядку, заданному в `flake.nix`.

> Хотя изменение порядка пакетов в `systemPackages` никому не интересно, фича полезна в других сценариях.

## Литература

- [Nix modules: Improving Nix's discoverability and usability](https://cfp.nixcon.org/nixcon2020/talk/K89WJY/)
- [Module System - Nixpkgs](https://github.com/NixOS/nixpkgs/blob/nixos-unstable/doc/module-system/module-system.chapter.md)
