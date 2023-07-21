# Знакомство с Home Manager

Как упоминалось ранее, средствами NixOS можно конфигурировать софт на уровне системы, в то время как декларативное управление пользовательскими настройками осуществляется с помощью утилиты Home Manager (в дальнейшем иногда hm). [Тут](https://nix-community.github.io/home-manager/index.html) лежит его официальная документация.

Чтобы поставить Home Manager в NixOS, сначала создаем `/etc/nixos/home.nix` (предполагается, что системный флейк живет в `/etc/nixos`). Его содержимое может выглядеть так:

```nix
{ config, pkgs, ... }:

{
  # TODO юзернейм и homeDirectory нужно поменять на свои
  home.username = "ryan";
  home.homeDirectory = "/home/ryan";

  # симлинкаем файл `wallpaper.jpg` из текущей директории в `.config/i3/wallpaper.jpg` в домашней директории пользователя
  # home.file.".config/i3/wallpaper.jpg".source = ./wallpaper.jpg;

  # симлинкаем все файлы из `./scripts` в `~/.config/i3/scripts`
  # home.file.".config/i3/scripts" = {
  #   source = ./scripts;
  #   recursive = true;   # link recursively
  #   executable = true;  # make all files executable
  # };

  # задаем содержимое файла сразу в конфиге hm
  # home.file.".xxx".text = ''
  #     xxx
  # '';

  # устанавливаем размер курсора и dpi под 4k монитор
  xresources.properties = {
    "Xcursor.size" = 16;
    "Xft.dpi" = 172;
  };

  # конфиг git, значения снова надо менять на свои
  programs.git = {
    enable = true;
    userName = "Ryan Yin";
    userEmail = "xiaoyin_c@qq.com";
  };

  # какой софт ставить для текущего пользователя (не системно),
  home.packages = with pkgs; [

    neofetch
    nnn # консольный файловый менеджер

    # (раз)архивирование
    zip
    xz
    unzip
    p7zip

    # утилиты
    ripgrep # как grep, но быстрее
    jq # легковесная тулза для работы с JSON
    yq-go # то же, но для https://github.com/mikefarah/yq
    exa # ‘ls’ с красивостями
    fzf # A command-line fuzzy finder

    # тулзы для работы с сетью
    mtr      # сетевая диагностика
    iperf3
    dnsutils # `dig` + `nslookup`
    ldns     # `drill`, альтернатива `dig`
    aria2    # A lightweight multi-protocol & multi-source command-line download utility
    socat    # замена openbsd'шного netcat
    nmap     # A utility for network discovery and security auditing
    ipcalc   # калькулятор адресов IPv4/v6

    # разное
    cowsay
    file
    which
    tree
    gnused
    gnutar
    gawk
    zstd
    gnupg

    # никсовое
    nix-output-monitor # `nom`, по сути `nix`, но более детализированные логи

    # productivity
    hugo # генератор статичных сайтов
    glow # превью markdown в терминале

    btop  # замена htop/nmon
    iotop # мониторинг операций ввода/вывода
    iftop # сетевой мониторинг

    # мониторинг системных вызовов
    strace 
    ltrace # следит за вызовами функций из библиотек
    lsof   # мониторит открытые софтом файлы

    # системное
    sysstat
    lm_sensors # мониторинг различных сенсоров пк
    ethtool
    pciutils # lspci
    usbutils # lsusb
  ];

  # starship - гибкий prompt для любого шелла
  programs.starship = {
    enable = true;
    settings = {
      add_newline = false;
      aws.disabled = true;
      gcloud.disabled = true;
      line_break.disabled = true;
    };
  };

  # alacritty - эмулятор терминала
  programs.alacritty = {
    enable = true;
    settings = {
      env.TERM = "xterm-256color";
      font = {
        size = 12;
        draw_bold_text_with_bright_colors = true;
      };
      scrolling.multiplier = 5;
      selection.save_to_clipboard = true;
    };
  };

  programs.bash = {
    enable = true;
    enableCompletion = true;
    # TODO сюда кидаем содержимое .bashrc
    bashrcExtra = ''
      export PATH="$PATH:$HOME/bin:$HOME/.local/bin:$HOME/go/bin"
    '';

    shellAliases = {
      k = "kubectl";
      urldecode = "python3 -c 'import sys, urllib.parse as ul; print(ul.unquote_plus(sys.stdin.read()))'";
      urlencode = "python3 -c 'import sys, urllib.parse as ul; print(ul.quote_plus(sys.stdin.read()))'";
    };
  };

  # This value determines the home Manager release that your
  # configuration is compatible with. This helps avoid breakage
  # when a new home Manager release introduces backwards
  # incompatible changes.
  #
  # You can update home Manager without changing this value. See
  # the home Manager release notes for a list of state version
  # changes in each release.
  home.stateVersion = "23.05";

  # Let home Manager install and manage itself.
  programs.home-manager.enable = true;
}
```

`/etc/nixos/home.nix` написали, осталось импортировать его в `/etc/nixos/flake.nix`. Как это сделать можно посмотреть в темплейте hm:

> Примечание: тут достаточно странный момент, т.к. до этого автор постепенно строил один флейк, а теперь предлагает сгенерить новый
> в той же директории. Если будет время, создам issue на гите, пока что меняю на создание шаблона в новой директории

```shell
mkdir test
cd test
nix flake new example -t github:nix-community/home-manager#nixos
```

Из созданного шаблона должно быть понятно, как изменить `/etc/nixos/flake.nix` для подключения созданного ранее модуля hm:

```nix
{
  description = "NixOS configuration";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    # подтягиваем hm в флейк
    home-manager.url = "github:nix-community/home-manager";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = inputs@{ nixpkgs, home-manager, ... }: {
    nixosConfigurations = {
      # TODO please change the hostname to your own
      nixos-test = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./configuration.nix

          # использование home-manager в качестве модуля позволяет ему автоматически
          # деплоить пользовательские конфиги при выполнении `nixos-rebuild switch`
          home-manager.nixosModules.home-manager
          {
            home-manager.useGlobalPkgs = true;
            home-manager.useUserPackages = true;

            # TODO меняем ryan на свой юзернейм
            home-manager.users.ryan = import ./home.nix;

            # передать в home.nix дополнительные параметны можно с помощью home-manager.extraSpecialArgs
            # по аналогии с использованием specialArgs в предыдущей главе
          }
        ];
      };
    };
  };
}
```

Применяем изменения, выполнив `sudo nixos-rebuild switch`. При этом будет установлен home-manager и прописанный в `home.nix` софт.

<!-- After the installation, all user-level packages and configuration can be managed through `/etc/nixos/home.nix`. When running `sudo nixos-rebuild switch`, the configuration of home-manager will be applied automatically. (**It's not necessary to run `home-manager switch` manually**!) -->

Узнать, какой софт можно ставить через hm и как его настраивать можно так:

- Почитать [Home Manager - Appendix A. Configuration Options](https://nix-community.github.io/home-manager/options.html): список всех опций hm; Ctrl+F - и в путь;
  - Альтернативно можно воспользоваться [Home Manager Option Search](https://mipmip.github.io/home-manager-option-search/). Тулза предоставляет ту же информацию, но сильно упрощает поиск;
- Курить исходники [home-manager](https://github.com/nix-community/home-manager): некоторые опции могут быть не указаны в доках или иметь невнятное описание.

## Home Manager или NixOS

Один и тот же софт часто можно поставить как средставами NixOS (`configuration.nix`), так и используя Home Manager (`home.nix`), следовательно нужно знать **в чем заключается разница между ними и что стоит использовать в различных юзкейсах**

Сперва о различиях. Пакеты, установленные и сконфигурированные средствами NixOS доступны для любого пользователя в системе, их конфиги как правило лежат (симлинкнуты) в `/etc`. С другой стороны, Home Manager ставит и конфигурирует софт для конкретного пользователя, соответственно другие не смогут его использовать.

Таким образом, рекомендуется выбирать:

- Модули NixOS: для установки необходимого для работы системы или используемого всеми пользователями (включая root) софта;
- Home Manager: для всего остального.
