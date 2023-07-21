# Другие полезности

## Загрузка конфига в Git

Поскольку конфиг NixOS представляет из себя набор текстовых файлов, с ним отлично работают системы контроля версий наподобие git.

Однако дефолтное расположение конфига в `/etc/nixos` и необходимость повышенных привиллегий для изменения лежащих там файлов несколько портят малину. Есть несколько способов положить конфиг в более удобное место.

Во-превых, можно переместить его, например, в `~/nixos-config` и симлинкнуть директорию в `/etc/nixos`:

```shell
sudo mv /etc/nixos /etc/nixos.bak  # Backup the original configuration
sudo ln -s ~/nixos-config/ /etc/nixos

# Deploy the flake.nix located at the default location (/etc/nixos)
sudo nixos-rebuild switch
```

Таким образом можно пользовать гит для `~/nixos-config` и ходить в последний с правами пользователя.

В качестве альтернативы можно просто удалить `/etc/nixos` и указывать при апдейтах путь до флейка:

```shell
sudo mv /etc/nixos /etc/nixos.bak
cd ~/nixos-config

# `--flake .#nixos-test` разворачивает flake.nix, лежащий в текущей директории
sudo nixos-rebuild switch --flake .#nixos-test
```

Из плюшек использования git - теперь можно быстро откатиться к любой версии конфика, переключившись на нужный коммит:

```shell
cd ~/nixos-config
# переключаемся на предыдущий коммит
git checkout HEAD^1

sudo nixos-rebuild switch --flake .#nixos-test
```

## Просмотр и удаление предыдущих поколений

Как упоминалось ранее, каждый `rebuild-switch` создает новое поколение и добавляет опцию загрузиться в него. Список всех поколений можно узнать следующим образом:

```shell
nix profile history --profile /nix/var/nix/profiles/system
```

А удалить старые для освобождения пространства на диске - так:

```shell
# Удалить поколения старше 7 дней 
sudo nix profile wipe-history --older-than 7d --profile /nix/var/nix/profiles/system

# Запустить сборщик мусора, который удалит из nix store ненужные более версии программ
sudo nix store gc --debug
```

Еще есть `nix-env -qa`, так можно узнать список установленного софта.

## Уменьшаем потребление дискового пространства

Следующийе опции в конфиге помогут ограничить использования дискового пространства:

```nix
{ lib, pkgs, ... }:

{
  # ...

  # Ограничиваем количество поколений в загрузчике
  boot.loader.systemd-boot.configurationLimit = 10;
  # boot.loader.grub.configurationLimit = 10;

  # Автоматическое удаление поколений старше недели
  nix.gc = {
    automatic = true;
    dates = "weekly";
    options = "--delete-older-than 1w";
 };

  # Оптимизация nix store
  #   Можно запустить руками: nix-store --optimise
  # или автоматически
  nix.settings.auto-optimise-store = true;
  # Больше информации про оптимизацию пространства:
  # https://nixos.org/manual/nix/stable/command-ref/conf-file.html#conf-auto-optimise-store
}
```
