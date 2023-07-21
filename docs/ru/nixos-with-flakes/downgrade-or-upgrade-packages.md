# Обновлнение и откат пакетов

В определенных ситуациях может понадобиться обновить или откатить к предыдущей версии какой-либо из установленных пакетов (например, когда в новой версии заводятся баги). При использовании флейков для этого нужно проинструктировать Nix брать пакет из определенного коммита в репозитории (pinning).

Так можно добавить в флейк несколько версий nixpkgs c различными коммитами:

```nix{8-13,19-20,27-44}
{
  description = "NixOS configuration of Ryan Yin";

  inputs = {
    # дефолтный nixos-unstable
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    # Последняя стабильная версия (для отката версий пакетов)
    # На текущий момент 23.05
    nixpkgs-stable.url = "github:nixos/nixpkgs/nixos-23.05";

    # Конкретный коммит можно добавить через его хэш
    nixpkgs-fd40cef8d.url = "github:nixos/nixpkgs/fd40cef8d797670e203a27a91e4b8e6decf0b90c";
  };

  outputs = inputs@{
    self,
    nixpkgs,
    nixpkgs-stable,    # добавляем новые инпуты
    nixpkgs-fd40cef8d, # добавляем новые инпуты
    ...
  }: {
    nixosConfigurations = {
      nixos-test = nixpkgs.lib.nixosSystem rec {
        system = "x86_64-linux";

        # `specialArgs` для передачи других версий nixpkgs в модули
        specialArgs = {
          # Чтобы поставить пакет из ветки nixpkgs-stable,
          # нужно указать для нее ряд параметров
          pkgs-stable = import nixpkgs-stable {
            # использовать `system`, указанный ранее
            system = system;
            # Для проприетарного мусора, вроде хрома
            config.allowUnfree = true;
          };
          pkgs-fd40cef8d = import nixpkgs-fd40cef8d {
            system = system;
            config.allowUnfree = true;
          };
        };

        modules = [
          ./hosts/nixos-test

          # ... бла-бла-бла ...
        ];
      };
    };
  };
}
```

<!-- In the above example, we have defined multiple nixpkgs inputs: `nixpkgs`, `nixpkgs-stable`, and `nixpkgs-fd40cef8d`. Each input corresponds to a different git commit or branch. -->

Теперь в модулях можно обращаться к `pkgs-stable` или `pkgs-fd40cef8d`. В случае модуля для Home Manager выглядит так:

```nix{4-7,13,25}
{
  pkgs,
  config,
  # Nix will search for and inject this parameter
  # from `specialArgs` in `flake.nix`
  pkgs-stable,
  # pkgs-fd40cef8d,
  ...
}:

{
  # Установка из `pkgs-stable` вместо `pkgs`
  home.packages = with pkgs-stable; [
    firefox-wayland

    # В Chrome из nixos-unstable отвалилась поддержка Wayland,
    # так что ставим из стабильной ветки
    # https://github.com/swaywm/sway/issues/7562
    google-chrome
  ];

  programs.vscode = {
    enable = true;
    # Refer to vscode from `pkgs-stable` instead of `pkgs`
    package = pkgs-stable.vscode;
  };
}
```

После этого `sudo nixos-rebuild switch` откатит версии Firefox/Chrome/VSCode до таковых из `nixpkgs-stable` или `nixpkgs-fd40cef8d`.

> Если верить [1000 instances of nixpkgs](https://discourse.nixos.org/t/1000-instances-of-nixpkgs/17347), смена ветки во вложенных модулях с помощью `import` - плохая идея, т.к. каждый вызов функции создает новый nixpkgs, что с увеличением размера конфига все более негативно влияет на потребление ресурсов ПК и время сборки. Вместо этого все инстансы nixpkgs объявляются в `flake.nix`.
